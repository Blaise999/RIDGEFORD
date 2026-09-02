import Image from "next/image";
import { Plus, ArrowDownLeft, ArrowUpRight, CreditCard, Coffee, ShoppingBag, Train } from "lucide-react";

export function ScreenHome() {
  return (
    <div className="h-full w-full bg-panel pt-10 px-5 pb-6 flex flex-col">
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full overflow-hidden ring-1 ring-ink-100">
            <Image src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&auto=format&q=70" alt="Avatar" width={28} height={28} />
          </div>
          <span className="text-[12px] font-semibold text-ink-700">Hi, Lena</span>
        </div>
        <div className="h-7 w-7 rounded-full grid place-items-center bg-ink-50">
          <Plus className="h-3.5 w-3.5 text-ink-700" />
        </div>
      </div>

      <div className="mt-5">
        <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold">Main account</div>
        <div className="mt-0.5 flex items-baseline gap-1">
          <span className="text-[32px] font-bold tracking-tight text-ink-900">4.827,</span>
          <span className="text-[22px] font-semibold text-ink-500">60 €</span>
        </div>
        <div className="mt-1 text-[11px] text-brand-600 font-medium">+ 312,40 € this week</div>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2">
        {[
          { Icon: ArrowUpRight, label: "Send" },
          { Icon: ArrowDownLeft, label: "Top up" },
          { Icon: CreditCard, label: "Card" },
          { Icon: Plus, label: "More" },
        ].map(({ Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <div className="h-10 w-10 rounded-2xl bg-ink-50 grid place-items-center">
              <Icon className="h-4 w-4 text-ink-900" />
            </div>
            <span className="text-[10px] font-medium text-ink-700">{label}</span>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] font-semibold text-ink-900">Recent</span>
          <span className="text-[11px] text-ink-500">See all</span>
        </div>
        <ul className="mt-2 space-y-2.5">
          {[
            { Icon: Coffee, name: "The Barn Coffee", when: "Today", amount: "− 4,50 €", neg: true },
            { Icon: ShoppingBag, name: "Zara", when: "Today", amount: "− 79,90 €", neg: true },
            { Icon: Train, name: "Deutsche Bahn", when: "Yesterday", amount: "− 32,70 €", neg: true },
            { Icon: ArrowDownLeft, name: "Salary", when: "30 Mar", amount: "+ 3.200,00 €", neg: false },
          ].map((t, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-ink-50 grid place-items-center">
                <t.Icon className="h-3.5 w-3.5 text-ink-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-ink-900 truncate">{t.name}</div>
                <div className="text-[10.5px] text-ink-400">{t.when}</div>
              </div>
              <div className={`text-[12px] font-semibold ${t.neg ? "text-ink-900" : "text-brand-600"}`}>
                {t.amount}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
