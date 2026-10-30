import { BusFront } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Logo({ to = '/', dark = false, compact = false }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5">
      <span
        className={`grid h-10 w-10 place-items-center rounded-xl shadow-soft transition group-hover:scale-105 ${
          dark ? 'bg-white text-brand-700' : 'bg-brand-600 text-white'
        }`}
      >
        <BusFront className="h-5 w-5" strokeWidth={2.2} />
      </span>
      <span className="leading-tight">
        <span
          className={`block text-lg font-extrabold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}
        >
          Nyabu<span className={dark ? 'text-brand-200' : 'text-brand-600'}>Go</span>
        </span>
        {!compact && (
          <span className={`block text-[10px] font-semibold uppercase tracking-[0.18em] ${dark ? 'text-white/60' : 'text-slate-400'}`}>
            Smart Transit
          </span>
        )}
      </span>
    </Link>
  );
}
