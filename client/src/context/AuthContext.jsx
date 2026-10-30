import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const USER_KEY = 'nyabugo.auth.v1';
const ACCOUNTS_KEY = 'nyabugo.accounts.v1';
const TICKETS_KEY = 'nyabugo.tickets.v1';
const AuthContext = createContext(null);

function readStored(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage may be unavailable in private mode */
  }
}

function removeStored(key) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return 'NG';
  return parts.map((part) => part[0].toUpperCase()).join('');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStored(USER_KEY, null));
  const [savedAccounts, setSavedAccounts] = useState(() => readStored(ACCOUNTS_KEY, []));
  const [recentTickets, setRecentTickets] = useState(() => readStored(TICKETS_KEY, []));

  useEffect(() => {
    if (user) writeStored(USER_KEY, user);
    else removeStored(USER_KEY);
  }, [user]);

  useEffect(() => {
    writeStored(ACCOUNTS_KEY, savedAccounts);
  }, [savedAccounts]);

  useEffect(() => {
    writeStored(TICKETS_KEY, recentTickets);
  }, [recentTickets]);

  const login = useCallback(
    ({ name, email, phone = '', provider = 'email', avatar = null }) => {
      const now = new Date().toISOString();
      const cleanEmail = String(email || '').trim();
      const existing = savedAccounts.find(
        (account) => account.email.toLowerCase() === cleanEmail.toLowerCase()
      );
      const next = {
        id: existing?.id || makeId(),
        name: String(name || '').trim() || existing?.name || 'NyabuGo Traveller',
        email: cleanEmail || 'traveller@nyabugo.rw',
        phone: String(phone || '').trim() || existing?.phone || '',
        provider,
        avatar: avatar ?? existing?.avatar ?? null,
        createdAt: existing?.createdAt || now,
        lastLoginAt: now
      };
      setUser(next);
      setSavedAccounts((previous) => {
        const others = previous.filter(
          (account) => account.email.toLowerCase() !== next.email.toLowerCase()
        );
        return [next, ...others].slice(0, 8);
      });
      return next;
    },
    [savedAccounts]
  );

  const loginWithGoogle = useCallback(
    (account) => login({ ...account, provider: 'google' }),
    [login]
  );

  const logout = useCallback(() => setUser(null), []);

  const updateProfile = useCallback(
    (patch) => {
      if (!user) return;
      const next = { ...user, ...patch };
      setUser(next);
      setSavedAccounts((accounts) =>
        accounts.map((account) =>
          account.email.toLowerCase() === next.email.toLowerCase()
            ? { ...account, ...patch }
            : account
        )
      );
    },
    [user]
  );

  const rememberTicket = useCallback((ticket) => {
    if (!ticket?.ticketCode) return;
    const entry = {
      code: ticket.ticketCode,
      destination: ticket.trip?.destination || 'Provincial route',
      origin: ticket.trip?.origin || 'Nyabugogo, Kigali',
      seats: ticket.seatNumbers || [],
      busNumber: ticket.trip?.busNumber || '',
      company: ticket.trip?.company || '',
      amount: ticket.amount || 0,
      status: ticket.status || 'paid',
      departureAt: ticket.trip?.departureAt || null,
      bookedAt: ticket.bookedAt || new Date().toISOString()
    };
    setRecentTickets((previous) => [
      entry,
      ...previous.filter((item) => item.code !== entry.code)
    ].slice(0, 10));
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      savedAccounts,
      recentTickets,
      login,
      loginWithGoogle,
      logout,
      updateProfile,
      rememberTicket
    }),
    [
      user,
      savedAccounts,
      recentTickets,
      login,
      loginWithGoogle,
      logout,
      updateProfile,
      rememberTicket
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }
  return context;
}
