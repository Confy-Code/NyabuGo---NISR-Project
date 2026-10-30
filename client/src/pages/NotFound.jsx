import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container-app flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Compass className="h-8 w-8" />
      </span>
      <p className="mt-5 text-5xl font-extrabold tracking-tight text-slate-900">404</p>
      <h1 className="mt-2 text-xl font-bold text-slate-800">This stop does not exist</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        The page you are looking for is not on the NyabuGo network. Head back to the departures board.
      </p>
      <Link to="/" className="btn-primary mt-6">
        <Home className="h-4 w-4" /> Back to Nyabugogo
      </Link>
    </div>
  );
}
