const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function request(path, { method = 'GET', body, signal } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(payload?.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export const api = {
  meta: () => request('/meta'),
  buses: ({ destination, date } = {}) => {
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (date) params.set('date', date);
    const query = params.toString();
    return request(`/buses${query ? `?${query}` : ''}`);
  },
  bus: (id) => request(`/buses/${id}`),
  createBooking: (body) => request('/bookings', { method: 'POST', body }),
  ticket: (code) => request(`/tickets/${encodeURIComponent(code)}`),
  demoTicket: () => request('/tickets/demo'),
  verifyTicket: (qr) => request('/tickets/verify', { method: 'POST', body: { qr } }),
  adminOverview: () => request('/admin/overview'),
  recommendations: () => request('/admin/recommendations'),
  aiStatus: () => request('/ai/status'),
  chat: (message) => request('/ai/chat', { method: 'POST', body: { message } })
};

export default api;
