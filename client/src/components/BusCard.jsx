import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Users, Bus, ShieldCheck } from 'lucide-react';
import { BUS_STATUS, durationLabel, formatRwf, formatTime } from '../lib/format.js';

export default function BusCard({ bus }) {
  const status = BUS_STATUS[bus.status] || BUS_STATUS.scheduled;
  const seatPct = bus.capacity ? Math.round((bus.seatsSold / bus.capacity) * 100) : 0;
  const soldOut = bus.seatsAvailable <= 0;
  const bookable = bus.status === 'scheduled' && !soldOut;
  const lowSeats = bus.seatsAvailable > 0 && bus.seatsAvailable <= 6;

  return (
    <article className="card group animate-fade-up overflow-hidden">
      <div className="flex items-stretch">
        <div className="w-1.5 shrink-0" style={{ backgroundColor: bus.company.color }} />
        <div className="flex-1 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="grid h-8 w-8 place-items-center rounded-lg text-white"
                  style={{ backgroundColor: bus.company.color }}
                >
                  <Bus className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{bus.company.name}</p>
                  <p className="text-[11px] font-medium text-slate-400">
                    {bus.busNumber} · {bus.plateNumber}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`pill ${status.className}`}>{status.label}</span>
              {bus.price >= 6500 && (
                <span className="pill hidden bg-violet-50 text-violet-700 sm:inline-flex">
                  <ShieldCheck className="h-3 w-3" /> Express
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="min-w-[64px]">
              <p className="text-xl font-extrabold tracking-tight text-slate-900">
                {formatTime(bus.departureAt)}
              </p>
              <p className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <MapPin className="h-3 w-3" /> Nyabugogo
              </p>
            </div>

            <div className="flex flex-1 flex-col items-center">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                <Clock className="h-3 w-3" /> {durationLabel(bus.route.durationMin)}
              </span>
              <div className="relative mt-1.5 h-px w-full bg-slate-200">
                <span className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-slate-300" />
                <span
                  className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
                  style={{ backgroundColor: bus.company.color }}
                />
              </div>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                {bus.route.distanceKm} km
              </span>
            </div>

            <div className="min-w-[64px] text-right">
              <p className="text-xl font-extrabold tracking-tight text-slate-900">
                {formatTime(bus.arrivalAt)}
              </p>
              <p className="text-[11px] font-medium text-slate-400">{bus.route.destination}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-dashed border-slate-200 pt-4">
            <div className="min-w-[150px] flex-1">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className={`inline-flex items-center gap-1 ${lowSeats ? 'text-amber-600' : 'text-slate-500'}`}>
                  <Users className="h-3.5 w-3.5" />
                  {soldOut ? 'Fully booked' : `${bus.seatsAvailable}/${bus.capacity} seats left`}
                </span>
                <span className="text-slate-400">{seatPct}% filled</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${seatPct > 85 ? 'bg-rose-500' : seatPct > 60 ? 'bg-amber-500' : 'bg-brand-500'}`}
                  style={{ width: `${Math.min(seatPct, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">per seat</p>
                <p className="text-lg font-extrabold text-brand-700">{formatRwf(bus.price)}</p>
              </div>
              {bookable ? (
                <Link to={`/book/${bus.id}`} className="btn-primary">
                  Book <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <button type="button" disabled className="btn-secondary">
                  {soldOut ? 'Sold out' : 'Departed'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
