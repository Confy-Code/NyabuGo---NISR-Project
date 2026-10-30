import { toLocalIso } from './time.js';

export function getBusStatus(row, nowIso = toLocalIso()) {
  if (nowIso < row.departure_at) return 'scheduled';
  if (nowIso < row.arrival_at) return 'en_route';
  return 'arrived';
}

export function serializeBus(row, nowIso = toLocalIso()) {
  return {
    id: row.id,
    busNumber: row.bus_number,
    plateNumber: row.plate_number,
    capacity: row.capacity,
    price: row.price,
    driverName: row.driver_name,
    departureAt: row.departure_at,
    arrivalAt: row.arrival_at,
    status: getBusStatus(row, nowIso),
    seatsAvailable: row.seats_available ?? row.capacity,
    seatsSold: row.seats_sold ?? 0,
    company: {
      id: row.company_id,
      name: row.company_name,
      code: row.company_code,
      color: row.company_color
    },
    route: {
      id: row.route_id,
      origin: row.origin,
      destination: row.destination,
      district: row.district,
      region: row.region,
      distanceKm: row.distance_km,
      durationMin: row.duration_min,
      baseFare: row.base_fare
    }
  };
}

export function serializeTicket(row) {
  return {
    id: row.id,
    ticketCode: row.ticket_code,
    passengerName: row.passenger_name,
    phone: row.phone,
    paymentMethod: row.payment_method,
    paymentRef: row.payment_ref,
    seatNumbers: String(row.seat_numbers)
      .split(',')
      .map((value) => Number(value.trim()))
      .filter(Boolean),
    quantity: row.quantity,
    amount: row.amount,
    status: row.status,
    bookedAt: row.booked_at,
    usedAt: row.used_at,
    qrPayload: row.qr_payload,
    trip: {
      busId: row.bus_id,
      busNumber: row.bus_number,
      plateNumber: row.plate_number,
      departureAt: row.departure_at,
      arrivalAt: row.arrival_at,
      origin: row.origin,
      destination: row.destination,
      district: row.district,
      region: row.region,
      company: row.company_name,
      companyColor: row.company_color
    }
  };
}
