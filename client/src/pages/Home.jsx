import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BusFront,
  CalendarDays,
  Clock3,
  Database,
  MapPin,
  QrCode,
  Search,
  Sparkles,
  Ticket,
  Smartphone,
  Users,
  Bot,
  TrendingUp,
  ShieldCheck,
  ArrowLeftRight
} from 'lucide-react';
import api from '../lib/api.js';
import BusCard from '../components/BusCard.jsx';
import { BusCardSkeleton } from '../components/Loading.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatDate } from '../lib/format.js';

const FEATURES = [
  {
    icon: Users,
    title: 'Live seat visibility',
    text: 'See exactly how many seats remain on every provincial departure before you leave home.'
  },
  {
    icon: QrCode,
    title: 'QR boarding in seconds',
    text: 'Pay with MTN MoMo or Airtel Money and get a signed digital ticket the driver scans at the gate.'
  },
  {
    icon: Bot,
    title: 'Kinyarwanda AI support',
    text: 'Ask “Bus ijya Musanze ihaguruka ryari?” and get instant answers in Kinyarwanda or English.'
  }
];

const STEPS = [
  { icon: MapPin, title: 'Pick your route', text: 'Choose a provincial destination from Nyabugogo, Kigali.' },
  { icon: Smartphone, title: 'Choose a seat & pay', text: 'Select your seat and pay with MTN MoMo or Airtel Money.' },
  { icon: Ticket, title: 'Board with QR', text: 'Show the QR ticket at the gate. The driver validates it instantly.' }
];

export default function Home() {
  const [meta, setMeta] = useState(null);
  const [metaError, setMetaError] = useState('');
  const [destination, setDestination] = useState('Musanze');
  const [date, setDate] = useState('');
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busError, setBusError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const plannerRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    let active = true;
    api
      .meta()
      .then((data) => {
        if (!active) return;
        setMeta(data);
        setDate((current) => current || data.dates[0]?.value || '');
      })
      .catch((error) => {
        if (!active) return;
        setMetaError(error.message);
        setBusError(error.message);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!date) return;
    let active = true;
    setLoading(true);
    setBusError('');
    api
      .buses({ destination, date })
      .then((data) => {
        if (!active) return;
        setBuses(data.buses || []);
      })
      .catch((error) => {
        if (!active) return;
        setBusError(error.message);
        setBuses([]);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [destination, date, reloadKey]);

  const routeOptions = useMemo(() => meta?.routes || [], [meta]);
  const activeRoute = routeOptions.find((route) => route.destination === destination);
  const selectedDate = meta?.dates?.find((item) => item.value === date);
  const dateLabel = selectedDate ? selectedDate.label : formatDate(date);

  function handleSearch(event) {
    event.preventDefault();
    setReloadKey((value) => value + 1);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function jumpToPlanner(nextDestination) {
    if (nextDestination) setDestination(nextDestination);
    plannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white">
        <div className="hero-grid absolute inset-0 opacity-70" />
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="container-app relative grid gap-10 pb-32 pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pb-36 lg:pt-20">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-brand-100 backdrop-blur">
              <Database className="h-3.5 w-3.5" />
              NISR RW_LFS2025 · Variables D23 &amp; D23A
            </span>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Skip the queue at <span className="text-brand-300">Nyabugogo</span>.
              <br className="hidden sm:block" /> Book your intercity seat in seconds.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-brand-100/85 sm:text-lg">
              NyabuGo digitalises “gukatisha amatike” for provincial buses — live schedules,
              real seat quotas, mobile-money checkout and a QR ticket the driver scans at the gate.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => jumpToPlanner()} className="btn bg-white text-brand-800 hover:bg-brand-50">
                <Search className="h-4 w-4" /> Find a bus
              </button>
              <Link to="/admin" className="btn border border-white/25 bg-white/10 text-white hover:bg-white/20">
                <TrendingUp className="h-4 w-4" /> Operator dashboard
              </Link>
            </div>

            <dl className="mt-9 grid max-w-lg grid-cols-3 gap-3">
              {[
                { value: '31,256', label: 'NISR respondents' },
                { value: '5', label: 'Provincial routes' },
                { value: '3', label: 'Bus operators' }
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur">
                  <dt className="text-lg font-extrabold tracking-tight">{item.value}</dt>
                  <dd className="text-[10px] font-semibold uppercase tracking-wide text-brand-100/60">{item.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-4 rounded-[2rem] bg-white/5 blur-xl" />
            <div className="relative rounded-[1.75rem] border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-100">
                  <span className="h-2 w-2 animate-pulse-soft rounded-full bg-emerald-400" />
                  Live from Nyabugogo
                </div>
                <span className="pill bg-white/10 text-[10px] text-brand-100">Today</span>
              </div>

              <div className="mt-4 space-y-2.5">
                {[
                  { name: 'Musanze', company: 'Horizon Express', time: '07:30', seats: '12 seats left', color: '#069350' },
                  { name: 'Rubavu', company: 'Volcano Express', time: '08:10', seats: '5 seats left', color: '#d97706' },
                  { name: 'Huye', company: 'Ritco', time: '09:00', seats: '19 seats left', color: '#1d4ed8' }
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ backgroundColor: item.color }}>
                      <BusFront className="h-4 w-4 text-white" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{item.name}</p>
                      <p className="text-[11px] text-brand-100/70">{item.company}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold">{item.time}</p>
                      <p className="text-[10px] text-brand-100/60">{item.seats}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-[11px] text-emerald-100">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Every ticket is HMAC-signed and validated once at boarding.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-app relative -mt-20 pb-4" ref={plannerRef}>
        <form onSubmit={handleSearch} className="card p-5 shadow-soft sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">Plan your trip</h2>
              <p className="muted">All departures leave from Nyabugogo Bus Station, Kigali.</p>
            </div>
            <span className="pill bg-brand-50 text-brand-700">
              <Clock3 className="h-3.5 w-3.5" /> Real-time seat quotas
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_1fr_auto] md:items-end">
            <div>
              <label className="label" htmlFor="origin">From</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-600" />
                <select id="origin" className="input appearance-none pl-10" value="Nyabugogo, Kigali" disabled>
                  <option>Nyabugogo, Kigali</option>
                </select>
              </div>
            </div>

            <div className="hidden pb-2.5 md:block">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-400">
                <ArrowLeftRight className="h-4 w-4" />
              </span>
            </div>

            <div>
              <label className="label" htmlFor="destination">To</label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  id="destination"
                  className="input appearance-none pl-10"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                >
                  <option value="">All destinations</option>
                  {routeOptions.map((route) => (
                    <option key={route.id} value={route.destination}>
                      {route.destination} — {route.region}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="date">Date</label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  id="date"
                  className="input appearance-none pl-10"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                >
                  {(meta?.dates || []).map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label} · {formatDate(item.value, { day: 'numeric', month: 'short' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary h-[42px] w-full md:w-auto">
              <Search className="h-4 w-4" /> Search
            </button>
          </div>

          {routeOptions.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Popular</span>
              {routeOptions.map((route) => (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => setDestination(route.destination)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    destination === route.destination
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700'
                  }`}
                >
                  {route.destination}
                </button>
              ))}
            </div>
          )}
        </form>
      </section>

      <section className="container-app pt-10" ref={resultsRef}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="section-title">
              {destination ? `Buses to ${destination}` : 'All departures'}
            </h2>
            <p className="muted mt-1">
              {dateLabel}
              {activeRoute ? ` · ${activeRoute.region} · ${activeRoute.distanceKm} km` : ''}
              {!loading ? ` · ${buses.length} departure${buses.length === 1 ? '' : 's'}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="btn-secondary"
            disabled={loading}
          >
            <Clock3 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh seats
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {loading && (
            <>
              <BusCardSkeleton />
              <BusCardSkeleton />
              <BusCardSkeleton />
            </>
          )}

          {!loading && busError && (
            <EmptyState
              icon={BusFront}
              title="Could not load departures"
              description={busError}
              action={
                <button type="button" className="btn-primary" onClick={() => setReloadKey((value) => value + 1)}>
                  Try again
                </button>
              }
            />
          )}

          {!loading && !busError && buses.length === 0 && (
            <EmptyState
              icon={BusFront}
              title="No more departures for this date"
              description={
                destination
                  ? `All scheduled buses to ${destination} have departed. Check tomorrow's departures or another route.`
                  : 'There are no scheduled buses for this date. Try tomorrow.'
              }
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  {meta?.dates?.find((item) => item.value !== date) && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setDate(meta.dates.find((item) => item.value !== date).value)}
                    >
                      View {meta.dates.find((item) => item.value !== date).label}
                    </button>
                  )}
                  <button type="button" className="btn-secondary" onClick={() => setDestination('')}>
                    All destinations
                  </button>
                </div>
              }
            />
          )}

          {!loading &&
            !busError &&
            buses.map((bus) => <BusCard key={bus.id} bus={bus} />)}
        </div>

        {metaError && (
          <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Could not reach the NyabuGo API: {metaError}. Make sure the server is running on port 4000.
          </p>
        )}

        <p className="mt-4 text-center text-xs text-slate-400">
          Availability is synced with the operator desk. Seats are locked the moment payment succeeds.
        </p>
      </section>

      <section className="container-app mt-16">
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-app mt-16">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white">
          <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-brand-100">
                <Sparkles className="h-3.5 w-3.5" /> Predictive fleet intelligence
              </span>
              <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Grounded in national data, sharpened by live bookings.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-brand-100/80">
                NyabuGo blends live ticket demand with the NISR Rwanda Labour Force Survey 2025
                baseline to forecast route congestion and recommend extra buses before queues form.
              </p>
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 font-mono text-[12px] leading-relaxed text-brand-100/90">
                Predicted_Demand = (Live_Bookings × 1.15) + (NISR_Commute_Weight_D23A × Regional_Multiplier × 4.18)
              </div>
              <Link to="/admin" className="btn mt-5 bg-white text-brand-800 hover:bg-brand-50">
                Open operator dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { value: '4.1%', label: 'Use public buses / taxis', sub: 'D23A · N = 1,280' },
                { value: '83.7%', label: 'Walk to work', sub: 'D23A · N = 26,169' },
                { value: '22.2%', label: 'Fixed workplace', sub: 'D23 · N = 7,702' },
                { value: '31,256', label: 'Survey respondents', sub: 'RW_LFS2025' }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-extrabold tracking-tight text-brand-200">{item.value}</p>
                  <p className="mt-1 text-xs font-semibold text-white">{item.label}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-brand-100/50">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-app mt-16">
        <div className="text-center">
          <h2 className="section-title">From the queue to the QR in three steps</h2>
          <p className="muted mx-auto mt-2 max-w-xl">
            No paper, no cash at the counter, no guessing whether the bus still has space.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, index) => (
            <div key={title} className="card relative p-6">
              <span className="absolute right-5 top-5 text-4xl font-extrabold text-slate-100">
                {index + 1}
              </span>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 text-white">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
