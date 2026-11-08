import Link from "next/link";
import { ArrowRight, Zap, Globe2, Users, Plane } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { fmtMoney, maskIban } from "@/lib/utils";
import { accountCurrency, accountIdentifier } from "@/lib/account-currency";

export const dynamic = "force-dynamic";

const RAILS = [
  {
    id: "sepa_instant",
    href: "/dashboard/transfer/sepa?instant=1",
    Icon: Zap,
    title: "SEPA Instant",
    body: "Arrives in under 10 seconds, 24 / 7, across all 36 SEPA countries.",
    badge: "Most popular",
  },
  {
    id: "sepa",
    href: "/dashboard/transfer/sepa",
    Icon: Globe2,
    title: "SEPA Transfer",
    body: "Standard transfer to any EUR bank account in Europe. Arrives the next working day.",
    badge: "Free",
  },
  {
    id: "internal",
    href: "/dashboard/transfer/internal",
    Icon: Users,
    title: "To another Ridgeford Capital Bank user",
    body: "Send instantly by email — it lands in the recipient's main account immediately.",
    badge: "Instant",
  },
  {
    id: "swift",
    href: "/dashboard/transfer/international",
    Icon: Plane,
    title: "International (SWIFT)",
    body: "Choose a destination, see the required bank details and preview a cross-currency amount before requesting a transfer.",
    badge: "Global",
  },
];

export default async function TransferPicker() {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  const sb = supabaseAdmin();
  const { data: user } = await sb
    .from("users")
    .select("balance_checking, balance_savings, iban, account_number, currency, blocked")
    .eq("id", u.id)
    .single();

  const cur = accountCurrency(user?.currency);
  return (
    <div className="pt-6 max-w-3xl mx-auto">
      <h1 className="dash-h1 text-[28px] text-ink-900">Send money</h1>
      <p className="text-[13.5px] text-ink-500 mt-1">
        Pick how you'd like to send. All transfers require admin approval for your safety.
      </p>

      <div className="mt-6 card p-5 flex items-center justify-between">
        <div>
          <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Available balance
          </div>
          <div className="mt-0.5 text-[26px] font-bold text-ink-900 tabular-nums">
            {fmtMoney(Number(user?.balance_checking || 0) + Number(user?.balance_savings || 0), cur)}
          </div>
          <div className="text-[11.5px] text-ink-400 tabular-nums">{cur === "USD" ? accountIdentifier({ currency: cur, account_number: user?.account_number }) : maskIban(user?.iban || "")}</div>
        </div>
      </div>

      {cur === "USD" && <p className="mt-5 text-[12px] text-ink-500">USD accounts use U.S. account and ABA routing details for domestic wires, or SWIFT/BIC for international transfers. Domestic ACH/Fedwire connectivity requires a banking partner and is not enabled in this build.</p>}
      <div className="mt-6 space-y-3">
        {RAILS.filter((r) => cur === "EUR" || !r.id.startsWith("sepa")).map((r) => (
          <Link
            key={r.id}
            href={r.href}
            className="card p-5 flex items-center gap-4 hover:shadow-pop transition group focus-ring"
          >
            <div className="h-11 w-11 rounded-2xl bg-ink-50 grid place-items-center">
              <r.Icon className="h-5 w-5 text-ink-900" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[15.5px] font-semibold text-ink-900">{r.title}</span>
                <span className="inline-flex items-center rounded-full bg-brand-500/10 text-brand-700 text-[10.5px] font-bold uppercase tracking-wide px-2 py-0.5">
                  {r.badge}
                </span>
              </div>
              <p className="mt-1 text-[13.5px] text-ink-500">{r.body}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-ink-400 group-hover:translate-x-0.5 group-hover:text-ink-900 transition" />
          </Link>
        ))}
      </div>

      {/* Quiet secondary entry point: keep this in Payments, not on the landing hero. */}
      <details className="mt-7 rounded-xl border border-ink-100 bg-panel/70 px-4 py-3 group">
        <summary className="cursor-pointer select-none text-[12.5px] font-semibold text-ink-600 hover:text-ink-900 focus-ring">
          International transfer resources
        </summary>
        <div className="mt-3 border-t border-ink-100 pt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-ink-800">Country requirements &amp; exchange rates</p>
            <p className="text-[12px] text-ink-500 mt-1">Review destination banking details and a reference FX quote before making a request.</p>
          </div>
          <Link href="/dashboard/transfer/international" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-700 hover:underline focus-ring">
            View guide <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </details>
    </div>
  );
}
