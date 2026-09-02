import Link from "next/link";
import { ArrowRight, Zap, Globe2, Users, Plane } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { fmtMoney, maskIban } from "@/lib/utils";

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
    body: "Send money worldwide in 20+ currencies. Arrives in 1–3 business days.",
    badge: "Global",
  },
];

export default async function TransferPicker() {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  const sb = supabaseAdmin();
  const { data: user } = await sb
    .from("users")
    .select("balance_checking, balance_savings, iban, blocked")
    .eq("id", u.id)
    .single();

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
            {fmtMoney(Number(user?.balance_checking || 0) + Number(user?.balance_savings || 0))}
          </div>
          <div className="text-[11.5px] text-ink-400 tabular-nums">{maskIban(user?.iban || "")}</div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {RAILS.map((r) => (
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
    </div>
  );
}
