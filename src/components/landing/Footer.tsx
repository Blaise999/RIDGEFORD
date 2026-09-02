import Link from "next/link";
import { Logo } from "./Logo";
import { Globe } from "lucide-react";

const COLS = [
  {
    title: "Product",
    links: ["Personal", "Business", "Cards", "Spaces", "Insights", "Pricing"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Press", "Blog", "Magazine"],
  },
  {
    title: "Resources",
    links: ["Help", "Contact", "Security", "Status", "API docs"],
  },
  {
    title: "Legal",
    links: ["Terms", "Privacy", "Imprint", "Cookies", "Deposit protection"],
  },
];

export function Footer() {
  return (
    <footer className="bg-night-900 text-white">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 py-16">
        <div className="grid lg:grid-cols-[1.4fr_3fr] gap-10">
          <div>
            <Logo onDark showTagline />
            <p className="mt-5 text-[14px] text-white/60 leading-relaxed max-w-xs">
              Ridgeford Capital Bank AG — Kaiserstraße 16, 60311 Frankfurt am Main. Regulated by BaFin and the Deutsche Bundesbank. Deposits protected up to €100,000.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-[13px] text-white/80">
              <Globe className="h-4 w-4" />
              English (Germany)
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {COLS.map((col) => (
              <div key={col.title}>
                <div className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-white/60">
                  {col.title}
                </div>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l}>
                      <Link href="#" className="text-[14px] text-white/85 hover:text-white transition">
                        {l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-[12.5px] text-white/50">
          <span>© {new Date().getFullYear()} Ridgeford Capital Bank AG. All rights reserved.</span>
          <span>Frankfurt am Main.</span>
        </div>
      </div>
    </footer>
  );
}
