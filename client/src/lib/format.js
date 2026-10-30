export function formatRwf(value, { compact = false } = {}) {
  const number = Number(value) || 0;
  if (compact && number >= 1_000_000) {
    return `RWF ${(number / 1_000_000).toFixed(number >= 10_000_000 ? 0 : 1)}M`;
  }
  if (compact && number >= 1_000) {
    return `RWF ${(number / 1_000).toFixed(0)}K`;
  }
  return `RWF ${number.toLocaleString('en-RW')}`;
}

export function formatTime(iso) {
  if (!iso) return '--:--';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso, options) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(
    'en-GB',
    options || { weekday: 'short', day: 'numeric', month: 'short' }
  );
}

export function formatDateTime(iso) {
  if (!iso) return '';
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

export function durationLabel(minutes) {
  const total = Number(minutes) || 0;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (!hours) return `${mins} min`;
  return `${hours}h${mins ? ` ${mins}m` : ''}`;
}

export const BUS_STATUS = {
  scheduled: { label: 'Scheduled', className: 'bg-brand-50 text-brand-700' },
  en_route: { label: 'En route', className: 'bg-sky-50 text-sky-700' },
  arrived: { label: 'Arrived', className: 'bg-slate-100 text-slate-600' }
};

export const RISK = {
  high: {
    label: 'High risk',
    className: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    dot: 'bg-rose-500'
  },
  medium: {
    label: 'Watch',
    className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    dot: 'bg-amber-500'
  },
  low: {
    label: 'Low risk',
    className: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
    dot: 'bg-brand-500'
  }
};

export const PAYMENT_LABELS = {
  mtn_momo: 'MTN MoMo',
  airtel_money: 'Airtel Money'
};

export function paymentLabel(method) {
  return PAYMENT_LABELS[method] || method || 'Mobile money';
}

export function paymentMethodForPhone(phone) {
  const prefix = String(phone || '').slice(0, 3);
  if (prefix === '078' || prefix === '079') return 'mtn_momo';
  if (prefix === '072' || prefix === '073') return 'airtel_money';
  return null;
}

export function seatLabel(seats) {
  if (!Array.isArray(seats) || !seats.length) return '—';
  return seats.map((seat) => `#${seat}`).join(', ');
}
