"use client";

import { useEffect, useMemo, useState } from "react";
import { accountCurrency, type AccountCurrency } from "@/lib/account-currency";
import { DESTINATION_COUNTRIES, countryByCode } from "@/lib/international-countries";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRightLeft, Globe2, Loader2, RefreshCw } from "lucide-react";
import { TransferOtpModal } from "@/components/dashboard/TransferOtpModal";
import { useTransferOtp } from "@/lib/useTransferOtp";
import { fmtFxMoney } from "@/lib/fx-money";

type FxQuote = {
  id: string;
  country: string;
  source_currency: string;
  recipient_currency: string;
  source_amount: number;
  recipient_amount: number;
  fx_rate: number;
  fx_rate_date: string;
  expires_at: string;
  provider: string;
  disclaimer: string;
};

export default function InternationalPage() {
  const router = useRouter();
  const otp = useTransferOtp();
  const [amount, setAmount] = useState("");
  const [baseCurrency, setBaseCurrency] = useState<AccountCurrency>("EUR");
  const [currencyLoaded, setCurrencyLoaded] = useState(false);
  const [countryCode, setCountryCode] = useState("FR");
  const destination = useMemo(() => countryByCode(countryCode)!, [countryCode]);
  const [quote, setQuote] = useState<FxQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bic, setBic] = useState("");
  const [bankName, setBankName] = useState("");
  const [localBankCode, setLocalBankCode] = useState("");
  const [address, setAddress] = useState("");
  const [intermediary, setIntermediary] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d?.ok) setBaseCurrency(accountCurrency(d.user?.currency)); })
      .catch(() => {})
      .finally(() => setCurrencyLoaded(true));
  }, []);

  useEffect(() => {
    setQuote(null);
    setQuoteError(null);
    const parsed = Number(amount.replace(/,/g, "."));
    if (!currencyLoaded || !Number.isFinite(parsed) || parsed <= 0) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setQuoting(true);
      try {
        const result = await fetch("/api/fx/quote", {
          method: "POST", headers: { "content-type": "application/json" },
          credentials: "same-origin", signal: controller.signal,
          body: JSON.stringify({ country: countryCode, amount: parsed }),
        });
        const data = await result.json();
        if (!result.ok || !data.ok) throw new Error(data.error || "Could not load an exchange rate.");
        if (!controller.signal.aborted) setQuote(data.quote);
      } catch (e: any) {
        if (!controller.signal.aborted) setQuoteError(e?.message || "Could not load an exchange rate.");
      } finally {
        if (!controller.signal.aborted) setQuoting(false);
      }
    }, 500);
    return () => { clearTimeout(timer); controller.abort(); setQuoting(false); };
  }, [amount, countryCode, currencyLoaded, baseCurrency]);

  const hasValidQuote = Boolean(quote && quote.country === countryCode &&
    Number(quote.source_amount) === Math.round(Number(amount.replace(/,/g, ".")) * 100) / 100 &&
    quote.source_currency === baseCurrency && Date.parse(quote.expires_at) > Date.now());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const sendingAmount = Math.round(Number(amount.replace(/,/g, ".")) * 100) / 100;
    if (!currencyLoaded || !Number.isFinite(sendingAmount) || sendingAmount < 0.01) {
      setErr("Enter a valid sending amount to preview the transfer.");
      return;
    }

    setLoading(true);
    try {
      // Never begin the ten-minute email OTP using a quote that may have
      // started its expiry countdown while the customer filled the form.
      // This fresh quote has its own fifteen-minute window.
      const response = await fetch("/api/fx/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ country: countryCode, amount: sendingAmount }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok || !data.quote) {
        throw new Error(data.error || "Could not refresh the conversion estimate. Please try again.");
      }

      const freshQuote = data.quote as FxQuote;
      if (freshQuote.country !== countryCode ||
          freshQuote.source_currency !== baseCurrency ||
          Number(freshQuote.source_amount) !== sendingAmount) {
        throw new Error("The conversion estimate doesn't match your transfer details. Please review them.");
      }

      const previewedQuote = quote && quote.country === countryCode &&
        quote.source_currency === baseCurrency &&
        Number(quote.source_amount) === sendingAmount ? quote : null;
      const rateChanged = previewedQuote && (
        Math.abs(Number(previewedQuote.recipient_amount) - Number(freshQuote.recipient_amount)) > 0.0000001 ||
        Math.abs(Number(previewedQuote.fx_rate) - Number(freshQuote.fx_rate)) > 0.000000001
      );
      setQuote(freshQuote);
      setQuoteError(null);
      if (!previewedQuote || rateChanged) {
        setErr(rateChanged
          ? "The exchange-rate estimate has changed. Review the updated recipient amount, then press Review & verify with OTP again."
          : "Review the refreshed conversion estimate, then press Review & verify with OTP again.");
        return;
      }

      const started = await otp.begin({
        rail: "swift",
        amount: Number(freshQuote.source_amount), // Sender amount, NOT destination amount
        currency: freshQuote.recipient_currency,
        source_currency: baseCurrency,
        fx_quote_id: freshQuote.id,
        beneficiary_name: name.trim(),
        beneficiary_iban: accountNumber.replace(/\s+/g, "").toUpperCase(),
        beneficiary_bic: bic.replace(/\s+/g, "").toUpperCase(),
        beneficiary_country: countryCode,
        beneficiary_bank_name: bankName.trim(),
        beneficiary_local_bank_code: localBankCode.trim(),
        beneficiary_address: address.trim() || undefined,
        intermediary_bank: intermediary.trim() || undefined,
        reference: reference.trim() || undefined,
      });
      if (!started) setErr(otp.error || "Could not start authorisation");
    } catch (e: any) {
      setErr(e?.message || "Could not start authorisation");
    } finally { setLoading(false); }
  }

  return (
    <div className="pt-6 max-w-3xl mx-auto">
      <Link href="/dashboard/transfer" className="inline-flex items-center gap-1.5 text-[13px] text-ink-500 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> Back to transfers
      </Link>
      <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
        <Globe2 className="h-4 w-4" /> Cross-border banking
      </div>
      <h1 className="mt-2 dash-h1 text-[32px] text-ink-900">International transfers</h1>
      <p className="mt-2 text-[14px] text-ink-500 max-w-2xl">
        Choose where your money is going. We&apos;ll show the destination currency, recipient banking details and an exchange-rate estimate before you submit a request.
      </p>

      <form onSubmit={submit} className="mt-7 space-y-5">
        <section className="card p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div><div className="text-[11px] uppercase font-semibold tracking-[0.13em] text-ink-400">01 / Destination &amp; amount</div>
              <h2 className="mt-1 font-bold text-[19px] text-ink-900">Where are you sending?</h2></div>
            <div className="rounded-full bg-brand-500/10 text-brand-700 text-[12px] font-semibold px-3 py-1.5">SWIFT request</div>
          </div>
          <Field label="Destination country">
            <select required value={countryCode} onChange={(e) => { setCountryCode(e.target.value); setAccountNumber(""); setBic(""); setLocalBankCode(""); }} className="field-input">
              {DESTINATION_COUNTRIES.map((country) => <option value={country.code} key={country.code}>{country.flag} {country.label}</option>)}
            </select>
          </Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label={`You send (${baseCurrency})`}>
              <div className="relative"><input required min="0.01" step="0.01" type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000.00" className="field-input pr-16 font-bold text-[19px] tabular-nums" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-ink-500">{baseCurrency}</span></div>
            </Field>
            <Field label={`Estimated recipient amount (${destination.currency})`}>
              <div className="relative"><div className="field-input flex items-center pr-16 font-bold text-[19px] tabular-nums bg-ink-50/60" aria-live="polite">
                {quoting ? <Loader2 className="h-4 w-4 animate-spin text-ink-400" /> : hasValidQuote && quote ? fmtFxMoney(Number(quote.recipient_amount), destination.currency) : "—"}</div>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-ink-500">{destination.currency}</span></div>
            </Field>
          </div>
          <div className="rounded-2xl border border-ink-100 bg-ink-50/60 p-4">
            <div className="flex gap-2.5 items-start"><ArrowRightLeft className="h-4 w-4 shrink-0 mt-0.5 text-brand-700" /><div className="space-y-1.5 text-[12.5px] text-ink-600">
              {hasValidQuote && quote ? <>
                <p className="font-bold text-ink-900">1 {baseCurrency} ≈ {Number(quote.fx_rate).toLocaleString("en-US", { maximumFractionDigits: 6 })} {destination.currency}</p>
                <p>Reference rate dated {quote.fx_rate_date}. Estimate refreshed before OTP; valid for 15 minutes. Exchange and settlement are not guaranteed.</p>
              </> : <p>{quoteError || "Enter an amount to preview the conversion using a published reference exchange rate."}</p>}
              <p className="text-ink-500">Receiving-bank and correspondent fees, if any, are not included. Actual settlement requires an integrated banking provider.</p>
            </div></div>
          </div>
        </section>

        <section className="card p-5 sm:p-6 space-y-4">
          <div className="text-[11px] uppercase font-semibold tracking-[0.13em] text-ink-400">02 / Beneficiary</div>
          <div className="flex items-center justify-between gap-3"><h2 className="font-bold text-[19px] text-ink-900">Bank details for {destination.label}</h2><span className="text-[13px] text-ink-500">{destination.flag} {destination.currency}</span></div>
          <p className="rounded-xl bg-ink-50 text-[12.5px] text-ink-600 p-3">{destination.hint} Always confirm the exact wire instructions with the recipient.</p>
          <Field label="Beneficiary full legal name"><input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Name as held by the receiving bank" className="field-input" /></Field>
          <Field label={destination.accountLabel}><input required maxLength={70} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder={destination.accountPlaceholder} className="field-input tabular-nums" /></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Receiving bank SWIFT / BIC"><input required maxLength={11} value={bic} onChange={(e) => setBic(e.target.value.toUpperCase())} placeholder="Bank-issued BIC" className="field-input uppercase tabular-nums" /></Field>
            <Field label="Receiving bank name"><input required maxLength={120} value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank name" className="field-input" /></Field>
          </div>
          {destination.bankCodeLabel && <Field label={`${destination.bankCodeLabel}${destination.bankCodeRequired ? " (required)" : " (if supplied)"}`}><input required={destination.bankCodeRequired} maxLength={60} value={localBankCode} onChange={(e) => setLocalBankCode(e.target.value)} placeholder={destination.bankCodePlaceholder} className="field-input tabular-nums" /></Field>}
          <Field label="Recipient address (optional)"><input maxLength={200} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Recipient street, city and postcode" className="field-input" /></Field>
          <Field label="Intermediary bank (if provided)"><input maxLength={200} value={intermediary} onChange={(e) => setIntermediary(e.target.value)} placeholder="Correspondent bank information" className="field-input" /></Field>
          <Field label="Payment reference (optional)"><input maxLength={140} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Invoice or payment purpose" className="field-input" /></Field>
        </section>
        {err && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-[13px] text-red-700">{err}</p>}
        <div className="flex gap-3"><button type="button" onClick={() => router.back()} className="btn btn-ghost flex-1">Cancel</button>
          <button type="submit" disabled={loading || quoting || !currencyLoaded || !Number.isFinite(Number(amount)) || Number(amount) <= 0} className="btn btn-brand flex-1 disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Review &amp; verify with OTP
          </button></div>
        <p className="text-[11.5px] text-ink-400 text-center">Your request enters compliance review. Approval is not proof of funds settlement.</p>
      </form>
      <style jsx>{`.field-input {width:100%;min-height:48px;border-radius:12px;border:1px solid #d9dee5;background:#fff;padding:0 1rem;font-size:15px;outline:none;color:#17212f;} .field-input:focus{border-color:#2f66ff;box-shadow:0 0 0 1px #2f66ff;} .field-input:disabled{opacity:.65;}`}</style>
      <TransferOtpModal {...otp.modalProps} onSubmit={(code) => otp.confirm(code, (d) => router.push(`/dashboard/transfer/success?ref=${d.transfer.reference_id}`))} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-[12.5px] font-semibold text-ink-700">{label}</span><div className="mt-1.5">{children}</div></label>;
}
