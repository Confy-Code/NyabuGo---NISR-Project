import { Router } from 'express';
import { all, get } from '../db.js';
import { serializeBus } from '../lib/serialize.js';
import { toDateStr, toLocalIso } from '../lib/time.js';

const router = Router();

const BUS_SELECT = `
  SELECT b.*,
    c.name AS company_name, c.code AS company_code, c.color AS company_color,
    r.origin, r.destination, r.district, r.region, r.distance_km, r.duration_min, r.base_fare,
    (SELECT COUNT(*) FROM seats s WHERE s.bus_id = b.id AND s.status = 'available') AS seats_available,
    (SELECT COUNT(*) FROM seats s WHERE s.bus_id = b.id AND s.status = 'sold') AS seats_sold
  FROM buses b
  JOIN companies c ON c.id = b.company_id
  JOIN routes r ON r.id = b.route_id
`;

router.get('/buses', (req, res) => {
  const destination = String(req.query.destination || '').trim();
  const date = String(req.query.date || toDateStr());
  const now = toLocalIso();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
  }

  const params = [date, now];
  let sql = `${BUS_SELECT} WHERE substr(b.departure_at, 1, 10) = ? AND b.arrival_at >= ?`;

  if (destination) {
    sql += ' AND r.destination = ?';
    params.push(destination);
  }

  sql += ' ORDER BY b.departure_at ASC, b.price ASC';

  const rows = all(sql, ...params);
  res.json({
    origin: 'Nyabugogo, Kigali',
    destination: destination || null,
    date,
    buses: rows.map((row) => serializeBus(row, now))
  });
});

router.get('/buses/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid bus id.' });
  }

  const row = get(`${BUS_SELECT} WHERE b.id = ?`, id);
  if (!row) {
    return res.status(404).json({ error: 'Bus not found.' });
  }

  const seats = all(
    'SELECT seat_number, status FROM seats WHERE bus_id = ? ORDER BY seat_number',
    id
  ).map((seat) => ({ number: seat.seat_number, status: seat.status }));

  res.json({
    bus: serializeBus(row),
    seats,
    seatMap: {
      rows: 5,
      columns: 4,
      aisleAfter: 2,
      capacity: row.capacity
    }
  });
});

export default router;
