"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { TransferOtpModal } from "@/components/dashboard/TransferOtpModal";
import { useTransferOtp } from "@/lib/useTransferOtp";

export default function InternalPage() {
  const router = useRouter();
  const otp = useTransferOtp();
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const okStarted = await otp.begin({
        rail: "internal",
        amount: Number(amount.replace(",", ".")),
        currency: "EUR",
        beneficiary_name: name || email,
        beneficiary_email: email,
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
    <div className="pt-6 max-w-xl mx-auto">
      <Link href="/dashboard/transfer" className="inline-flex items-center gap-1.5 text-[13px] text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <h1 className="mt-3 dash-h1 text-[30px] text-ink-900">
        Send to another Ridgeford Capital Bank user
      </h1>
      <p className="text-[13.5px] text-ink-500 mt-1">
        Instant and free — just enter the recipient's Ridgeford Capital Bank email.
      </p>

      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-500/10 text-brand-700 px-3 py-1.5 text-[12.5px] font-semibold">
        <Users className="h-3.5 w-3.5" /> Lands in their account the moment it's approved
      </div>

      <form onSubmit={submit} className="mt-6 card p-6 space-y-4">
        <label className="block">
          <span className="text-[12.5px] font-semibold text-ink-700">Amount (EUR)</span>
          <div className="relative mt-1.5">
            <input
              required
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full h-12 rounded-xl border border-ink-200 bg-panel pl-4 pr-12 text-[18px] font-semibold outline-none focus:border-gold-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 font-semibold">€</span>
          </div>
        </label>

        <label className="block">
          <span className="text-[12.5px] font-semibold text-ink-700">Recipient email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="anna@example.com"
            className="mt-1.5 w-full h-11 rounded-xl border border-ink-200 bg-panel px-4 text-[15px] outline-none focus:border-gold-500"
          />
        </label>

        <label className="block">
          <span className="text-[12.5px] font-semibold text-ink-700">Recipient name (optional)</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Anna Müller"
            className="mt-1.5 w-full h-11 rounded-xl border border-ink-200 bg-panel px-4 text-[15px] outline-none focus:border-gold-500"
          />
        </label>

        <label className="block">
          <span className="text-[12.5px] font-semibold text-ink-700">Reference</span>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Lunch yesterday 🍜"
            maxLength={140}
            className="mt-1.5 w-full h-11 rounded-xl border border-ink-200 bg-panel px-4 text-[15px] outline-none focus:border-gold-500"
          />
        </label>

        {err && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-[13.5px] p-3">
            {err}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => router.back()} className="btn btn-ghost flex-1">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary flex-1 disabled:opacity-70">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Send for review
          </button>
        </div>
      </form>

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
