import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  Activity,
  BusFront,
  Clock3,
  Database,
  Flame,
  Gauge,
  Loader2,
  RefreshCw,
  Sparkles,
  Ticket,
  Timer,
  TrendingUp,
  Users,
  Wallet,
  AlertTriangle,
  ArrowRight,
  BrainCircuit
} from 'lucide-react';
import api from '../lib/api.js';
import StatCard from '../components/StatCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatDateTime, formatRwf, RISK } from '../lib/format.js';

const CHART_COLORS = ['#069350', '#37cb80', '#1d4ed8', '#d97706', '#7c3aed'];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function mix(from, to, t) {
  const channels = from.map((value, index) => Math.round(value + (to[index] - value) * t));
  return `rgb(${channels.join(', ')})`;
}

function heatColor(intensity) {
  const t = clamp(Number(intensity) || 0, 0, 1);
  if (t <= 0) return '#f8fafc';
  if (t < 0.5) return mix([211, 249, 225], [251, 191, 36], t / 0.5);
  return mix([251, 191, 36], [244, 63, 94], (t - 0.5) / 0.5);
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-card">
      <p className="font-bold text-slate-900">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="mt-1 flex items-center gap-1.5 text-slate-600">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-semibold text-slate-900">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function Admin() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const data = await api.adminOverview();
      setOverview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ silent: true }), 30000);
    return () => clearInterval(interval);
  }, [load]);

  const demandChart = useMemo(
    () =>
      (overview?.demand || []).map((route) => ({
        destination: route.destination,
        live: route.components.liveBookings,
        nisr: route.components.nisrBaseline,
        predicted: route.predictedDemand,
        loadPct: route.loadPct
      })),
    [overview]
  );

  const nisrGroups = useMemo(() => {
    const metrics = overview?.nisr?.metrics || [];
    return ['D23A', 'D23']
      .map((variable) => ({
        variable,
        category: metrics.find((metric) => metric.variable === variable)?.category || '',
        metrics: metrics.filter((metric) => metric.variable === variable)
      }))
      .filter((group) => group.metrics.length > 0);
  }, [overview]);

  if (loading) {
    return (
      <div className="container-app py-16">
        <div className="flex flex-col items-center justify-center gap-3 text-sm font-medium text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
          Crunching live bookings with NISR baselines…
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="container-app py-16">
        <EmptyState
          icon={AlertTriangle}
          title="Dashboard unavailable"
          description={error || 'Could not load the operator overview.'}
          action={
            <button type="button" className="btn-primary" onClick={() => load()}>
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          }
        />
      </div>
    );
  }

  const { metrics, recommendations, history, heatmap, nisr, formula } = overview;
  const highRisk = recommendations.filter((item) => item.risk === 'high').length;
  const hours = Array.from({ length: 17 }, (_, index) => index + 5);

  return (
    <div className="container-app py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="pill bg-brand-50 text-brand-700">
            <Activity className="h-3.5 w-3.5" /> Live operations
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Operator &amp; regulator dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            Fleet intelligence for Nyabugogo Bus Station. Metrics blend live ticket sales with
            the NISR RW_LFS2025 mobility baseline to recommend bus allocations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-[11px] font-medium text-slate-400 sm:inline">
            Updated {formatDateTime(overview.generatedAt)}
          </span>
          <button type="button" onClick={() => load({ silent: true })} disabled={refreshing} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Ticket} label="Tickets issued today" value={metrics.ticketsToday.toLocaleString()} hint={`${metrics.ticketsValidatedToday} validated at boarding`} tone="brand" />
        <StatCard icon={Wallet} label="Revenue collected" value={formatRwf(metrics.revenueToday, { compact: true })} hint="Mobile money simulation" tone="violet" />
        <StatCard icon={BusFront} label="Active buses en route" value={metrics.activeBuses} hint={`${metrics.upcomingBuses} departures upcoming`} tone="sky" />
        <StatCard icon={Timer} label="Average wait saved" value={metrics.avgWaitSavedLabel} hint="Versus physical ticket queues" tone="amber" />
        <StatCard icon={Gauge} label="Seat occupancy" value={`${metrics.seatOccupancyPct}%`} hint={`${metrics.soldSeatsToday}/${metrics.capacityToday} seats today`} tone="slate" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr] xl:items-start">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <TrendingUp className="h-4 w-4 text-brand-600" /> Predictive route demand
                </h2>
                <p className="muted">Live bookings blended with the NISR D23A public-transport baseline.</p>
              </div>
              <span className="pill bg-slate-100 text-slate-600">
                <BrainCircuit className="h-3.5 w-3.5" /> Time-series regressor
              </span>
            </div>

            <div className="mt-5 h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demandChart} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="destination"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(6, 147, 80, 0.06)' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="live" name="Live bookings ×1.15" stackId="demand" fill="#069350" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="nisr" name="NISR baseline" stackId="demand" fill="#aaf0c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {[...overview.demand]
                .sort((a, b) => b.demandIndex - a.demandIndex)
                .slice(0, 3)
                .map((route) => (
                  <div key={route.routeId} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-700">{route.destination}</p>
                      <span className="text-[10px] font-bold text-brand-700">Index {route.demandIndex}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${route.demandIndex}%` }} />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {route.bookingsToday} live bookings · {route.loadPct}% load
                    </p>
                  </div>
                ))}
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                  <Flame className="h-4 w-4 text-rose-500" /> Route demand heatmap
                </h2>
                <p className="muted">Average bookings by departure hour over the last 14 days.</p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                Low
                <span className="h-3 w-16 rounded-full" style={{ background: 'linear-gradient(90deg,#d3f9e1,#fbbf24,#f43f5e)' }} />
                High
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-1">
                <thead>
                  <tr>
                    <th className="w-24 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Route</th>
                    {hours.map((hour) => (
                      <th key={hour} className="text-center text-[9px] font-semibold text-slate-400">
                        {String(hour).padStart(2, '0')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmap.map((route) => (
                    <tr key={route.routeId}>
                      <td className="pr-1 text-xs font-bold text-slate-700">{route.destination}</td>
                      {route.cells.map((cell) => (
                        <td key={cell.hour} className="p-0">
                          <div
                            className="grid h-7 w-full place-items-center rounded-md text-[9px] font-semibold"
                            style={{
                              backgroundColor: heatColor(cell.intensity),
                              color: cell.intensity > 0.55 ? '#fff' : '#334155'
                            }}
                            title={`${route.destination} · ${String(cell.hour).padStart(2, '0')}:00 · avg ${cell.value} bookings`}
                          >
                            {cell.value > 0 ? Math.round(cell.value) : ''}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="card p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Clock3 className="h-4 w-4 text-brand-600" /> 7-day booking trend
              </h2>
              <p className="muted">Historical demand feeding the fleet forecaster.</p>
              <div className="mt-4 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history.trend} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                    <defs>
                      <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#069350" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#069350" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="bookings" name="Bookings" stroke="#069350" strokeWidth={2.5} fill="url(#trendFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="card p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Activity className="h-4 w-4 text-brand-600" /> Today by hour
              </h2>
              <p className="muted">Live bookings captured since 05:00.</p>
              <div className="mt-4 h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history.todayHourly} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={2} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(6, 147, 80, 0.06)' }} />
                    <Bar dataKey="bookings" name="Bookings" fill="#37cb80" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </div>

        <aside className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white shadow-soft">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <Sparkles className="h-4 w-4 text-brand-300" /> AI fleet recommender
              </h2>
              <span className="pill bg-white/10 text-[10px] text-brand-100">
                {highRisk} high-risk
              </span>
            </div>
            <div className="space-y-3 p-4">
              {recommendations.slice(0, 4).map((item) => (
                <div key={item.routeId} className="rounded-xl border border-white/10 bg-white/5 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">{item.destination}</p>
                    <span
                      className={`pill text-[10px] ${
                        item.risk === 'high'
                          ? 'bg-rose-500/20 text-rose-200'
                          : item.risk === 'medium'
                            ? 'bg-amber-400/20 text-amber-200'
                            : 'bg-brand-400/20 text-brand-100'
                      }`}
                    >
                      {RISK[item.risk]?.label || item.risk}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-brand-100/80">{item.message}</p>
                  <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-black/20 px-1.5 py-1.5">
                      <p className="text-[9px] uppercase tracking-wide text-brand-100/50">Forecast</p>
                      <p className="text-xs font-bold">{item.forecastedPassengers}</p>
                    </div>
                    <div className="rounded-lg bg-black/20 px-1.5 py-1.5">
                      <p className="text-[9px] uppercase tracking-wide text-brand-100/50">Seats</p>
                      <p className="text-xs font-bold">{item.availableSeats}</p>
                    </div>
                    <div className="rounded-lg bg-black/20 px-1.5 py-1.5">
                      <p className="text-[9px] uppercase tracking-wide text-brand-100/50">Add buses</p>
                      <p className="text-xs font-bold text-brand-300">+{item.extraBuses}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-[10px] text-brand-100/60">Peak · {item.peakLabel}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Database className="h-4 w-4 text-brand-600" /> NISR ground truth
              </h2>
              <span className="pill bg-brand-50 text-[10px] text-brand-700">{nisr.dataset}</span>
            </div>
            <div className="p-5">
              <p className="text-xs font-bold text-slate-800">{nisr.title}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">{nisr.publisher}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600">
                <Users className="h-3 w-3" /> Sample size: {nisr.sampleSize.toLocaleString()} respondents
              </p>

              <div className="mt-4 space-y-4">
                {nisrGroups.map((group) => (
                  <div key={group.variable}>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-brand-700">
                        Variable {group.variable}
                      </p>
                      <span className="text-[10px] text-slate-400">{group.category}</span>
                    </div>
                    <div className="mt-2 space-y-2">
                      {group.metrics.map((metric) => (
                        <div key={metric.id}>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-medium text-slate-600">{metric.label}</span>
                            <span className="font-bold text-slate-900">{metric.valuePct}%</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-brand-500"
                              style={{ width: `${Math.min(metric.valuePct, 100)}%` }}
                            />
                          </div>
                          <p className="mt-0.5 text-[9px] text-slate-400">N = {metric.validN.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl bg-slate-900 p-3.5 text-white">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-300">
                  Demand formula
                </p>
                <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-slate-300">
                  {formula.expression}
                </p>
                <p className="mt-2 text-[10px] leading-relaxed text-slate-400">{formula.note}</p>
              </div>

              <p className="mt-4 text-center text-[10px] font-semibold text-slate-500">
                Powered by NISR RW_LFS2025 (Variables D23 &amp; D23A)
              </p>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <BusFront className="h-4 w-4 text-brand-600" /> Revenue by route
            </h2>
            <ul className="mt-3 space-y-2">
              {[...overview.demand]
                .sort((a, b) => b.revenueToday - a.revenueToday)
                .map((route, index) => (
                  <li key={route.routeId} className="flex items-center gap-3">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-xs font-semibold text-slate-700">{route.destination}</span>
                    <span className="text-xs font-bold text-slate-900">{formatRwf(route.revenueToday, { compact: true })}</span>
                  </li>
                ))}
            </ul>
            <Link to="/" className="btn-secondary mt-4 w-full">
              View passenger portal <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </aside>
      </div>

      <section className="card mt-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Gauge className="h-4 w-4 text-brand-600" /> Route capacity &amp; NISR weights
          </h2>
          <span className="pill bg-slate-100 text-slate-600">D23A weight × regional multiplier</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
                <th className="py-2 font-semibold">Destination</th>
                <th className="py-2 font-semibold">Region</th>
                <th className="py-2 font-semibold">Bookings</th>
                <th className="py-2 font-semibold">Seats sold / capacity</th>
                <th className="py-2 font-semibold">Load</th>
                <th className="py-2 font-semibold">NISR signal</th>
                <th className="py-2 font-semibold">Demand index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {overview.demand.map((route) => (
                <tr key={route.routeId}>
                  <td className="py-2.5 font-bold text-slate-800">{route.destination}</td>
                  <td className="py-2.5 text-xs text-slate-500">{route.region}</td>
                  <td className="py-2.5 text-slate-700">{route.bookingsToday}</td>
                  <td className="py-2.5 text-slate-700">
                    {route.seatsSoldToday} / {route.capacityToday}
                  </td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${route.loadPct > 80 ? 'bg-rose-500' : route.loadPct > 50 ? 'bg-amber-500' : 'bg-brand-500'}`}
                          style={{ width: `${Math.min(route.loadPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">{route.loadPct}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-xs text-slate-500">{route.nisrSignal}</td>
                  <td className="py-2.5">
                    <span className="pill bg-brand-50 text-brand-700">{route.demandIndex}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500">
        <p className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-600" />
          Fleet recommendations are generated by the NISR-weighted time-series regressor and refresh every 30 seconds.
        </p>
        <Link to="/scanner" className="link">
          Open boarding scanner →
        </Link>
      </div>
    </div>
  );
}
