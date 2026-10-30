import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  QrCode,
  LayoutDashboard,
  Ticket,
  MapPin,
  LogIn,
  UserCircle,
  LogOut
} from 'lucide-react';
import Logo from './Logo.jsx';
import UserMenu from './UserMenu.jsx';
import Avatar from './Avatar.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const LINKS = [
  { to: '/', label: 'Book a trip', icon: Ticket, end: true },
  { to: '/scanner', label: 'Scanner', icon: QrCode },
  { to: '/admin', label: 'Operations', icon: LayoutDashboard }
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-lg">
      <div className="container-app flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 lg:inline-flex">
            <MapPin className="h-3 w-3" /> Nyabugogo Hub
          </span>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
          <a
            href="https://microdatabk.statistics.gov.rw/catalog/125/data-dictionary/F1?file_name=RW_LFS2025"
            target="_blank"
            rel="noreferrer"
            className="ml-1 hidden rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-brand-300 hover:text-brand-700 xl:inline-flex"
          >
            NISR RW_LFS2025
          </a>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <UserMenu />
          ) : (
            <NavLink
              to="/login"
              state={{ from: pathname }}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <LogIn className="h-4 w-4" /> Sign in
            </NavLink>
          )}
          <NavLink to="/" className="btn-primary">
            <Ticket className="h-4 w-4" />
            Buy a ticket
          </NavLink>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          {user && <Avatar user={user} size="h-9 w-9" text="text-[11px]" />}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="btn-ghost"
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="container-app flex flex-col gap-1 py-3">
            {user ? (
              <div className="mb-1 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                <Avatar user={user} size="h-9 w-9" text="text-[11px]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
                  <p className="truncate text-[11px] text-slate-500">{user.email}</p>
                </div>
                <NavLink to="/account" className="text-xs font-semibold text-brand-700">
                  Account
                </NavLink>
              </div>
            ) : (
              <NavLink
                to="/login"
                state={{ from: pathname }}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <LogIn className="h-4 w-4" /> Sign in / create account
              </NavLink>
            )}

            {LINKS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}

            {user ? (
              <>
                <NavLink
                  to="/account"
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <UserCircle className="h-4 w-4" /> My account &amp; tickets
                </NavLink>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </>
            ) : (
              <NavLink to="/" className="btn-primary mt-2">
                <Ticket className="h-4 w-4" /> Buy a ticket
              </NavLink>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
