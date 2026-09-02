import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { Globe2, Nfc, ShieldCheck, Snowflake, Wifi } from "lucide-react";
import { fmtMoney } from "@/lib/utils";
import { LogoMark } from "@/components/brand/Logo";

export const dynamic = "force-dynamic";

export default async function CardsPage() {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  const sb = supabaseAdmin();
  const { data: user } = await sb
    .from("users")
    .select("first_name,last_name,card_last4,balance_checking,country")
    .eq("id", u.id)
    .single();

  const holder = `${user?.first_name || "Account"} ${user?.last_name || "Holder"}`.toUpperCase();
  const last4 = user?.card_last4 || "4417";

  return (
    <div className="pt-6 pb-12 max-w-5xl mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[30px] tracking-tight text-ink-900">Your card</h1>
          <p className="text-[13.5px] text-ink-500 mt-1">
            A euro debit card. No fee anywhere in the euro area, and the
            interchange your merchant pays is capped by regulation at 0,2 %.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
          <ShieldCheck className="h-3.5 w-3.5 text-steel" />
          Active
        </span>
      </div>

      <div className="mt-8 grid lg:grid-cols-[1.25fr_1fr] gap-8 items-start">
        {/* ── the card ───────────────────────────────────────────────── */}
        <div className="relative mx-auto w-full max-w-md">
          <div
            className="relative aspect-[1,586/1] rounded-2xl p-7 overflow-hidden border border-[#2a2a2a]"
            style={{
              // Brushed metal, not a gradient toy: a fine diagonal grain over
              // a near-black plate, which is what a real premium card looks
              // like under light.
              background:
                "repeating-linear-gradient(115deg, #161616 0px, #191919 2px, #141414 4px), #141414",
              boxShadow: "0 30px 60px -30px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <div className="flex items-start justify-between">
              <span className="flex items-center gap-2.5">
                <LogoMark className="h-6 w-6 text-[#eeeeee]" />
                <span className="font-display text-[15px] tracking-[0.05em] text-[#eeeeee]" style={{ fontWeight: 600 }}>
                  RIDGEFORD
                </span>
              </span>
              <Nfc className="h-5 w-5 text-[#666]" />
            </div>

            {/* chip */}
            <div
              className="mt-7 h-9 w-12 rounded-[5px] border border-[#3a3a3a]"
              style={{
                background: "linear-gradient(135deg, #4a4a4a, #2c2c2c 45%, #3f3f3f)",
              }}
              aria-hidden
            />

            <div className="mt-5 font-mono text-[17px] tracking-[0.18em] text-[#eeeeee]">
              •••• •••• •••• {last4}
            </div>

            <div className="mt-5 flex items-end justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[8.5px] uppercase tracking-[0.18em] text-[#666]">Cardholder</div>
                <div className="mt-1 text-[12px] font-medium text-[#d4d4d4] truncate">{holder}</div>
              </div>
              <div>
                <div className="text-[8.5px] uppercase tracking-[0.18em] text-[#666]">Expires</div>
                <div className="mt-1 font-mono text-[12px] text-[#d4d4d4]">08/29</div>
              </div>
              <span className="font-display text-[13px] italic tracking-wide text-[#9a9a9a]">
                debit
              </span>
            </div>
          </div>

          <p className="mt-4 text-center text-[11.5px] text-ink-400">
            Card details are never stored in full — only the last four digits.
          </p>
        </div>

        {/* ── controls ───────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="card p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
              Available to spend
            </div>
            <div className="mt-1.5 font-display text-[34px] text-ink-900 tracking-tight tnum leading-none">
              {fmtMoney(user?.balance_checking || 0)}
            </div>
            <div className="mt-2 text-[11.5px] text-ink-400">From your current account</div>
          </div>

          <div className="rounded-2xl border border-ink-200 divide-y divide-ink-100 overflow-hidden">
            {[
              { Icon: Snowflake, k: "Freeze card", v: "Instant, reversible" },
              { Icon: Globe2, k: "Use abroad", v: "Enabled · 0,35 % over ECB rate" },
              { Icon: Wifi, k: "Contactless", v: "Enabled" },
              { Icon: ShieldCheck, k: "Online payments", v: "Enabled · 3-D Secure" },
            ].map(({ Icon, k, v }) => (
              <button
                key={k}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-panel-2 transition"
              >
                <span className="h-8 w-8 shrink-0 rounded-lg grid place-items-center bg-ink-100 text-ink-500">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium text-ink-900">{k}</span>
                  <span className="block text-[11.5px] text-ink-400 truncate">{v}</span>
                </span>
              </button>
            ))}
          </div>

          <p className="text-[11px] leading-relaxed text-ink-400 px-1">
            Interchange on European consumer cards is capped at 0,2 % on debit
            and 0,3 % on credit under Reg. (EU) 2015/751. We mention it because
            most banks would rather you didn&apos;t know the number.
          </p>
        </div>
      </div>
    </div>
  );
}
