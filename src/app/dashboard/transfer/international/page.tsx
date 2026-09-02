"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Globe2, Loader2 } from "lucide-react";
import { TransferOtpModal } from "@/components/dashboard/TransferOtpModal";
import { useTransferOtp } from "@/lib/useTransferOtp";

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "SEK", "NOK", "DKK", "JPY", "AUD", "CAD", "AED"];

export default function InternationalPage() {
  const router = useRouter();
  const otp = useTransferOtp();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [name, setName] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [intermediary, setIntermediary] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const okStarted = await otp.begin({
        rail: "swift",
        amount: Number(amount.replace(",", ".")),
        currency,
        beneficiary_name: name,
        beneficiary_iban: iban.replace(/\s+/g, ""),
        beneficiary_bic: bic.replace(/\s+/g, ""),
        beneficiary_country: country,
        beneficiary_address: address || undefined,
        intermediary_bank: intermediary || undefined,
        reference,
      });
      if (!okStarted) setErr(otp.error || "Could not start authorisation");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-6 max-w-2xl mx-auto">
      <Link href="/dashboard/transfer" className="inline-flex items-center gap-1.5 text-[13px] text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="mt-3 dash-h1 text-[30px] text-ink-900">
        International transfer
      </h1>
      <p className="text-[13.5px] text-ink-500 mt-1">
        Send money worldwide via SWIFT. Arrives in 1–3 business days.
      </p>

      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-500/10 text-brand-700 px-3 py-1.5 text-[12.5px] font-semibold">
        <Globe2 className="h-3.5 w-3.5" /> 4,50 € fee · live FX on approval
      </div>

      <form onSubmit={submit} className="mt-6 card p-6 space-y-4">
        <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink-700">Amount</span>
            <input
              required
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="mt-1.5 w-full h-12 rounded-xl border border-ink-200 bg-panel px-4 text-[18px] font-semibold outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink-700">Currency</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1.5 h-12 rounded-xl border border-ink-200 bg-panel px-3 text-[15px] font-semibold outline-none focus:border-brand-500"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>

        <Field label="Beneficiary full name">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sofía Martín García" className="input" />
        </Field>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Beneficiary IBAN / Account number">
            <input required value={iban} onChange={(e) => setIban(e.target.value.toUpperCase())} placeholder="ES91 2100 0418 45 0200051332" className="input tabular-nums" />
          </Field>
          <Field label="BIC / SWIFT code">
            <input required value={bic} onChange={(e) => setBic(e.target.value.toUpperCase())} placeholder="CAIXESBBXXX" className="input" />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Beneficiary country">
            <input required value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Spain" className="input" />
          </Field>
          <Field label="Beneficiary address (optional)">
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Gran Via 1, 28013 Madrid" className="input" />
          </Field>
        </div>

        <Field label="Intermediary bank (optional)" hint="Some rails require a correspondent bank — ask your recipient if unsure.">
          <input value={intermediary} onChange={(e) => setIntermediary(e.target.value)} placeholder="e.g. Citibank N.A. London" className="input" />
        </Field>

        <Field label="Reference" hint="Shown on the recipient's statement.">
          <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Invoice 2024-042" maxLength={140} className="input" />
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
          <button type="submit" disabled={loading} className="btn btn-brand flex-1 disabled:opacity-70">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Send for review
          </button>
        </div>

        <p className="text-[11.5px] text-ink-400 text-center">
          SWIFT transfers are reviewed by our compliance team before they settle.
        </p>
      </form>

      <style jsx>{`
        .input {
          width: 100%;
          height: 44px;
          border-radius: 12px;
          border: 1px solid #d9dee5;
          background: #fff;
          padding: 0 1rem;
          font-size: 15px;
          outline: none;
        }
        .input:focus { border-color: #2f66ff; box-shadow: 0 0 0 1px #2f66ff; }
      `}</style>

      <TransferOtpModal
        {...otp.modalProps}
        onSubmit={(code) =>
          otp.confirm(code, (d) =>
            router.push(
              `/dashboard/transfer/success?ref=${d.transfer.reference_id}`
            )
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
