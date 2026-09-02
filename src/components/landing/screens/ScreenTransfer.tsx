import { ArrowLeft, CheckCircle2 } from "lucide-react";

export function ScreenTransfer() {
  return (
    <div className="h-full w-full bg-panel pt-10 px-5 pb-6 flex flex-col">
      <div className="flex items-center justify-between pt-1">
        <div className="h-7 w-7 rounded-full bg-ink-50 grid place-items-center">
          <ArrowLeft className="h-3.5 w-3.5 text-ink-700" />
        </div>
        <span className="text-[12px] font-semibold text-ink-900">New transfer</span>
        <span className="w-7" />
      </div>

      <div className="mt-6 text-center">
        <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold">You send</div>
        <div className="mt-1 flex items-end justify-center gap-1">
          <span className="text-[44px] font-bold tracking-tight text-ink-900 leading-none">240</span>
          <span className="text-[20px] font-semibold text-ink-500 pb-1">,00 €</span>
        </div>
        <div className="mt-2 inline-flex items-center gap-1 text-[10.5px] text-brand-600 font-semibold bg-brand-50 rounded-full px-2 py-0.5">
          SEPA Instant · arrives in ~10s
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-ink-100 p-3.5">
        <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold">To</div>
        <div className="mt-1.5 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center text-white font-bold text-[13px]">
            AM
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-ink-900 truncate">Anna Müller</div>
            <div className="text-[10.5px] text-ink-400 truncate">DE89 **** **** **** 3000</div>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-ink-100 p-3.5">
        <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold">Reference</div>
        <div className="mt-1 text-[12.5px] text-ink-900">Rent — April 🏠</div>
      </div>

      <div className="mt-3 rounded-2xl bg-ink-50 p-3.5 space-y-1.5">
        <Row k="Fee" v="Free" />
        <Row k="Exchange rate" v="1,0000" />
        <Row k="Arrives" v="In seconds" highlight />
      </div>

      <button className="mt-auto w-full h-11 rounded-full bg-night-900 text-white font-semibold text-[13.5px] inline-flex items-center justify-center gap-2">
        <CheckCircle2 className="h-4 w-4" />
        Confirm · 240,00 €
      </button>
    </div>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-ink-500">{k}</span>
      <span className={`text-[12px] font-semibold ${highlight ? "text-brand-600" : "text-ink-900"}`}>{v}</span>
    </div>
  );
}
