import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Ticket,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import { formatDate, formatDateTime, formatRwf, formatTime, seatLabel } from '../lib/format.js';

const NAV_ITEMS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'tickets', label: 'My tickets', icon: Ticket }
];

export default function Account() {
  const { user, recentTickets, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const ticketsRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(user?.name || '');

  useEffect(() => {
    if (location.hash === '#tickets') {
      ticketsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/account' }} />;
  }

  function saveName(event) {
    event.preventDefault();
    const next = nameDraft.trim();
    if (next.length >= 2) updateProfile({ name: next });
    setEditing(false);
  }

  const providerLabel = user.provider === 'google' ? 'Google' : 'Email';

  return (
    <div className="container-app py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="pill bg-brand-50 text-brand-700">
            <ShieldCheck className="h-3.5 w-3.5" /> Account
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">My NyabuGo</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your traveller profile and review tickets saved on this device.
          </p>
        </div>
        <button type="button" onClick={() => navigate('/')} className="btn-primary">
          <Ticket className="h-4 w-4" /> Book a trip
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr] lg:items-start">
        <aside className="card p-5 lg:sticky lg:top-24">
          <div className="flex flex-col items-center text-center">
            <Avatar user={user} size="h-20 w-20" text="text-2xl" />
            <p className="mt-3 text-base font-bold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
            <span className="pill mt-2 bg-slate-100 text-slate-600">
              {user.provider === 'google' ? 'Google sign-in' : 'Email sign-in'}
            </span>
          </div>

          <nav className="mt-5 space-y-1 border-t border-slate-100 pt-4">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Icon className="h-4 w-4" /> {label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </nav>

          <p className="mt-4 flex items-start gap-1.5 rounded-xl bg-slate-50 px-3 py-2.5 text-[10px] leading-relaxed text-slate-400">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Session cached on this device for fast checkout and offline access.
          </p>
        </aside>

        <div className="space-y-6">
          <section id="profile" className="card scroll-mt-24 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <User className="h-4 w-4 text-brand-600" /> Traveller profile
              </h2>
              {!editing && (
                <button
                  type="button"
                  onClick={() => {
                    setNameDraft(user.name);
                    setEditing(true);
                  }}
                  className="btn-secondary !px-3 !py-1.5 text-xs"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit name
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={saveName} className="mt-4 flex flex-wrap items-end gap-2">
                <div className="min-w-[200px] flex-1">
                  <label className="label" htmlFor="account-name">Display name</label>
                  <input
                    id="account-name"
                    className="input"
                    value={nameDraft}
                    onChange={(event) => setNameDraft(event.target.value)}
                    autoFocus
                  />
                </div>
                <button type="submit" className="btn-primary">Save</button>
                <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
                  Cancel
                </button>
              </form>
            ) : (
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Full name</dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                    <User className="h-3.5 w-3.5 text-slate-400" /> {user.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Email</dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                    <Mail className="h-3.5 w-3.5 text-slate-400" /> {user.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Phone</dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                    <Phone className="h-3.5 w-3.5 text-slate-400" /> {user.phone || 'Not provided'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Sign-in method</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-900">{providerLabel}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Member since</dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                    <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                    {formatDate(user.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Last sign-in</dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                    <Clock3 className="h-3.5 w-3.5 text-slate-400" /> {formatDateTime(user.lastLoginAt)}
                  </dd>
                </div>
              </dl>
            )}

            <div className="mt-5 flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3 text-[11px] leading-relaxed text-brand-800">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Profile verified and saved. Bookings made while signed in appear in My tickets below.
            </div>
          </section>

          <section id="tickets" ref={ticketsRef} className="card scroll-mt-24 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Ticket className="h-4 w-4 text-brand-600" /> My tickets
              </h2>
              <span className="pill bg-slate-100 text-slate-600">{recentTickets.length} saved</span>
            </div>

            {recentTickets.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                  <Ticket className="h-6 w-6" />
                </span>
                <p className="mt-3 text-sm font-bold text-slate-700">No tickets saved yet</p>
                <p className="mt-1 text-xs text-slate-500">
                  Tickets you book will appear here automatically for quick boarding.
                </p>
                <Link to="/" className="btn-primary mt-4">
                  Find a bus <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {recentTickets.map((item) => (
                  <li key={item.code}>
                    <Link
                      to={`/ticket/${item.code}`}
                      className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-brand-300 hover:bg-brand-50/30"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                        <Ticket className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                          <MapPin className="h-3.5 w-3.5 text-brand-600" /> {item.destination}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {item.company ? `${item.company} · ` : ''}Seat {seatLabel(item.seats)}
                          {item.departureAt ? ` · ${formatDate(item.departureAt)} ${formatTime(item.departureAt)}` : ''}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] text-slate-400">{item.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-brand-700">{formatRwf(item.amount)}</p>
                        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                          View ticket <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
