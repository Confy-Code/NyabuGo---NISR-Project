import { Router } from 'express';
import QRCode from 'qrcode';
import { get, run, transaction } from '../db.js';
import { serializeTicket } from '../lib/serialize.js';
import { generateTicketCode, makeQrPayload, parseQrPayload } from '../lib/tickets.js';
import { toLocalIso } from '../lib/time.js';

const router = Router();

const TICKET_SELECT = `
  SELECT bk.*, b.bus_number, b.plate_number, b.departure_at, b.arrival_at,
    r.origin, r.destination, r.district, r.region,
    c.name AS company_name, c.color AS company_color
  FROM bookings bk
  JOIN buses b ON b.id = bk.bus_id
  JOIN routes r ON r.id = b.route_id
  JOIN companies c ON c.id = b.company_id
`;

async function attachQr(ticket) {
  const qrDataUrl = await QRCode.toDataURL(ticket.qrPayload, {
    width: 480,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: { dark: '#064e3b', light: '#ffffff' }
  });
  return { ...ticket, qrDataUrl };
}

function findTicket(code) {
  return get(`${TICKET_SELECT} WHERE bk.ticket_code = ?`, code);
}

function paymentMethodFor(phone) {
  const prefix = phone.slice(0, 3);
  if (prefix === '078' || prefix === '079') return 'mtn_momo';
  if (prefix === '072' || prefix === '073') return 'airtel_money';
  return null;
}

function paymentReference(method) {
  const prefix = method === 'mtn_momo' ? 'MOMO' : 'AIRTEL';
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function nextTicketCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateTicketCode();
    if (!get('SELECT 1 AS found FROM bookings WHERE ticket_code = ?', code)) {
      return code;
    }
  }
  throw new Error('Could not allocate a unique ticket code.');
}

router.post('/bookings', async (req, res) => {
  const {
    busId,
    seatNumbers,
    passengerName,
    phone,
    paymentMethod: requestedMethod
  } = req.body || {};

  const id = Number(busId);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'A valid busId is required.' });
  }

  const name = String(passengerName || '').trim();
  if (name.length < 2 || name.length > 70) {
    return res.status(400).json({ error: 'Passenger name must be between 2 and 70 characters.' });
  }

  const normalizedPhone = String(phone || '').replace(/\s+/g, '');
  if (!/^07[2389]\d{7}$/.test(normalizedPhone)) {
    return res.status(400).json({ error: 'Enter a valid Rwanda phone number (07XX XXX XXX).' });
  }

  const methodForPhone = paymentMethodFor(normalizedPhone);
  if (!methodForPhone) {
    return res.status(400).json({ error: 'Phone number must be MTN (078/079) or Airtel (072/073).' });
  }
  if (requestedMethod && requestedMethod !== methodForPhone) {
    return res.status(400).json({
      error: `The selected payment method does not match the phone number. Use ${methodForPhone === 'mtn_momo' ? 'MTN MoMo' : 'Airtel Money'}.`
    });
  }

  const seatList = Array.isArray(seatNumbers)
    ? [...new Set(seatNumbers.map((seat) => Number(seat)).filter((seat) => Number.isInteger(seat)))]
    : [];

  if (!seatList.length || seatList.length > 4) {
    return res.status(400).json({ error: 'Select between 1 and 4 seats.' });
  }

  const bus = get('SELECT * FROM buses WHERE id = ?', id);
  if (!bus) {
    return res.status(404).json({ error: 'Bus not found.' });
  }

  if (seatList.some((seat) => seat < 1 || seat > bus.capacity)) {
    return res.status(400).json({ error: 'One or more seats are outside this bus layout.' });
  }

  const now = toLocalIso();
  if (bus.departure_at <= now) {
    return res.status(409).json({ error: 'This bus has already departed. Please choose another departure.' });
  }

  const placeholders = seatList.map(() => '?').join(',');
  const seatRows = get(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available
     FROM seats WHERE bus_id = ? AND seat_number IN (${placeholders})`,
    id,
    ...seatList
  );

  if (!seatRows || seatRows.total !== seatList.length || seatRows.available !== seatList.length) {
    return res.status(409).json({ error: 'One or more selected seats were just taken. Please refresh.' });
  }

  const code = nextTicketCode();
  const amount = bus.price * seatList.length;
  const bookedAt = now;
  const paymentRef = paymentReference(methodForPhone);
  const payload = makeQrPayload(code);

  try {
    transaction(() => {
      for (const seat of seatList) {
        const result = run(
          "UPDATE seats SET status = 'sold' WHERE bus_id = ? AND seat_number = ? AND status = 'available'",
          id,
          seat
        );
        if (result.changes !== 1) {
          throw new Error('SEAT_TAKEN');
        }
      }

      run(
        `INSERT INTO bookings (ticket_code, passenger_name, phone, payment_method, payment_ref, bus_id, seat_numbers, quantity, amount, status, qr_payload, booked_at, used_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?, NULL)`,
        code,
        name,
        normalizedPhone,
        methodForPhone,
        paymentRef,
        id,
        seatList.sort((a, b) => a - b).join(','),
        seatList.length,
        amount,
        payload,
        bookedAt
      );
    });
  } catch (error) {
    if (error.message === 'SEAT_TAKEN') {
      return res.status(409).json({ error: 'One or more selected seats were just taken. Please refresh.' });
    }
    throw error;
  }

  const row = findTicket(code);
  const ticket = await attachQr(serializeTicket(row));
  res.status(201).json({
    ticket,
    payment: {
      method: methodForPhone,
      reference: paymentRef,
      status: 'SUCCESSFUL',
      amount
    }
  });
});

router.get('/tickets/demo', async (_req, res) => {
  const row = get(
    `${TICKET_SELECT} WHERE bk.status = 'paid' ORDER BY bk.id DESC LIMIT 1`
  );

  if (!row) {
    return res.status(404).json({ error: 'No unused demo ticket available. Create a booking first.' });
  }

  const ticket = await attachQr(serializeTicket(row));
  res.json({
    message: 'Demo ticket for scanner testing. Verifying it will mark it as used.',
    ticket
  });
});

router.post('/tickets/verify', async (req, res) => {
  const raw = req.body?.qr ?? req.body?.code;
  const parsed = parseQrPayload(raw);

  if (!parsed.ok) {
    return res.status(400).json({
      valid: false,
      reason: parsed.reason,
      message:
        parsed.reason === 'bad_signature'
          ? 'QR signature is invalid. This ticket was not issued by NyabuGo.'
          : 'This QR code is not a NyabuGo ticket.'
    });
  }

  const row = findTicket(parsed.code);
  if (!row) {
    return res.status(404).json({
      valid: false,
      reason: 'not_found',
      message: `No ticket found for ${parsed.code}.`
    });
  }

  const ticket = serializeTicket(row);

  if (row.status === 'used') {
    return res.json({
      valid: false,
      reason: 'already_used',
      message: `Ticket already used at ${row.used_at?.replace('T', ' ')}.`,
      ticket
    });
  }

  if (row.status !== 'paid') {
    return res.json({
      valid: false,
      reason: row.status,
      message: `Ticket status is ${row.status}.`,
      ticket
    });
  }

  const usedAt = toLocalIso();
  run("UPDATE bookings SET status = 'used', used_at = ? WHERE id = ?", usedAt, row.id);

  res.json({
    valid: true,
    reason: 'valid',
    message: `VALID TICKET — Seat #${ticket.seatNumbers.join(', #')}`,
    validatedAt: usedAt,
    ticket: { ...ticket, status: 'used', usedAt }
  });
});

router.get('/tickets/:code', async (req, res) => {
  const code = String(req.params.code || '').toUpperCase();
  const row = findTicket(code);
  if (!row) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }
  const ticket = await attachQr(serializeTicket(row));
  res.json({ ticket });
});

export default router;
