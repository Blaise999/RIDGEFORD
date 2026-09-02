"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, Globe2, Loader2, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { TransferOtpModal } from "@/components/dashboard/TransferOtpModal";
import { useTransferOtp } from "@/lib/useTransferOtp";
import { formatIban, verifyIban, VOP_COPY, type VopResult } from "@/lib/iban";
import { cx } from "@/lib/utils";

/**
 * A euro transfer, anywhere in the euro area.
 *
 * The country is read off the IBAN rather than asked for, the rail is chosen
 * from what the beneficiary's country can actually receive, and the payee name
 * is checked before authorisation as Art. 5c of the Instant Payments Regulation
 * requires. Nothing here assumes Germany.
 */
export default function SepaPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const preferInstant = sp.get("instant") !== "0";
  const otp = useTransferOtp();

  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Verification of Payee
  const [vop, setVop] = useState<{ result: VopResult; country: string; country_name: string; instant: boolean; note?: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const debounce = useRef<any>(null);

  // Local, synchronous verdict — country badge and format feedback while typing.
  const local = iban.trim() ? verifyIban(iban) : null;
  const country = local?.ok ? local.country : local?.country || null;
  const instantEligible = Boolean(local?.ok && local.instant && preferInstant);

  /**
   * The name check fires once the IBAN is genuinely valid and a name exists.
   * Re-running it on every keystroke would hammer the receiving PSP, so it
   * settles for 600 ms first.
   */
  useEffect(() => {
    setVop(null);
    setAcknowledged(false);
    if (!local?.ok || name.trim().length < 3) return;

    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setChecking(true);
      try {
        const r = await fetch("/api/transfers/vop", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ iban, name }),
        });
        const d = await r.json();
        if (d?.ok) setVop(d);
      } catch {
        /* a failed check is "not supported", never a blocker */
      } finally {
        setChecking(false);
      }
    }, 600);

    return () => clearTimeout(debounce.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iban, name, local?.ok]);

  const needsAck = vop?.result === "no_match" || vop?.result === "close_match";
  const blocked = Boolean(local && !local.ok) || (needsAck && !acknowledged);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (local && !local.ok) return setErr(local.reason);
    setLoading(true);
    try {
      const okStarted = await otp.begin({
        rail: "sepa",
        instant: instantEligible,
        amount: Number(amount.replace(",", ".")),
        currency: "EUR",
        beneficiary_name: name,
        beneficiary_iban: iban.replace(/\s+/g, ""),
        beneficiary_bic: bic || undefined,
        reference,
        vop_acknowledged: acknowledged,
      });
      if (!okStarted) setErr(otp.error || "Could not start authorisation");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-6 max-w-xl mx-auto pb-10">
      <Link href="/dashboard/transfer" className="inline-flex items-center gap-1.5 text-[13px] text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="mt-3 dash-h1 text-[30px] text-ink-900">
        Euro transfer
      </h1>
      <p className="text-[13.5px] text-ink-500 mt-1">
        To any account in the euro area, and to the wider SEPA zone in euro. We
        pick the rail from the beneficiary&apos;s IBAN — you don&apos;t have to.
      </p>

      <form onSubmit={submit} className="mt-6 card p-6 space-y-4">
        <Field label="Amount (EUR)" hint="No scheme ceiling on instant euro transfers since the 2024 regulation removed it.">
          <div className="relative">
            <input
              required
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full h-12 rounded-xl border border-ink-200 bg-night-800 pl-4 pr-12 text-[18px] font-semibold outline-none focus:border-gold-500 tnum"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 font-semibold">€</span>
          </div>
        </Field>

        <Field label="Beneficiary name" hint="Exactly as their bank holds it — this is what gets checked.">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Anna Weber · Société Générale SA · Maria Rossi"
            className="w-full h-11 rounded-xl border border-ink-200 bg-night-800 px-4 text-[15px] outline-none focus:border-gold-500"
          />
        </Field>

        <Field label="IBAN" hint="Any euro-area or SEPA country. We format and check it as you type.">
          <input
            required
            value={iban}
            onChange={(e) => setIban(formatIban(e.target.value))}
            placeholder="ES91 2100 0418 4502 0005 1332"
            aria-invalid={local && !local.ok ? "true" : undefined}
            className={cx(
              "w-full h-11 rounded-xl border bg-night-800 px-4 text-[15px] outline-none tnum font-mono",
              local && !local.ok ? "border-red-500/50" : "border-ink-200 focus:border-gold-500"
            )}
          />
        </Field>

        {/* ── country + rail readout ─────────────────────────────────── */}
        {country && (
          <div className={cx(
            "rounded-xl border px-4 py-3 text-[12.5px]",
            local?.ok ? "border-ink-200 bg-panel-2/60" : "border-red-500/30 bg-red-500/10"
          )}>
            {local?.ok ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 font-semibold text-ink-900">
                    <Globe2 className="h-4 w-4 text-gold-400" />
                    {country.name}
                    <span className="text-ink-500 font-normal">· {country.code}</span>
                  </span>
                  {local.instant ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-up/12 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide up">
                      <Zap className="h-3 w-3" /> Instant · under 10 s
                    </span>
                  ) : (
                    <span className="rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-500">
                      SEPA · next working day
                    </span>
                  )}
                </div>
                <p className="mt-2 text-ink-500 leading-relaxed">
                  {local.note ||
                    "Settles in central bank money over TIPS. Instant transfers may not be priced above standard ones, so this costs 0,00 € either way."}
                </p>
              </>
            ) : (
              <span className="text-red-300">{local?.reason}</span>
            )}
          </div>
        )}

        {/* ── Verification of Payee ──────────────────────────────────── */}
        {(checking || vop) && (
          <div
            className={cx(
              "rounded-xl border px-4 py-3",
              checking && "border-ink-200 bg-panel-2/60",
              vop?.result === "match" && "border-up/30 bg-up/[0.07]",
              vop?.result === "close_match" && "border-amber-500/30 bg-amber-500/[0.08]",
              vop?.result === "no_match" && "border-red-500/40 bg-red-500/[0.08]",
              vop?.result === "not_supported" && "border-ink-200 bg-panel-2/60"
            )}
          >
            <div className="flex items-center gap-2 text-[12.5px] font-bold">
              {checking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-ink-400" />
                  <span className="text-ink-500">Checking the name against the IBAN…</span>
                </>
              ) : (
                <>
                  {vop?.result === "match" && <Check className="h-4 w-4 up" strokeWidth={3} />}
                  {vop?.result === "close_match" && <AlertTriangle className="h-4 w-4 text-amber-300" />}
                  {vop?.result === "no_match" && <AlertTriangle className="h-4 w-4 down" />}
                  {vop?.result === "not_supported" && <ShieldCheck className="h-4 w-4 text-ink-400" />}
                  <span
                    className={cx(
                      vop?.result === "match" && "up",
                      vop?.result === "close_match" && "text-amber-300",
                      vop?.result === "no_match" && "down",
                      vop?.result === "not_supported" && "text-ink-500"
                    )}
                  >
                    {vop && VOP_COPY[vop.result].label}
                  </span>
                </>
              )}
            </div>

            {vop && !checking && (
              <p className="mt-1.5 text-[12px] leading-relaxed text-ink-600">
                {VOP_COPY[vop.result].body}
              </p>
            )}

            {needsAck && !checking && (
              <label className="mt-3 flex gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#c9a227]"
                />
                <span className="text-[12px] leading-relaxed text-ink-600">
                  I have checked the beneficiary&apos;s details independently and want to
                  send anyway. I understand a transfer cannot be recalled once it settles.
                </span>
              </label>
            )}
          </div>
        )}

        <Field label="BIC (optional)" hint="Not needed inside the EEA — the IBAN is enough.">
          <input
            value={bic}
            onChange={(e) => setBic(e.target.value.toUpperCase())}
            placeholder="BNPAFRPPXXX"
            className="w-full h-11 rounded-xl border border-ink-200 bg-night-800 px-4 text-[15px] outline-none focus:border-gold-500 font-mono"
          />
        </Field>

        <Field label="Reference" hint="Shown on the beneficiary's statement.">
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Invoice 2026-114"
            maxLength={140}
            className="w-full h-11 rounded-xl border border-ink-200 bg-night-800 px-4 text-[15px] outline-none focus:border-gold-500"
          />
        </Field>

        {err && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-[13.5px] p-3">
            {err}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => router.back()} className="btn btn-ghost flex-1">
            Cancel
          </button>
          <button type="submit" disabled={loading || blocked} className="btn btn-primary flex-1 disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {instantEligible ? "Send instantly" : "Send transfer"}
          </button>
        </div>

        <p className="text-[11.5px] text-ink-400 text-center leading-relaxed">
          Outbound transfers are reviewed by compliance before they settle. The
          name check is free and required by law — it warns you, it never decides
          for you.
        </p>
      </form>

      <TransferOtpModal
        {...otp.modalProps}
        onSubmit={(code) =>
          otp.confirm(code, (d) =>
            router.push(`/dashboard/transfer/success?ref=${d.transfer.reference_id}`)
          )
        }
      />
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-semibold text-ink-700">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-[11.5px] text-ink-400">{hint}</span>}
    </label>
  );
}
