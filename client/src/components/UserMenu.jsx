import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Ticket, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    function handleKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 transition hover:border-brand-300 hover:shadow-sm"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar user={user} size="h-8 w-8" text="text-[11px]" />
        <span className="hidden text-left lg:block">
          <span className="block max-w-[120px] truncate text-xs font-bold text-slate-800">{user.name}</span>
          <span className="block text-[10px] font-medium text-slate-400">
            {user.provider === 'google' ? 'Google account' : 'NyabuGo account'}
          </span>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl" role="menu">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <Avatar user={user} size="h-10 w-10" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="p-2">
            <Link
              to="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              role="menuitem"
            >
              <UserCircle className="h-4 w-4" /> My account
            </Link>
            <Link
              to="/account#tickets"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              role="menuitem"
            >
              <Ticket className="h-4 w-4" /> My tickets
            </Link>
            <button
              type="button"
              onClick={() => {
                logout();
                setOpen(false);
                navigate('/');
              }}
              className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>

          <p className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-[10px] text-slate-400">
            Session saved on this device
          </p>
        </div>
      )}
    </div>
  );
}
