import { Link } from 'react-router-dom';
import { BusFront, Github, Database, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="no-print mt-20 border-t border-slate-200 bg-white">
      <div className="container-app grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white">
              <BusFront className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-extrabold tracking-tight text-slate-900">
                Nyabu<span className="text-brand-600">Go</span>
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Smart Intercity Transit
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
            Digital ticketing for provincial routes from Nyabugogo, Kigali. Built for the
            NISR hackathon with predictive fleet intelligence and Kinyarwanda AI support.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="pill bg-brand-50 text-brand-700">
              <Database className="h-3.5 w-3.5" /> NISR RW_LFS2025
            </span>
            <span className="pill bg-slate-100 text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified QR tickets
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Platform</p>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
            <li><Link className="hover:text-brand-700" to="/">Route &amp; schedule viewer</Link></li>
            <li><Link className="hover:text-brand-700" to="/scanner">Driver QR scanner</Link></li>
            <li><Link className="hover:text-brand-700" to="/admin">Operator dashboard</Link></li>
            <li><Link className="hover:text-brand-700" to="/admin">NISR fleet insights</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Grounding</p>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
            <li>Dataset: RW_LFS2025</li>
            <li>Variables: D23 &amp; D23A</li>
            <li>Sample: 31,256 respondents</li>
            <li>
              <a className="hover:text-brand-700" href="https://www.statistics.gov.rw/" target="_blank" rel="noreferrer">
                National Institute of Statistics of Rwanda
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="container-app flex flex-col items-center justify-between gap-3 py-5 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} NyabuGo. Hackathon prototype — Rwanda.</p>
          <p className="inline-flex items-center gap-1.5">
            <Github className="h-3.5 w-3.5" /> Digitalising gukatisha amatike
          </p>
        </div>
      </div>
    </footer>
  );
}
