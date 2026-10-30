import { Armchair, CircleDot, Disc3 } from 'lucide-react';

function Seat({ seat, selected, onToggle }) {
  const isSold = seat.status !== 'available';
  const isSelected = selected.includes(seat.number);

  return (
    <button
      type="button"
      disabled={isSold}
      onClick={() => onToggle(seat.number)}
      aria-pressed={isSelected}
      aria-label={`Seat ${seat.number}${isSold ? ' unavailable' : isSelected ? ' selected' : ' available'}`}
      className={`group relative grid h-11 w-11 place-items-center rounded-lg border text-xs font-bold transition ${
        isSold
          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300'
          : isSelected
            ? 'border-brand-600 bg-brand-600 text-white shadow-soft'
            : 'border-slate-300 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-700'
      }`}
    >
      <Armchair className="h-4 w-4" strokeWidth={2.4} />
      <span className="absolute -bottom-1 -right-1 rounded bg-white px-1 text-[9px] font-bold leading-tight text-slate-500 ring-1 ring-slate-200 group-disabled:text-slate-300">
        {seat.number}
      </span>
    </button>
  );
}

export default function SeatMap({ seats = [], selected = [], onToggle, capacity = 30 }) {
  const rows = [];
  for (let start = 1; start <= capacity; start += 4) {
    const row = [];
    for (let offset = 0; offset < 4; offset += 1) {
      const number = start + offset;
      if (number <= capacity) row.push(number);
    }
    rows.push(row);
  }

  const byNumber = new Map(seats.map((seat) => [seat.number, seat]));

  return (
    <div>
      <div className="mx-auto flex max-w-[320px] flex-col items-center">
        <div className="mb-4 flex w-full items-center justify-between rounded-t-2xl border border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <CircleDot className="h-3.5 w-3.5" /> Front
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <Disc3 className="h-4 w-4" /> Driver
          </span>
        </div>

        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              {row.slice(0, 2).map((number) => (
                <Seat
                  key={number}
                  seat={byNumber.get(number) || { number, status: 'available' }}
                  selected={selected}
                  onToggle={onToggle}
                />
              ))}
              <span className="w-6 text-center text-[10px] font-medium text-slate-300">aisle</span>
              {row.slice(2).map((number) => (
                <Seat
                  key={number}
                  seat={byNumber.get(number) || { number, status: 'available' }}
                  selected={selected}
                  onToggle={onToggle}
                />
              ))}
              {row.length < 4 && <span className="w-11" />}
            </div>
          ))}
        </div>
        <div className="mt-4 h-3 w-full rounded-b-2xl border border-slate-200 border-t-0 bg-slate-100" />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-[11px] font-medium text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded border border-slate-300 bg-white" /> Available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded border border-brand-600 bg-brand-600" /> Selected
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded border border-slate-200 bg-slate-100" /> Sold
        </span>
      </div>
    </div>
  );
}
