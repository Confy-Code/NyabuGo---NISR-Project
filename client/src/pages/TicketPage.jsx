import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BusFront,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  MapPin,
  Phone,
  Printer,
  QrCode,
  ShieldCheck,
  Ticket,
  User
} from 'lucide-react';
import api from '../lib/api.js';
import { Spinner } from '../components/Loading.jsx';
import EmptyState from '../components/EmptyState.jsx';
import {
  formatDate,
  formatDateTime,
  formatRwf,
  formatTime,
  paymentLabel,
  seatLabel
} from '../lib/format.js';

export default function TicketPage() {
  const { code } = useParams();
  const location = useLocation();
  const justBooked = Boolean(location.state?.justBooked);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .ticket(code)
      .then((result) => {
        if (active) setTicket(result.ticket);
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [code]);

  if (loading) {
    return (
      <div className="container-app py-16">
        <Spinner label="Retrieving your digital ticket…" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container-app py-16">
        <EmptyState
          icon={Ticket}
          title="Ticket not found"
          description={error || `No ticket matches ${code}.`}
          action={
            <Link to="/" className="btn-primary">
              Book a new trip
            </Link>
          }
        />
      </div>
    );
  }

  const isUsed = ticket.status === 'used';
  const statusLabel = isUsed ? 'Used / Boarded' : ticket.status === 'paid' ? 'Valid for boarding' : ticket.status;

  return (
    <div className="container-app py-8 sm:py-10">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" /> Book another trip
        </Link>
        <Link to="/scanner" className="btn-secondary">
          <QrCode className="h-4 w-4" /> Open scanner
        </Link>
      </div>

      {justBooked && (
        <div className="no-print mt-4 flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 sm:p-5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold text-brand-900">Payment successful — your ticket is ready.</p>
            <p className="mt-0.5 text-sm text-brand-800/80">
              Show this QR code to the driver at the gate. Each ticket can only be validated once.
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto mt-6 max-w-4xl">
        <div className="print-area overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
          <div className="flex items-center justify-between bg-gradient-to-r from-brand-900 to-brand-700 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
                <BusFront className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-extrabold tracking-tight">NyabuGo e-Ticket</p>
                <p className="text-[11px] text-brand-100/70">Smart Intercity Transit · Rwanda</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-100/60">Ticket code</p>
              <p className="font-mono text-sm font-bold">{ticket.ticketCode}</p>
            </div>
          </div>

          <div className="grid gap-0 md:grid-cols-[1.5fr_1fr]">
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`pill ${isUsed ? 'bg-slate-100 text-slate-600' : 'bg-brand-50 text-brand-700'}`}>
                  <ShieldCheck className="h-3.5 w-3.5" /> {statusLabel}
                </span>
                <span className="pill bg-slate-100 text-slate-600">{ticket.trip.company}</span>
              </div>

              <div className="mt-5 flex items-center gap-4">
                <div>
                  <p className="text-3xl font-extrabold tracking-tight text-slate-900">
                    {formatTime(ticket.trip.departureAt)}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                    <MapPin className="h-3.5 w-3.5" /> {ticket.trip.origin}
                  </p>
                </div>
                <div className="flex flex-1 flex-col items-center">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {formatDate(ticket.trip.departureAt)}
                  </span>
                  <div className="mt-1 h-px w-full bg-slate-200" />
                  <span className="mt-1 text-[10px] font-medium text-slate-400">{seatLabel(ticket.seatNumbers)}</span>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold tracking-tight text-slate-900">
                    {formatTime(ticket.trip.arrivalAt)}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">{ticket.trip.destination}</p>
                </div>
              </div>

              <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-dashed border-slate-200 pt-5 text-sm">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Passenger</dt>
                  <dd className="mt-1 flex items-center gap-1.5 font-bold text-slate-900">
                    <User className="h-3.5 w-3.5 text-slate-400" /> {ticket.passengerName}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Seat(s)</dt>
                  <dd className="mt-1 font-bold text-slate-900">{seatLabel(ticket.seatNumbers)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Bus</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {ticket.trip.busNumber} · {ticket.trip.plateNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Route region</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{ticket.trip.region}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Phone</dt>
                  <dd className="mt-1 flex items-center gap-1.5 font-semibold text-slate-900">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> {ticket.phone}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Payment</dt>
                  <dd className="mt-1 flex items-center gap-1.5 font-semibold text-slate-900">
                    <CreditCard className="h-3.5 w-3.5 text-slate-400" /> {paymentLabel(ticket.paymentMethod)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Amount paid</dt>
                  <dd className="mt-1 font-extrabold text-brand-700">{formatRwf(ticket.amount)}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Booked</dt>
                  <dd className="mt-1 flex items-center gap-1.5 font-semibold text-slate-900">
                    <CalendarDays className="h-3.5 w-3.5 text-slate-400" /> {formatDateTime(ticket.bookedAt)}
                  </dd>
                </div>
              </dl>

              {isUsed && (
                <p className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-xs font-semibold text-slate-600">
                  This ticket was validated at {formatDateTime(ticket.usedAt)}. It cannot be reused.
                </p>
              )}
            </div>

            <div className="flex flex-col items-center justify-center border-t border-dashed border-slate-200 bg-slate-50 p-6 md:border-l md:border-t-0">
              <div className={`rounded-2xl bg-white p-3 shadow-card ${isUsed ? 'opacity-40 grayscale' : ''}`}>
                <img
                  src={ticket.qrDataUrl}
                  alt={`QR code for ticket ${ticket.ticketCode}`}
                  className="h-44 w-44"
                />
              </div>
              <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                <QrCode className="h-3.5 w-3.5" /> Scan at boarding
              </p>
              <p className="mt-1 max-w-[180px] break-all text-center font-mono text-[10px] text-slate-400">
                {ticket.ticketCode}
              </p>
              <p className="mt-3 text-center text-[10px] leading-relaxed text-slate-400">
                Signed payload · valid once · verify at the driver portal
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-white px-6 py-3 text-[10px] text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3 w-3" /> Departure {formatDateTime(ticket.trip.departureAt)}
            </span>
            <span>Payment ref: {ticket.paymentRef}</span>
          </div>
        </div>

        <div className="no-print mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className="btn-primary">
            <Printer className="h-4 w-4" /> Print ticket
          </button>
          <a
            href={ticket.qrDataUrl}
            download={`nyabugo-${ticket.ticketCode}.png`}
            className="btn-secondary"
          >
            <Download className="h-4 w-4" /> Download QR
          </a>
          <Link to="/" className="btn-secondary">
            <Ticket className="h-4 w-4" /> Book another seat
          </Link>
        </div>
      </div>
    </div>
  );
}
