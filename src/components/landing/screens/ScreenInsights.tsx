const CATS = [
  { name: "Groceries",   pct: 38, amt: "412 €", color: "bg-brand-500" },
  { name: "Restaurants", pct: 24, amt: "260 €", color: "bg-night-900" },
  { name: "Transport",   pct: 14, amt: "152 €", color: "bg-amber-400" },
  { name: "Shopping",    pct: 12, amt: "130 €", color: "bg-sky-500" },
  { name: "Subscriptions", pct: 8, amt: "87 €",  color: "bg-pink-500" },
  { name: "Other",       pct: 4,  amt: "43 €",  color: "bg-ink-300" },
];

export function ScreenInsights() {
  return (
    <div className="h-full w-full bg-panel pt-10 px-5 pb-6 flex flex-col">
      <div className="pt-1">
        <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold">Insights · April</div>
        <div className="text-[16px] font-bold text-ink-900 leading-tight">Spending this month</div>
      </div>

      <div className="mt-3 relative h-[120px] w-full">
        {/* sparkline */}
        <svg viewBox="0 0 300 120" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#15a586" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#15a586" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,90 C30,80 50,60 75,68 C100,76 120,40 150,48 C180,56 200,30 225,34 C255,38 275,60 300,40 L300,120 L0,120 Z"
            fill="url(#grad)"
          />
          <path
            d="M0,90 C30,80 50,60 75,68 C100,76 120,40 150,48 C180,56 200,30 225,34 C255,38 275,60 300,40"
            fill="none"
            stroke="#15a586"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute top-2 left-0 text-[10px] text-ink-400">1.084 €</div>
        <div className="absolute bottom-2 left-0 text-[10px] text-ink-400">0 €</div>
      </div>

      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-[28px] font-bold tracking-tight text-ink-900">1.084,</span>
        <span className="text-[16px] font-semibold text-ink-500">30 €</span>
      </div>
      <div className="text-[10.5px] text-ink-500">vs. 1.210 € last month · <span className="text-brand-600 font-semibold">− 10,4 %</span></div>

      <div className="mt-4 space-y-2">
        {CATS.map((c) => (
          <div key={c.name}>
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-semibold text-ink-900">{c.name}</span>
              <span className="text-[11px] text-ink-500">{c.amt}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-ink-100 overflow-hidden">
              <span className={`block h-full rounded-full ${c.color}`} style={{ width: `${c.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
