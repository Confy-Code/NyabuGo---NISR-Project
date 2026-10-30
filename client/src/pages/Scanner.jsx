import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CameraOff,
  CheckCircle2,
  Keyboard,
  Loader2,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Ticket,
  XCircle
} from 'lucide-react';
import api from '../lib/api.js';
import { formatDateTime, formatRwf, paymentLabel, seatLabel } from '../lib/format.js';

export default function Scanner() {
  const scannerRef = useRef(null);
  const handledRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [manual, setManual] = useState('');
  const [demo, setDemo] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        scanner.stop().catch(() => {}).finally(() => scanner.clear());
      }
    };
  }, []);

  async function verify(raw) {
    if (!raw || verifying) return;
    setVerifying(true);
    setResult(null);
    try {
      const payload = await api.verifyTicket(raw);
      setResult(payload);
      pushHistory(payload);
    } catch (error) {
      const payload =
        error.payload && typeof error.payload === 'object'
          ? error.payload
          : { valid: false, reason: 'error', message: error.message };
      setResult(payload);
      pushHistory(payload);
    } finally {
      setVerifying(false);
    }
  }

  function pushHistory(payload) {
    setHistory((current) =>
      [
        {
          id: `${Date.now()}-${Math.random()}`,
          valid: payload.valid,
          message: payload.message,
          code: payload.ticket?.ticketCode || '—',
          at: new Date().toISOString()
        },
        ...current
      ].slice(0, 6)
    );
  }

  async function startScan() {
    setCameraError('');
    setStarting(true);
    handledRef.current = false;
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (handledRef.current) return;
          handledRef.current = true;
          await stopScan();
          verify(decodedText);
        },
        () => {}
      );
      setScanning(true);
    } catch (error) {
      setCameraError(
        error?.message?.includes('Permission')
          ? 'Camera permission was denied. Allow camera access or paste the ticket code below.'
          : `Could not start the camera: ${error?.message || 'unknown error'}. Use manual entry below.`
      );
      scannerRef.current = null;
    } finally {
      setStarting(false);
    }
  }

  async function stopScan() {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) {
      setScanning(false);
      return;
    }
    try {
      await scanner.stop();
      scanner.clear();
    } catch {
      /* camera already stopped */
    }
    setScanning(false);
  }

  async function loadDemo() {
    setDemoLoading(true);
    try {
      const payload = await api.demoTicket();
      setDemo(payload.ticket);
    } catch (error) {
      setCameraError(error.message);
    } finally {
      setDemoLoading(false);
    }
  }

  const valid = result?.valid === true;
  const ticket = result?.ticket;

  return (
    <div className="container-app py-8 sm:py-10">
      <div className="max-w-2xl">
        <span className="pill bg-brand-50 text-brand-700">
          <ShieldCheck className="h-3.5 w-3.5" /> Driver / regulator portal
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Verify boarding passes
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Scan a passenger QR code or paste the ticket code. Valid tickets are marked as used
          instantly — a second scan is rejected to prevent ticket sharing.
        </p>
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-brand-600" />
              <h2 className="text-sm font-bold text-slate-900">Live camera scanner</h2>
            </div>
            <span className={`pill ${scanning ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${scanning ? 'animate-pulse-soft bg-brand-500' : 'bg-slate-400'}`} />
              {scanning ? 'Scanning' : 'Idle'}
            </span>
          </div>

          <div className="p-5">
            <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-900">
              <div id="qr-reader" className={`min-h-[280px] w-full [&_video]:!w-full [&_video]:!rounded-none ${scanning ? '' : 'hidden'}`} />
              {!scanning && (
                <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-brand-300">
                    <QrCode className="h-8 w-8" />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-white">Camera is off</p>
                  <p className="mt-1 max-w-xs text-xs text-slate-400">
                    Start the scanner and point the camera at the passenger&apos;s QR ticket.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {!scanning ? (
                <button type="button" onClick={startScan} disabled={starting} className="btn-primary flex-1">
                  {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  {starting ? 'Starting camera…' : 'Start camera'}
                </button>
              ) : (
                <button type="button" onClick={stopScan} className="btn-secondary flex-1">
                  <CameraOff className="h-4 w-4" /> Stop camera
                </button>
              )}
              <button type="button" onClick={loadDemo} disabled={demoLoading} className="btn-secondary">
                {demoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Load demo ticket
              </button>
            </div>

            {cameraError && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs font-medium text-amber-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {cameraError}
              </p>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                verify(manual.trim());
                setManual('');
              }}
              className="mt-5 border-t border-dashed border-slate-200 pt-4"
            >
              <label className="label" htmlFor="manual">Manual entry</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Keyboard className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="manual"
                    className="input pl-10 font-mono text-xs"
                    placeholder="NG-XXXXXXXX or scanned payload"
                    value={manual}
                    onChange={(event) => setManual(event.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={!manual.trim() || verifying}>
                  Verify
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Tip: a ticket code like NG-7KQ2M9XA also works for quick checks.
              </p>
            </form>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card min-h-[260px] p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-brand-600" /> Verification result
              </h2>
              {result && (
                <button type="button" onClick={() => setResult(null)} className="text-xs font-semibold text-slate-400 hover:text-slate-700">
                  Clear
                </button>
              )}
            </div>

            {verifying && (
              <div className="flex flex-col items-center justify-center gap-3 py-14 text-sm text-slate-500">
                <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
                Checking ticket signature…
              </div>
            )}

            {!verifying && !result && (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                  <ScanLine className="h-7 w-7" />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-700">Waiting for a scan</p>
                <p className="mt-1 max-w-xs text-xs text-slate-400">
                  Results appear here with the seat number and passenger details.
                </p>
              </div>
            )}

            {!verifying && result && (
              <div className="mt-4">
                <div
                  className={`flex items-start gap-3 rounded-2xl p-4 ${
                    valid ? 'bg-brand-50 ring-1 ring-brand-200' : 'bg-rose-50 ring-1 ring-rose-200'
                  }`}
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-white ${valid ? 'bg-brand-600' : 'bg-rose-600'}`}>
                    {valid ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  </span>
                  <div>
                    <p className={`text-base font-extrabold ${valid ? 'text-brand-800' : 'text-rose-800'}`}>
                      {valid ? 'VALID TICKET' : 'INVALID TICKET'}
                    </p>
                    <p className={`mt-0.5 text-sm ${valid ? 'text-brand-700' : 'text-rose-700'}`}>
                      {result.message || 'This ticket could not be validated.'}
                    </p>
                    {result.reason && (
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-slate-400">
                        reason: {result.reason}
                      </p>
                    )}
                  </div>
                </div>

                {ticket && (
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div className="col-span-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Passenger</dt>
                      <dd className="mt-0.5 font-bold text-slate-900">{ticket.passengerName}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Route</dt>
                      <dd className="mt-0.5 font-semibold text-slate-800">
                        {ticket.trip.origin} → {ticket.trip.destination}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Seat(s)</dt>
                      <dd className="mt-0.5 font-semibold text-slate-800">{seatLabel(ticket.seatNumbers)}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Bus</dt>
                      <dd className="mt-0.5 font-semibold text-slate-800">{ticket.trip.busNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Amount</dt>
                      <dd className="mt-0.5 font-semibold text-slate-800">{formatRwf(ticket.amount)}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Payment</dt>
                      <dd className="mt-0.5 font-semibold text-slate-800">{paymentLabel(ticket.paymentMethod)}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Departure</dt>
                      <dd className="mt-0.5 font-semibold text-slate-800">{formatDateTime(ticket.trip.departureAt)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Ticket code</dt>
                      <dd className="mt-0.5 font-mono text-xs font-semibold text-slate-700">{ticket.ticketCode}</dd>
                    </div>
                  </dl>
                )}

                {demo && (
                  <button
                    type="button"
                    onClick={() => verify(demo.qrPayload)}
                    className="btn-secondary mt-4 w-full"
                  >
                    <RefreshCw className="h-4 w-4" /> Verify demo ticket again
                  </button>
                )}
              </div>
            )}
          </div>

          {demo && (
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Ticket className="h-4 w-4 text-brand-600" /> Demo boarding pass
                </h3>
                <span className={`pill ${demo.status === 'used' ? 'bg-slate-100 text-slate-500' : 'bg-brand-50 text-brand-700'}`}>
                  {demo.status}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <img src={demo.qrDataUrl} alt="Demo ticket QR" className="h-24 w-24 rounded-lg border border-slate-200" />
                <div className="min-w-0 flex-1 text-xs">
                  <p className="font-bold text-slate-900">{demo.passengerName}</p>
                  <p className="mt-0.5 text-slate-500">Bus {demo.trip.busNumber} · {seatLabel(demo.seatNumbers)}</p>
                  <p className="mt-0.5 text-slate-500">Nyabugogo → {demo.trip.destination}</p>
                  <p className="mt-1 font-mono text-[10px] text-slate-400">{demo.ticketCode}</p>
                </div>
              </div>
              <button type="button" onClick={() => verify(demo.qrPayload)} className="btn-primary mt-4 w-full">
                <ScanLine className="h-4 w-4" /> Verify this ticket
              </button>
              <p className="mt-2 text-center text-[10px] text-slate-400">
                Verifying marks it as used. Book a new ticket to test again.
              </p>
            </div>
          )}

          {history.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-bold text-slate-900">Recent scans</h3>
              <ul className="mt-3 divide-y divide-slate-100">
                {history.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-2.5">
                    <span className={`h-2 w-2 rounded-full ${item.valid ? 'bg-brand-500' : 'bg-rose-500'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-700">{item.code}</p>
                      <p className="truncate text-[10px] text-slate-400">{item.message}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-400">
                      {new Date(item.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
            <p className="flex items-center gap-2 font-semibold text-slate-700">
              <ArrowRight className="h-3.5 w-3.5 text-brand-600" /> No camera on this device?
            </p>
            <p className="mt-1">
              Paste the ticket code in the manual box, or open the latest demo pass and verify it
              to see the flow end-to-end. You can also{' '}
              <Link to="/" className="link">book a fresh ticket</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
