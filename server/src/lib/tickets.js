import crypto from 'node:crypto';

const SECRET = process.env.TICKET_SECRET || 'nyabugo-hackathon-dev-secret';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateTicketCode() {
  const bytes = crypto.randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i += 1) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `NG-${code}`;
}

export function signCode(code) {
  return crypto.createHmac('sha256', SECRET).update(code).digest('hex').slice(0, 16);
}

export function makeQrPayload(code) {
  return JSON.stringify({ v: 1, code, sig: signCode(code) });
}

export function parseQrPayload(raw) {
  if (!raw || typeof raw !== 'string') {
    return { ok: false, reason: 'empty' };
  }

  const trimmed = raw.trim();

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (!parsed.code || !parsed.sig) {
        return { ok: false, reason: 'malformed' };
      }
      if (signCode(parsed.code) !== parsed.sig) {
        return { ok: false, reason: 'bad_signature' };
      }
      return { ok: true, code: parsed.code };
    } catch {
      return { ok: false, reason: 'malformed' };
    }
  }

  const direct = trimmed.toUpperCase();
  if (/^NG-[A-Z0-9]{8}$/.test(direct)) {
    return { ok: true, code: direct, unsigned: true };
  }

  return { ok: false, reason: 'unrecognised' };
}
