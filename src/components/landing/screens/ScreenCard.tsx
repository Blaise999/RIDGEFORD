import { Snowflake, Eye, Settings, Infinity as Infinit } from "lucide-react";

export function ScreenCard() {
  return (
    <div className="h-full w-full bg-gradient-to-b from-ink-50 to-white pt-10 px-5 pb-6 flex flex-col">
      <div className="pt-1 flex items-center justify-between">
        <span className="text-[12px] font-semibold text-ink-900">Cards</span>
        <span className="text-[11px] text-ink-400">1 of 3</span>
      </div>

      <div className="mt-6 mx-auto w-[230px] aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-night-900 via-night-800 to-night-700 text-white p-4 shadow-2xl ring-1 ring-white/10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded-sm bg-brand-500/90" />
            <span className="text-[10px] font-semibold tracking-wide">RIDGEFORD</span>
          </div>
          <Infinit className="h-4 w-4 text-white/70" />
        </div>
        <div className="mt-8 text-[14px] tracking-[0.2em] font-semibold">
          •••• 4417
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="text-[8px] uppercase text-white/50">Cardholder</div>
            <div className="text-[10.5px] font-semibold mt-0.5">Lena Schmidt</div>
          </div>
          <div className="text-right">
            <div className="text-[8px] uppercase text-white/50">Expires</div>
            <div className="text-[10.5px] font-semibold mt-0.5">08/29</div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-0.5">
              <span className="h-4 w-4 rounded-full bg-[#eb001b]" />
              <span className="h-4 w-4 rounded-full bg-[#f79e1b] -ml-1.5 mix-blend-multiply" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5">
        <span className="h-1.5 w-4 rounded-full bg-night-900" />
        <span className="h-1.5 w-1.5 rounded-full bg-ink-200" />
        <span className="h-1.5 w-1.5 rounded-full bg-ink-200" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          { Icon: Snowflake, label: "Freeze" },
          { Icon: Eye, label: "Details" },
          { Icon: Settings, label: "Settings" },
        ].map(({ Icon, label }) => (
          <button key={label} className="rounded-2xl border border-ink-100 bg-panel py-2.5 px-2 flex flex-col items-center gap-1">
            <Icon className="h-4 w-4 text-ink-900" />
            <span className="text-[10px] font-semibold text-ink-700">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-panel border border-ink-100 p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-ink-400 font-semibold uppercase tracking-wide">Weekly spent</span>
          <span className="text-[11px] text-ink-400 font-semibold">of 1.200 €</span>
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-[22px] font-bold text-ink-900">438,</span>
          <span className="text-[14px] font-semibold text-ink-500">20 €</span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-ink-100 overflow-hidden">
          <span className="block h-full w-[36%] rounded-full bg-brand-500" />
        </div>
      </div>
    </div>
  );
}
