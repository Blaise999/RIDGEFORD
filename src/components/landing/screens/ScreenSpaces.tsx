import { Plus } from "lucide-react";

const SPACES = [
  { name: "Holiday · Lisbon", emoji: "🏖️", balance: "1.240 €", goal: "2.000 €", pct: 62, tint: "from-amber-100 to-amber-50" },
  { name: "New MacBook",      emoji: "💻", balance: "820 €",   goal: "2.400 €", pct: 34, tint: "from-sky-100 to-sky-50" },
  { name: "Rainy day fund",   emoji: "☔️", balance: "3.100 €", goal: "5.000 €", pct: 62, tint: "from-brand-100 to-brand-50" },
  { name: "Gym & wellness",   emoji: "🧘‍♀️", balance: "140 €",  goal: "300 €",   pct: 47, tint: "from-pink-100 to-pink-50" },
];

export function ScreenSpaces() {
  return (
    <div className="h-full w-full bg-panel pt-10 px-5 pb-6 flex flex-col">
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold">Spaces</div>
          <div className="text-[16px] font-bold text-ink-900 leading-tight">Save smarter</div>
        </div>
        <div className="h-8 w-8 rounded-full grid place-items-center bg-night-900 text-white">
          <Plus className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {SPACES.map((s) => (
          <div
            key={s.name}
            className={`rounded-2xl p-3 bg-gradient-to-br ${s.tint} border border-white/60`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-xl bg-panel/80 grid place-items-center text-[16px]">
                  {s.emoji}
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-ink-900 truncate">{s.name}</div>
                  <div className="text-[10.5px] text-ink-500">of {s.goal}</div>
                </div>
              </div>
              <div className="text-[13px] font-bold text-ink-900">{s.balance}</div>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-panel/80 overflow-hidden">
              <span
                className="block h-full rounded-full bg-night-900"
                style={{ width: `${s.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto rounded-2xl bg-ink-50 p-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-brand-500 grid place-items-center text-white font-bold">
          %
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-ink-900">Interest: 2,26 % p.a.</div>
          <div className="text-[10.5px] text-ink-500 truncate">On every space, paid monthly</div>
        </div>
      </div>
    </div>
  );
}
