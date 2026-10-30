import { all, get } from '../db.js';
import { formatTime, toLocalIso } from '../lib/time.js';
import { getAiConfig, translateToKinyarwanda } from './huggingface.js';

const KINYARWANDA_WORDS = [
  'muraho',
  'amahoro',
  'mwaramutse',
  'mwiriwe',
  'bisi',
  'ijya',
  'zijya',
  'itike',
  'ryari',
  'angahe',
  'hehe',
  'kujya',
  'kuva',
  'haguruka',
  'ihaguruka',
  'zihaguruka',
  'saa',
  'amafaranga',
  'icyicaro',
  'imyanya',
  'umwanya',
  'ubufasha',
  'ndashaka',
  'nshobora',
  'mbona',
  'yego',
  'oya',
  'cyane',
  'nyabugogo',
  'inzira'
];

const SUGGESTIONS = [
  'Bus ijya Musanze ihaguruka ryari?',
  'Itike yo kujya Huye ni angahe?',
  'How many seats are left to Rubavu?',
  'Where can I verify my QR ticket?'
];

function isKinyarwanda(text) {
  const lower = text.toLowerCase();
  return KINYARWANDA_WORDS.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(lower));
}

function findRoute(text) {
  const lower = text.toLowerCase();
  return all('SELECT * FROM routes').find((route) =>
    lower.includes(route.destination.toLowerCase())
  );
}

function upcomingBuses(routeId, limit = 3) {
  const now = toLocalIso();
  const rows = routeId
    ? all(
        `SELECT b.*, c.name AS company_name, r.destination,
                (SELECT COUNT(*) FROM seats s WHERE s.bus_id = b.id AND s.status = 'available') AS seats_available
         FROM buses b
         JOIN companies c ON c.id = b.company_id
         JOIN routes r ON r.id = b.route_id
         WHERE b.route_id = ? AND b.departure_at > ?
         ORDER BY b.departure_at LIMIT ?`,
        routeId,
        now,
        limit
      )
    : all(
        `SELECT b.*, c.name AS company_name, r.destination,
                (SELECT COUNT(*) FROM seats s WHERE s.bus_id = b.id AND s.status = 'available') AS seats_available
         FROM buses b
         JOIN companies c ON c.id = b.company_id
         JOIN routes r ON r.id = b.route_id
         WHERE b.departure_at > ?
         ORDER BY b.departure_at LIMIT ?`,
        now,
        limit
      );
  return rows;
}

function priceRange(route) {
  const rows = all(
    'SELECT MIN(price) AS min_price, MAX(price) AS max_price FROM buses WHERE route_id = ?',
    route.id
  );
  return rows[0];
}

function formatDepartureList(buses, lang) {
  return buses
    .map((bus, index) => {
      const time = formatTime(bus.departure_at);
      if (lang === 'kin') {
        return `${index + 1}. ${bus.company_name} saa ${time} — imyanya ${bus.seats_available} isigaye, ${bus.price.toLocaleString('en-RW')} RWF`;
      }
      return `${index + 1}. ${bus.company_name} at ${time} — ${bus.seats_available} seats left, RWF ${bus.price.toLocaleString('en-RW')}`;
    })
    .join('\n');
}

function ticketOptions(buses, lang) {
  return buses.map((bus) => ({
    busId: bus.id,
    company: bus.company_name,
    destination: bus.destination,
    departureAt: bus.departure_at,
    departureLabel: formatTime(bus.departure_at),
    seatsAvailable: bus.seats_available,
    price: bus.price,
    lang
  }));
}

function buildAnswer({ intent, route, buses, lang }) {
  const destinations = all('SELECT destination FROM routes ORDER BY destination')
    .map((row) => row.destination)
    .join(', ');

  if (intent === 'greeting') {
    return lang === 'kin'
      ? 'Muraho! Ndi NyabuGo Assistant. Nshobora kukubwira igihe bisi zihaguruka, ibiciro, imyanya isigaye n’itike ya QR. Baza uti: “Bisi ijya Musanze ihaguruka ryari?”'
      : 'Hello! I am the NyabuGo assistant. I can help with departure times, fares, seat availability and QR tickets. Ask me: “When does the Musanze bus leave?”';
  }

  if (intent === 'price') {
    if (!route) {
      return lang === 'kin'
        ? `Itike itangira kuri 2,500 RWF (Rwamagana) kugera kuri 9,000 RWF (Rusizi). Inzira ziriho: ${destinations}.`
        : `Fares start at RWF 2,500 (Rwamagana) and go up to RWF 9,000 (Rusizi). Available routes: ${destinations}.`;
    }
    const range = priceRange(route);
    return lang === 'kin'
      ? `Itike yo kujya ${route.destination} itangira kuri ${range.min_price.toLocaleString('en-RW')} RWF kugera kuri ${range.max_price.toLocaleString('en-RW')} RWF bitewe na sosiyete.`
      : `A one-way ticket from Nyabugogo to ${route.destination} costs between RWF ${range.min_price.toLocaleString('en-RW')} and RWF ${range.max_price.toLocaleString('en-RW')}, depending on the operator.`;
  }

  if (intent === 'schedule' || intent === 'seats') {
    if (!buses.length) {
      return lang === 'kin'
        ? `Nta bisi zisigaye zihaguruka uyu munsi zijya ${route ? route.destination : 'ahandi'}. Reba ingendo z'ejo.`
        : `There are no more departures today${route ? ` to ${route.destination}` : ''}. Please check tomorrow's schedule.`;
    }
    const header =
      lang === 'kin'
        ? `Bisi zikurikira ${route ? `zijya ${route.destination}` : 'ziva Nyabugogo'}:`
        : `Next departures ${route ? `to ${route.destination}` : 'from Nyabugogo'}:`;
    return `${header}\n${formatDepartureList(buses, lang)}`;
  }

  if (intent === 'ticket') {
    return lang === 'kin'
      ? 'Kanda “Book”, uhitemo icyicaro, wandike nimero ya telefoni, wishyure na MTN MoMo cyangwa Airtel Money, hanyuma ubone itike ya QR. Abayobozi bayisikana muri “Scanner”.'
      : 'Tap “Book”, choose a seat, enter your phone number and pay with MTN MoMo or Airtel Money. Your QR ticket is generated instantly and can be validated at the Scanner portal.';
  }

  if (intent === 'routes') {
    return lang === 'kin'
      ? `NyabuGo ikorana n’inzira zikurikira uva Nyabugogo: ${destinations}.`
      : `NyabuGo currently serves these routes from Nyabugogo: ${destinations}.`;
  }

  if (intent === 'thanks') {
    return lang === 'kin' ? 'Murakoze! Ugire urugendo rwiza.' : 'You are welcome! Have a safe journey.';
  }

  return lang === 'kin'
    ? 'Sinabyumvise neza. Nshobora kugufasha ku bijyanye n’igihe bisi zihaguruka, ibiciro, imyanya isigaye cyangwa itike yawe. Urugero: “Bisi ijya Rubavu ihaguruka ryari?”'
    : 'I did not quite catch that. I can help with departure times, fares, seat availability or QR tickets. Try: “When does the bus to Rubavu leave?”';
}

function detectIntent(text) {
  const lower = text.toLowerCase();
  if (/^(hi|hello|hey|muraho|amahoro|mwaramutse|mwiriwe|bite)\b/i.test(lower)) {
    return 'greeting';
  }
  if (/(thank|merci|murakoze)/i.test(lower)) return 'thanks';
  if (/(when|time|depart|leave|schedule|ryari|haguruka|saa|igihe)/i.test(lower)) {
    return 'schedule';
  }
  if (/(price|fare|cost|how much|angahe|amafaranga|biciro)/i.test(lower)) return 'price';
  if (/(seat|available|space|umwanya|imyanya|icyicaro)/i.test(lower)) return 'seats';
  if (/(ticket|itike|qr|verify|scan|status)/i.test(lower)) return 'ticket';
  if (/(route|destination|where do|kujya he|inzira|ahantu)/i.test(lower)) return 'routes';
  return 'unknown';
}

export async function answerChat(message) {
  const text = String(message || '').trim();
  if (!text) {
    return {
      reply: 'Please type a question about bus schedules, fares, seats or tickets.',
      lang: 'en',
      intent: 'unknown',
      source: 'local',
      suggestions: SUGGESTIONS
    };
  }

  const lang = isKinyarwanda(text) ? 'kin' : 'en';
  const route = findRoute(text);
  const intent = detectIntent(text);
  const buses =
    intent === 'schedule' || intent === 'seats' || intent === 'price'
      ? upcomingBuses(route?.id, 3)
      : [];

  const localReply = buildAnswer({ intent, route, buses, lang });
  let reply = localReply;
  let source = 'local-nlu';
  const config = getAiConfig();

  if (lang === 'kin' && config.enabled) {
    try {
      const englishReply = buildAnswer({ intent, route, buses, lang: 'en' });
      const translated = await translateToKinyarwanda(englishReply);
      if (translated && translated.length > 10) {
        reply = translated;
        source = 'huggingface-nllb';
      }
    } catch (error) {
      source = 'local-nlu';
      console.warn('[NyabuGo] HF translation fallback:', error.message);
    }
  }

  return {
    reply,
    lang,
    intent,
    source,
    model: source === 'huggingface-nllb' ? config.chatModel : 'nyabugo-rules-v1',
    options: ticketOptions(buses, lang),
    suggestions: SUGGESTIONS
  };
}

export function getChatContext() {
  return {
    origin: 'Nyabugogo, Kigali',
    routes: all('SELECT destination, district, region, base_fare FROM routes ORDER BY destination').map(
      (row) => ({
        destination: row.destination,
        district: row.district,
        region: row.region,
        baseFare: row.base_fare
      })
    )
  };
}

export function sampleChatQuestions() {
  return SUGGESTIONS;
}
