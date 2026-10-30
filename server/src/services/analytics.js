import { all, get } from '../db.js';
import { addDays, addMinutes, formatTime, toDateStr, toLocalIso } from '../lib/time.js';

const NISR_WEIGHT_SCALE = 4.18;
const DEMAND_LIVE_MULTIPLIER = 1.15;

const DAY_FACTOR = [0.8, 1, 1, 1.05, 1.15, 1.4, 1.2];

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function peakTimeLabel(date) {
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${weekday} ${hour12}:${minutes} ${suffix}`;
}

export function getNisrMetrics() {
  return all('SELECT * FROM nisr_metrics ORDER BY variable, id').map((row) => ({
    id: row.id,
    datasetId: row.dataset_id,
    variable: row.variable,
    category: row.category,
    label: row.label,
    valuePct: row.value_pct,
    validN: row.valid_n,
    sampleSize: row.sample_size,
    notes: row.notes
  }));
}

export function getMetrics() {
  const today = toDateStr();
  const now = toLocalIso();

  const ticketTotals = get(
    `SELECT COUNT(*) AS tickets, COALESCE(SUM(amount), 0) AS revenue
     FROM bookings WHERE substr(booked_at, 1, 10) = ? AND status != 'cancelled'`,
    today
  );
  const usedToday = get(
    'SELECT COUNT(*) AS count FROM bookings WHERE substr(used_at, 1, 10) = ?',
    today
  );
  const activeBuses = get(
    'SELECT COUNT(*) AS count FROM buses WHERE departure_at <= ? AND arrival_at > ?',
    now,
    now
  );
  const upcomingBuses = get(
    'SELECT COUNT(*) AS count FROM buses WHERE departure_at > ? AND substr(departure_at, 1, 10) = ?',
    now,
    today
  );
  const seatLoad = get(
    `SELECT COALESCE(SUM(b.capacity), 0) AS capacity,
            COALESCE(SUM(CASE WHEN s.status = 'sold' THEN 1 ELSE 0 END), 0) AS sold
     FROM buses b
     LEFT JOIN seats s ON s.bus_id = b.id
     WHERE substr(b.departure_at, 1, 10) = ?`,
    today
  );

  return {
    ticketsToday: ticketTotals.tickets,
    revenueToday: ticketTotals.revenue,
    ticketsValidatedToday: usedToday.count,
    activeBuses: activeBuses.count,
    upcomingBuses: upcomingBuses.count,
    avgWaitSavedMin: 26,
    avgWaitSavedLabel: '26 min',
    seatOccupancyPct: seatLoad.capacity ? round((seatLoad.sold / seatLoad.capacity) * 100) : 0,
    capacityToday: seatLoad.capacity,
    soldSeatsToday: seatLoad.sold
  };
}

export function getRouteDemand() {
  const today = toDateStr();
  const rows = all(
    `SELECT r.*,
      (SELECT COUNT(*) FROM bookings bk
        JOIN buses b ON b.id = bk.bus_id
        WHERE b.route_id = r.id AND substr(bk.booked_at, 1, 10) = ? AND bk.status != 'cancelled') AS bookings_today,
      (SELECT COALESCE(SUM(bk.amount), 0) FROM bookings bk
        JOIN buses b ON b.id = bk.bus_id
        WHERE b.route_id = r.id AND substr(bk.booked_at, 1, 10) = ? AND bk.status != 'cancelled') AS revenue_today,
      (SELECT COUNT(*) FROM seats s
        JOIN buses b ON b.id = s.bus_id
        WHERE b.route_id = r.id AND substr(b.departure_at, 1, 10) = ? AND s.status = 'sold') AS seats_sold_today,
      (SELECT COALESCE(SUM(b.capacity), 0) FROM buses b
        WHERE b.route_id = r.id AND substr(b.departure_at, 1, 10) = ?) AS capacity_today
     FROM routes r
     ORDER BY r.id`,
    today,
    today,
    today,
    today
  );

  const enriched = rows.map((row) => {
    const nisrSignal = row.nisr_commute_weight * row.regional_multiplier;
    const predicted = round(
      row.bookings_today * DEMAND_LIVE_MULTIPLIER + nisrSignal * NISR_WEIGHT_SCALE,
      1
    );
    const loadPct = row.capacity_today
      ? round((row.seats_sold_today / row.capacity_today) * 100, 0)
      : 0;
    return {
      routeId: row.id,
      destination: row.destination,
      district: row.district,
      region: row.region,
      distanceKm: row.distance_km,
      durationMin: row.duration_min,
      baseFare: row.base_fare,
      bookingsToday: row.bookings_today,
      revenueToday: row.revenue_today,
      seatsSoldToday: row.seats_sold_today,
      capacityToday: row.capacity_today,
      loadPct,
      nisrCommuteWeight: row.nisr_commute_weight,
      regionalMultiplier: row.regional_multiplier,
      nisrSignal: round(nisrSignal, 2),
      predictedDemand: predicted,
      components: {
        liveBookings: round(row.bookings_today * DEMAND_LIVE_MULTIPLIER, 1),
        nisrBaseline: round(nisrSignal * NISR_WEIGHT_SCALE, 1)
      }
    };
  });

  const max = Math.max(...enriched.map((row) => row.predictedDemand), 1);
  return enriched.map((row) => ({
    ...row,
    demandIndex: Math.round((row.predictedDemand / max) * 100)
  }));
}

export function getHeatmap() {
  const since = toDateStr(addDays(new Date(), -14));
  const rows = all(
    `SELECT route_id, hour, ROUND(AVG(bookings), 1) AS avg_bookings
     FROM demand_history WHERE recorded_at >= ? GROUP BY route_id, hour ORDER BY route_id, hour`,
    since
  );

  const routes = all('SELECT id, destination FROM routes ORDER BY id');
  const matrix = new Map();
  let max = 1;
  for (const row of rows) {
    if (!matrix.has(row.route_id)) matrix.set(row.route_id, new Map());
    matrix.get(row.route_id).set(row.hour, row.avg_bookings);
    if (row.avg_bookings > max) max = row.avg_bookings;
  }

  return routes.map((route) => ({
    routeId: route.id,
    destination: route.destination,
    cells: Array.from({ length: 17 }, (_, index) => {
      const hour = index + 5;
      const value = matrix.get(route.id)?.get(hour) ?? 0;
      return {
        hour,
        value,
        intensity: Math.round((value / max) * 100) / 100
      };
    })
  }));
}

export function getHistory() {
  const today = new Date();
  const since = toDateStr(addDays(today, -6));
  const rows = all(
    `SELECT recorded_at AS date, SUM(bookings) AS bookings
     FROM demand_history WHERE recorded_at >= ? GROUP BY recorded_at ORDER BY recorded_at`,
    since
  );
  const byDate = new Map(rows.map((row) => [row.date, row.bookings]));
  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    const key = toDateStr(date);
    return {
      date: key,
      label: date.toLocaleDateString('en-GB', { weekday: 'short' }),
      bookings: byDate.get(key) ?? 0
    };
  });

  const todayKey = toDateStr(today);
  const liveRows = all(
    `SELECT CAST(substr(booked_at, 12, 2) AS INTEGER) AS hour, COUNT(*) AS bookings
     FROM bookings WHERE substr(booked_at, 1, 10) = ? GROUP BY hour ORDER BY hour`,
    todayKey
  );
  const liveByHour = new Map(liveRows.map((row) => [row.hour, row.bookings]));
  const todayHourly = Array.from({ length: 17 }, (_, index) => {
    const hour = index + 5;
    return {
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      bookings: liveByHour.get(hour) ?? 0
    };
  });

  return { trend, todayHourly };
}

export function getRecommendations(routes) {
  const now = new Date();
  const nowIso = toLocalIso();
  const historyRows = all(
    `SELECT route_id, hour, AVG(bookings) AS avg_bookings
     FROM demand_history GROUP BY route_id, hour`
  );
  const hourIndex = new Map();
  for (const row of historyRows) {
    if (!hourIndex.has(row.route_id)) hourIndex.set(row.route_id, new Map());
    hourIndex.get(row.route_id).set(row.hour, row.avg_bookings);
  }

  const recommendations = routes.map((route) => {
    const byHour = hourIndex.get(route.routeId) ?? new Map();
    let peak = { demand: -1, at: addMinutes(now, 60) };

    for (let offset = 1; offset <= 10; offset += 1) {
      const at = addMinutes(now, offset * 60);
      const base = byHour.get(at.getHours()) ?? 12;
      const factor = DAY_FACTOR[at.getDay()] ?? 1;
      const demand =
        base * factor * 0.92 + route.nisrCommuteWeight * route.regionalMultiplier * 0.6;
      if (demand > peak.demand) {
        peak = { demand, at };
      }
    }

    const peakHour = peak.at.getHours();
    const peakDay = toDateStr(peak.at);
    const capacityRow = get(
      `SELECT COALESCE(SUM(b.capacity), 0) AS capacity,
              COALESCE(SUM(CASE WHEN s.status = 'available' THEN 1 ELSE 0 END), 0) AS available
       FROM buses b
       LEFT JOIN seats s ON s.bus_id = b.id
       WHERE b.route_id = ? AND b.departure_at >= ?
         AND CAST(substr(b.departure_at, 12, 2) AS INTEGER) = ?
         AND substr(b.departure_at, 1, 10) = ?`,
      route.routeId,
      nowIso,
      peakHour,
      peakDay
    );

    const forecastedPassengers = Math.round(peak.demand);
    const availableSeats = capacityRow.available;
    const gap = forecastedPassengers - availableSeats;
    const utilization = forecastedPassengers / Math.max(availableSeats, 20);
    const extraBuses = gap > 0 ? Math.min(6, Math.max(1, Math.ceil(gap / 30))) : 0;

    let risk = 'low';
    if (gap > 40 || utilization > 1.35) risk = 'high';
    else if (gap > 0 || utilization > 0.9) risk = 'medium';

    const extraText = extraBuses > 0 ? ` Recommend +${extraBuses} extra bus${extraBuses > 1 ? 'es' : ''}.` : '';
    let message;
    if (risk === 'high') {
      message = `High congestion risk detected for ${route.destination} route on ${peakTimeLabel(peak.at)}.${extraText}`;
    } else if (risk === 'medium') {
      message = `Rising demand expected for ${route.destination} on ${peakTimeLabel(peak.at)}.${extraText || ' Monitor seat availability.'}`;
    } else {
      message = `Demand for ${route.destination} is within scheduled capacity. Keep the current fleet.`;
    }

    return {
      routeId: route.routeId,
      destination: route.destination,
      district: route.district,
      region: route.region,
      risk,
      extraBuses,
      forecastedPassengers,
      availableSeats,
      gap,
      utilization: round(utilization, 2),
      peakAt: toLocalIso(peak.at),
      peakLabel: peakTimeLabel(peak.at),
      peakTime: formatTime(toLocalIso(peak.at)),
      nisrSignal: route.nisrSignal,
      message
    };
  });

  const order = { high: 0, medium: 1, low: 2 };
  return recommendations.sort(
    (a, b) => order[a.risk] - order[b.risk] || b.forecastedPassengers - a.forecastedPassengers
  );
}

export function buildAdminOverview() {
  const nisr = getNisrMetrics();
  const routes = getRouteDemand();
  const recommendations = getRecommendations(routes);
  const history = getHistory();
  const heatmap = getHeatmap();

  return {
    generatedAt: toLocalIso(),
    metrics: getMetrics(),
    demand: routes,
    recommendations,
    history,
    heatmap,
    nisr: {
      dataset: 'RW_LFS2025',
      title: 'Rwanda Labour Force Survey 2025',
      publisher: 'National Institute of Statistics of Rwanda (NISR)',
      sampleSize: 31256,
      variables: ['D23', 'D23A'],
      metrics: nisr
    },
    formula: {
      expression:
        'Predicted_Demand = (Live_Bookings × 1.15) + (NISR_Commute_Weight_D23A × Regional_Multiplier × 4.18)',
      liveMultiplier: DEMAND_LIVE_MULTIPLIER,
      nisrWeightScale: NISR_WEIGHT_SCALE,
      note: 'Live bookings are blended with the NISR RW_LFS2025 D23A public-transport baseline (4.1%) and district mobility multipliers.'
    }
  };
}
