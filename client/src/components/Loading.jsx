export function BusCardSkeleton() {
  return (
    <div className="card animate-pulse overflow-hidden p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-slate-100" />
          <div className="space-y-1.5">
            <div className="h-3 w-28 rounded bg-slate-100" />
            <div className="h-2.5 w-20 rounded bg-slate-100" />
          </div>
        </div>
        <div className="h-5 w-20 rounded-full bg-slate-100" />
      </div>
      <div className="mt-5 flex items-center gap-3">
        <div className="h-7 w-16 rounded bg-slate-100" />
        <div className="h-px flex-1 bg-slate-100" />
        <div className="h-7 w-16 rounded bg-slate-100" />
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-dashed border-slate-100 pt-4">
        <div className="h-3 w-36 rounded bg-slate-100" />
        <div className="h-9 w-24 rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm font-medium text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
      {label}
    </div>
  );
}
