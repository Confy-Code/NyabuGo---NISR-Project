import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Ticket,
  User,
  X
} from 'lucide-react';
import { getInitials, useAuth } from '../context/AuthContext.jsx';
import GoogleIcon from '../components/GoogleIcon.jsx';

const SAMPLE_ACCOUNTS = [
  { name: 'Aline Uwase', email: 'aline.uwase@gmail.com', tint: 'bg-rose-500' },
  { name: 'Eric Nshimiyimana', email: 'eric.nshimi@gmail.com', tint: 'bg-sky-600' },
  { name: 'Sandrine Ingabire', email: 'sandrine.ingabire@gmail.com', tint: 'bg-amber-500' }
];

const BENEFITS = [
  { icon: Ticket, title: 'Tickets in one place', text: 'Your booked seats stay saved on this device for quick boarding.' },
  { icon: ShieldCheck, title: 'Faster checkout', text: 'Your name and phone are pre-filled on the next booking.' },
  { icon: Sparkles, title: 'Personalised alerts', text: 'Get notified when your route has seats or schedule changes.' }
];

function GoogleModal({ accounts = [], onClose, onPick }) {
  const [custom, setCustom] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const savedEmails = new Set(accounts.map((account) => account.email.toLowerCase()));
  const suggestions = SAMPLE_ACCOUNTS.filter(
    (account) => !savedEmails.has(account.email.toLowerCase())
  );

  function submitCustom(event) {
    event.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Enter a name and email to continue.');
      return;
    }
    onPick({ name: name.trim(), email: email.trim() });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <GoogleIcon className="h-5 w-5" />
            <p className="text-sm font-bold text-slate-900">Sign in with Google</p>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost h-8 w-8 !px-0" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-slate-600">Choose an account to continue to NyabuGo</p>

          {!custom ? (
            <div className="mt-4 space-y-2">
              {accounts.length > 0 && (
                <>
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Saved on this device
                  </p>
                  {accounts.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => onPick(account)}
                      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
                        {getInitials(account.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900">{account.name}</span>
                        <span className="block truncate text-xs text-slate-500">{account.email}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </button>
                  ))}
                  <p className="px-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Suggested
                  </p>
                </>
              )}
              {suggestions.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => onPick({ name: account.name, email: account.email })}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
                >
                  <span className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white ${account.tint}`}>
                    {getInitials(account.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{account.name}</span>
                    <span className="block truncate text-xs text-slate-500">{account.email}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCustom(true)}
                className="flex w-full items-center gap-3 rounded-xl border border-dashed border-slate-300 px-3.5 py-3 text-left transition hover:border-brand-300 hover:bg-slate-50"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500">
                  <User className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-slate-700">Use another account</span>
              </button>
            </div>
          ) : (
            <form onSubmit={submitCustom} className="mt-4 space-y-3">
              <div>
                <label className="label" htmlFor="google-name">Full name</label>
                <input
                  id="google-name"
                  className="input"
                  placeholder="Your name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="label" htmlFor="google-email">Google email</label>
                <input
                  id="google-email"
                  className="input"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setCustom(false)} className="btn-secondary flex-1">
                  Back
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Continue
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-[11px] leading-relaxed text-slate-400">
          To continue, Google will share your name and email address with NyabuGo. Your session
          stays on this device.
        </p>
      </div>
    </div>
  );
}

export default function Login() {
  const { user, login, loginWithGoogle, savedAccounts } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [googleOpen, setGoogleOpen] = useState(false);

  if (user && redirectTo !== '/login') {
    return <Navigate to={redirectTo} replace />;
  }

  function go(nextUser) {
    if (nextUser) login(nextUser);
    navigate(redirectTo, { replace: true });
  }

  function handleEmailChange(value) {
    setEmail(value);
    const match = savedAccounts.find(
      (account) => account.email.toLowerCase() === value.trim().toLowerCase()
    );
    if (match) {
      if (!name.trim()) setName(match.name);
      if (!phone.trim() && match.phone) setPhone(match.phone);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Enter your name and email to continue.');
      return;
    }
    setError('');
    go({ name: name.trim(), email: email.trim(), phone: phone.trim() });
  }

  function pickGoogle(account) {
    loginWithGoogle(account);
    setGoogleOpen(false);
    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="relative overflow-hidden bg-slate-50">
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-200/50 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />

      <div className="container-app relative py-8 sm:py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" /> Back to departures
        </Link>

        <div className="mx-auto mt-5 grid max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft lg:grid-cols-[1fr_1fr]">
          <div className="relative hidden flex-col justify-between bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-8 text-white lg:flex">
            <div className="hero-grid absolute inset-0 opacity-60" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-brand-100">
                <MapPin className="h-3.5 w-3.5" /> Nyabugogo, Kigali
              </span>
              <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight">
                One account.
                <br />
                Every provincial trip.
              </h1>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-brand-100/80">
                Sign in to keep your tickets, passenger details and boarding history ready for
                the next time you travel.
              </p>
            </div>

            <ul className="relative mt-10 space-y-4">
              {BENEFITS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-200">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-brand-100/65">{text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="relative mt-8 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[11px] text-brand-100/70">
              <ShieldCheck className="h-4 w-4 shrink-0 text-brand-300" />
              Secure session cached on this device for offline access.
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Welcome back</h2>
                <p className="mt-1 text-sm text-slate-500">Sign in or create an account to continue.</p>
              </div>
              <span className="pill bg-brand-50 text-brand-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Instant access
              </span>
            </div>

            <button
              type="button"
              onClick={() => setGoogleOpen(true)}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <GoogleIcon className="h-5 w-5" />
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                or continue with email
              </span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="login-name">Full name</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-name"
                    className="input pl-10"
                    placeholder="e.g. Alice Uwase"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="login-email">Email address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-email"
                    className="input pl-10"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => handleEmailChange(event.target.value)}
                    autoComplete="email"
                    list="nyabugo-saved-emails"
                  />
                </div>
                <datalist id="nyabugo-saved-emails">
                  {savedAccounts.map((account) => (
                    <option key={account.email} value={account.email}>
                      {account.name}
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="label" htmlFor="login-phone">
                  Phone <span className="normal-case text-slate-400">(optional)</span>
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-phone"
                    className="input pl-10"
                    placeholder="0788 123 456"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value.replace(/[^\d\s+]/g, ''))}
                    autoComplete="tel"
                  />
                </div>
              </div>

              {error && <p className="text-xs font-medium text-rose-600">{error}</p>}

              <button type="submit" className="btn-primary w-full">
                <Ticket className="h-4 w-4" /> Sign in / create account
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between gap-2 text-[11px] text-slate-400">
              <button
                type="button"
                onClick={() => go({ name: 'Guest Passenger', email: 'guest@nyabugo.rw' })}
                className="font-semibold text-slate-500 hover:text-brand-700"
              >
                Explore as guest
              </button>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> No password needed for this demo
              </span>
            </div>

            <p className="mt-5 text-center text-[10px] leading-relaxed text-slate-400">
              By continuing you agree to the NyabuGo prototype terms. Your session and recent
              tickets are stored on this device.
            </p>
          </div>
        </div>
      </div>

      {googleOpen && (
        <GoogleModal
          accounts={savedAccounts}
          onClose={() => setGoogleOpen(false)}
          onPick={pickGoogle}
        />
      )}
    </div>
  );
}
