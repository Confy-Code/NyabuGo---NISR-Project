import './env.js';
import { all, db, get, initSchema, run, transaction } from './db.js';
import {
  COMPANIES,
  DRIVER_NAMES,
  NISR_DATASET,
  PASSENGER_NAMES,
  PHONE_NUMBERS,
  ROUTES
} from './data/nisr.js';
import { generateTicketCode, makeQrPayload } from './lib/tickets.js';
import { addDays, addMinutes, atTime, toDateStr, toLocalIso } from './lib/time.js';

const CAPACITY = 30;
const SEATS_PER_BUS = 30;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(list) {
  return list[randomInt(0, list.length - 1)];
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function paymentForPhone(phone) {
  return phone.startsWith('078') || phone.startsWith('079') ? 'mtn_momo' : 'airtel_money';
}

function paymentReference(method) {
  const prefix = method === 'mtn_momo' ? 'MOMO' : 'AIRTEL';
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomInt(1000, 9999)}`;
}

function clearDatabase() {
  db.exec(`
    DELETE FROM demand_history;
    DELETE FROM bookings;
    DELETE FROM seats;
    DELETE FROM buses;
    DELETE FROM companies;
    DELETE FROM routes;
    DELETE FROM nisr_metrics;
  `);
  try {
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('demand_history','bookings','seats','buses','companies','routes','nisr_metrics');");
  } catch {
    // sqlite_sequence may not exist on a brand new database.
  }
}

function seedNisr() {
  const insert = db.prepare(`
    INSERT INTO nisr_metrics (dataset_id, variable, category, label, value_pct, valid_n, sample_size, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const metric of NISR_DATASET.variables) {
    insert.run(
      NISR_DATASET.id,
      metric.variable,
      metric.category,
      metric.label,
      metric.valuePct,
      metric.validN,
      metric.sampleSize,
      metric.notes
    );
  }
}

function seedRoutes() {
  const insert = db.prepare(`
    INSERT INTO routes (origin, destination, district, region, distance_km, duration_min, base_fare, nisr_commute_weight, regional_multiplier)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const route of ROUTES) {
    insert.run(
      'Nyabugogo, Kigali',
      route.destination,
      route.district,
      route.region,
      route.distanceKm,
      route.durationMin,
      route.baseFare,
      4.1,
      route.regionalMultiplier
    );
  }
}

function seedCompanies() {
  const insert = db.prepare(
    'INSERT INTO companies (name, code, color, premium) VALUES (?, ?, ?, ?)'
  );
  for (const company of COMPANIES) {
    insert.run(company.name, company.code, company.color, company.premium);
  }
}

function seedDemandHistory(routeRows) {
  const insert = db.prepare(`
    INSERT INTO demand_history (route_id, recorded_at, hour, day_of_week, bookings, nisr_baseline)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  const peak = (hour) => {
    if (hour >= 6 && hour <= 8) return 1.6;
    if (hour >= 16 && hour <= 19) return 1.85;
    if (hour >= 9 && hour <= 15) return 0.95;
    return 0.35;
  };
  const dayFactor = [0.8, 1, 1, 1.05, 1.15, 1.4, 1.2];

  for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
    const day = addDays(today, -dayOffset);
    for (const route of routeRows) {
      const baseline = 8 + route.nisr_commute_weight * route.regional_multiplier * 2.2;
      for (let hour = 5; hour <= 21; hour += 1) {
        const noise = randomInt(-4, 7);
        const bookings = Math.max(
          2,
          Math.round(baseline * peak(hour) * dayFactor[day.getDay()] + noise)
        );
        insert.run(
          route.id,
          toDateStr(day),
          hour,
          day.getDay(),
          bookings,
          Number((route.nisr_commute_weight * route.regional_multiplier).toFixed(3))
        );
      }
    }
  }
}

function buildDepartures(routeIndex) {
  const now = new Date();
  const departures = [];

  departures.push({
    departure: addMinutes(now, -(32 + routeIndex * 3)),
    presale: { min: 16, max: 26 },
    used: true
  });

  for (let i = 0; i < 4; i += 1) {
    departures.push({
      departure: addMinutes(now, 25 + routeIndex * 6 + i * 80),
      presale: { min: 2, max: 14 },
      used: false
    });
  }

  const tomorrow = addDays(now, 1);
  const tomorrowSlots = [6, 9, 12, 15, 18];
  tomorrowSlots.forEach((hour, i) => {
    departures.push({
      departure: atTime(tomorrow, hour, routeIndex * 10 + i * 2),
      presale: { min: 0, max: 6 },
      used: false
    });
  });

  return departures;
}

function seedFleet(routeRows, companyRows) {
  const insertBus = db.prepare(`
    INSERT INTO buses (company_id, route_id, plate_number, bus_number, capacity, price, driver_name, departure_at, arrival_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSeat = db.prepare('INSERT INTO seats (bus_id, seat_number, status) VALUES (?, ?, ?)');
  const insertBooking = db.prepare(`
    INSERT INTO bookings (ticket_code, passenger_name, phone, payment_method, payment_ref, bus_id, seat_numbers, quantity, amount, status, qr_payload, booked_at, used_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let busCounter = 1;
  const now = new Date();
  const startOfToday = atTime(now, 0, 0);

  routeRows.forEach((route, routeIndex) => {
    const departures = buildDepartures(routeIndex);

    departures.forEach((slot, departureIndex) => {
      const company = companyRows[(routeIndex + departureIndex) % companyRows.length];
      const price = route.base_fare + company.premium;
      const departure = slot.departure;
      const arrival = addMinutes(departure, route.duration_min);
      const plate = `RAB ${100 + busCounter} ${String.fromCharCode(65 + (busCounter % 26))}`;
      const busNumber = `NYB-${String(pad(busCounter))}`;

      const info = insertBus.run(
        company.id,
        route.id,
        plate,
        busNumber,
        CAPACITY,
        price,
        DRIVER_NAMES[(busCounter - 1) % DRIVER_NAMES.length],
        toLocalIso(departure),
        toLocalIso(arrival)
      );
      const busId = Number(info.lastInsertRowid);

      for (let seat = 1; seat <= SEATS_PER_BUS; seat += 1) {
        insertSeat.run(busId, seat, 'available');
      }

      const soldCount = randomInt(slot.presale.min, slot.presale.max);
      const soldSeats = shuffle(Array.from({ length: SEATS_PER_BUS }, (_, i) => i + 1)).slice(
        0,
        soldCount
      );

      for (const seat of soldSeats) {
        const phone = pickRandom(PHONE_NUMBERS);
        const method = paymentForPhone(phone);
        const code = generateTicketCode();
        const bookedAt = new Date(
          Math.max(
            startOfToday.getTime() + 5 * 60 * 1000,
            now.getTime() - randomInt(30, 360) * 60 * 1000
          )
        );
        const status = slot.used ? 'used' : 'paid';
        insertBooking.run(
          code,
          pickRandom(PASSENGER_NAMES),
          phone,
          method,
          paymentReference(method),
          busId,
          String(seat),
          1,
          price,
          status,
          makeQrPayload(code),
          toLocalIso(bookedAt),
          slot.used ? toLocalIso(addMinutes(departure, 4)) : null
        );
        run('UPDATE seats SET status = ? WHERE bus_id = ? AND seat_number = ?', 'sold', busId, seat);
      }

      busCounter += 1;
    });
  });

  return busCounter - 1;
}

function pad(value) {
  return String(value).padStart(3, '0');
}

export function seedDatabase({ force = false } = {}) {
  initSchema();

  let staleRefresh = false;
  const existing = get('SELECT COUNT(*) AS count FROM routes');
  if (existing.count > 0 && !force) {
    const upcoming = get(
      'SELECT COUNT(*) AS count FROM buses WHERE departure_at > ?',
      toLocalIso()
    );
    if (upcoming.count > 0) {
      return { seeded: false, reason: 'already-seeded' };
    }
    force = true;
    staleRefresh = true;
  }

  transaction(() => {
    if (force) clearDatabase();

    seedNisr();
    seedRoutes();
    seedCompanies();

    const routeRows = all('SELECT * FROM routes ORDER BY id');
    const companyRows = all('SELECT * FROM companies ORDER BY id');

    seedDemandHistory(routeRows);
    const busCount = seedFleet(routeRows, companyRows);

    return busCount;
  });

  const summary = {
    seeded: true,
    reason: staleRefresh ? 'stale-fleet-refreshed' : 'initial-seed',
    routes: get('SELECT COUNT(*) AS count FROM routes').count,
    buses: get('SELECT COUNT(*) AS count FROM buses').count,
    seats: get('SELECT COUNT(*) AS count FROM seats').count,
    bookings: get('SELECT COUNT(*) AS count FROM bookings').count,
    demandRows: get('SELECT COUNT(*) AS count FROM demand_history').count
  };

  return summary;
}

const isDirectRun = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('src/seed.js');
if (isDirectRun) {
  const force = process.argv.includes('--force');
  const result = seedDatabase({ force });
  console.log('[NyabuGo] Seed result:', result);
}
