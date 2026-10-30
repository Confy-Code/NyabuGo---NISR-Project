import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BusFront,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  Phone,
  ShieldCheck,
  Smartphone,
  User,
  Users,
  Armchair
} from 'lucide-react';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import SeatMap from '../components/SeatMap.jsx';
import { Spinner } from '../components/Loading.jsx';
import EmptyState from '../components/EmptyState.jsx';
import {
  BUS_STATUS,
  durationLabel,
  formatRwf,
  formatTime,
  paymentLabel,
  paymentMethodForPhone
} from '../lib/format.js';

const MAX_SEATS = 4;

export default function Booking() {
  const { busId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState([]);
  const [passengerName, setPassengerName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    api
      .bus(busId)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => active && setLoadError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [busId]);

  const bus = data?.bus;
  const capacity = data?.seatMap?.capacity || bus?.capacity || 30;
  const paymentMethod = paymentMethodForPhone(phone);
  const total = (bus?.price || 0) * selected.length;
  const status = bus ? BUS_STATUS[bus.status] || BUS_STATUS.scheduled : null;
  const departurePassed = bus ? bus.status !== 'scheduled' : false;

  const canSubmit =
    selected.length > 0 &&
    passengerName.trim().length >= 2 &&
    /^07[2389]\d{7}$/.test(phone.replace(/\s+/g, '')) &&
    Boolean(paymentMethod) &&
    !submitting &&
    !departurePassed;

  const phoneHint = useMemo(() => {
    const digits = phone.replace(/\s+/g, '');
    if (!digits) return 'MTN (078/079) or Airtel (072/073) mobile money.';
    if (digits.length < 10) return 'Enter a 10-digit Rwanda phone number.';
    if (paymentMethod === 'mtn_momo') return 'MTN MoMo detected.';
    if (paymentMethod === 'airtel_money') return 'Airtel Money detected.';
    return 'Use an MTN (078/079) or Airtel (072/073) number.';
  }, [phone, paymentMethod]);

  const phoneValid = Boolean(paymentMethod) && phone.replace(/\s+/g, '').length === 10;

  function toggleSeat(number) {
    setError('');
    setSelected((current) => {
      if (current.includes(number)) return current.filter((seat) => seat !== number);
      if (current.length >= MAX_SEATS) {
        setError(`You can book up to ${MAX_SEATS} seats per transaction.`);
        return current;
      }
      return [...current, number].sort((a, b) => a - b);
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      const result = await api.createBooking({
        busId: bus.id,
        seatNumbers: selected,
        passengerName: passengerName.trim(),
        phone: phone.replace(/\s+/g, ''),
        paymentMethod
      });
      navigate(`/ticket/${result.ticket.ticketCode}`, {
        state: { justBooked: true, payment: result.payment }
      });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="container-app py-16">
        <Spinner label="Loading bus and seat map…" />
      </div>
    );
  }

  if (loadError || !bus) {
    return (
      <div className="container-app py-16">
        <EmptyState
          icon={BusFront}
          title="Bus not found"
          description={loadError || 'This departure is no longer available.'}
          action={
            <Link to="/" className="btn-primary">
              Back to departures
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-app py-8 sm:py-10">
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> All departures
      </Link>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="h-1.5 w-full" style={{ backgroundColor: bus.company.color }} />
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span
              className="grid h-11 w-11 place-items-center rounded-xl text-white"
              style={{ backgroundColor: bus.company.color }}
            >
              <BusFront className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {bus.company.name} · {bus.busNumber}
              </p>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                Nyabugogo → {bus.route.destination}
              </h1>
              <p className="text-xs text-slate-500">
                {bus.route.region} · {bus.route.distanceKm} km · {durationLabel(bus.route.durationMin)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Departure</p>
              <p className="text-lg font-extrabold text-slate-900">{formatTime(bus.departureAt)}</p>
              <p className="text-[11px] text-slate-500">arrive {formatTime(bus.arrivalAt)}</p>
            </div>
            {status && <span className={`pill ${status.className}`}>{status.label}</span>}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Armchair className="h-4 w-4 text-brand-600" /> Choose your seats
              </h2>
              <p className="muted">Pick up to {MAX_SEATS} seats. Sold seats are greyed out.</p>
            </div>
            <span className="pill bg-slate-100 text-slate-600">
              <Users className="h-3.5 w-3.5" /> {bus.seatsAvailable} available
            </span>
          </div>

          <div className="mt-6">
            <SeatMap
              seats={data.seats}
              selected={selected}
              onToggle={toggleSeat}
              capacity={capacity}
            />
          </div>

          {departurePassed && (
            <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
              This bus has already departed or is en route. Please choose another departure from the home page.
            </p>
          )}
        </div>

        <div className="lg:sticky lg:top-24">
          <form onSubmit={handleSubmit} className="card p-5 sm:p-6">
            <h2 className="text-base font-bold text-slate-900">Passenger &amp; payment</h2>
            <p className="muted">Your ticket is issued instantly after mobile-money confirmation.</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="label" htmlFor="passengerName">Passenger full name</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="passengerName"
                    className="input pl-10"
                    placeholder="e.g. Alice Uwase"
                    value={passengerName}
                    onChange={(event) => setPassengerName(event.target.value)}
                    maxLength={70}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="phone">Mobile money number</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="phone"
                    className="input pl-10"
                    placeholder="0788 123 456"
                    inputMode="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value.replace(/[^\d\s]/g, ''))}
                    maxLength={13}
                    autoComplete="tel"
                  />
                </div>
                <p className={`mt-1.5 text-[11px] font-medium ${phone && !phoneValid ? 'text-amber-600' : 'text-slate-400'}`}>
                  {phoneHint}
                </p>
              </div>

              <div>
                <span className="label">Payment method</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'mtn_momo', name: 'MTN MoMo', tone: 'bg-yellow-400 text-slate-900' },
                    { id: 'airtel_money', name: 'Airtel Money', tone: 'bg-red-500 text-white' }
                  ].map((option) => {
                    const active = paymentMethod === option.id;
                    return (
                      <div
                        key={option.id}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition ${
                          active
                            ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/20'
                            : 'border-slate-200 bg-white opacity-70'
                        }`}
                      >
                        <span className={`grid h-7 w-7 place-items-center rounded-lg text-[10px] font-extrabold ${option.tone}`}>
                          {option.id === 'mtn_momo' ? 'MTN' : 'AM'}
                        </span>
                        <span className="text-xs font-bold text-slate-700">{option.name}</span>
                        {active && <CheckCircle2 className="ml-auto h-4 w-4 text-brand-600" />}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Detected automatically from your phone prefix.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Selected seats</span>
                <span className="font-bold text-slate-900">
                  {selected.length ? selected.map((seat) => `#${seat}`).join(', ') : 'None'}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-500">{formatRwf(bus.price)} × {selected.length || 0}</span>
                <span className="font-bold text-slate-900">{formatRwf(total)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-dashed border-slate-200 pt-3">
                <span className="text-sm font-semibold text-slate-600">Total</span>
                <span className="text-xl font-extrabold text-brand-700">{formatRwf(total)}</span>
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                {error}
              </p>
            )}

            <button type="submit" disabled={!canSubmit} className="btn-primary mt-5 w-full">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Confirming payment…
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" /> Pay &amp; generate ticket
                </>
              )}
            </button>

            <ul className="mt-4 space-y-2 text-[11px] text-slate-500">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-600" /> HMAC-signed QR ticket, valid for one boarding.
              </li>
              <li className="flex items-center gap-2">
                <Smartphone className="h-3.5 w-3.5 text-brand-600" /> {paymentMethod ? paymentLabel(paymentMethod) : 'Mobile money'} simulation — no real charge.
              </li>
              <li className="flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5 text-brand-600" /> Seats are locked immediately after payment.
              </li>
            </ul>
          </form>
        </div>
      </div>
    </div>
  );
}
