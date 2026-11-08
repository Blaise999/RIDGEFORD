import { NextRequest } from "next/server";
import { requireUser, requireActiveUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";
import { genReference, fmtMoney } from "@/lib/utils";
import { verifyIban, comparePayeeName, normalizeIban } from "@/lib/iban";
import { accountCurrency, validSwift, validAba } from "@/lib/account-currency";
import { countryByCode, isValidIbanForCountry } from "@/lib/international-countries";
import { fmtFxMoney } from "@/lib/fx-money";
import { sendTransferSubmitted, deferEmail } from "@/lib/email";
import { verifyOtp } from "@/lib/otp";
import { notify } from "@/lib/notify";

const ALLOWED_RAILS = ["sepa", "sepa_instant", "internal", "swift"] as const;

export async function GET() {
  try {
    const u = await requireUser();
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("transfers")
      .select("*")
      .eq("user_id", u.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return fail(500, error.message);
    return ok({ transfers: data || [] });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const u = await requireActiveUser();

    const body = await req.json();
    const {
      rail,
      amount,
      currency,
      account_type,
      beneficiary_name,
      beneficiary_iban,
      beneficiary_bic,
      beneficiary_email,
      beneficiary_country,
      beneficiary_address,
      intermediary_bank,
      reference,
      memo,
      otp,
      instant,
      vop_acknowledged,
      fx_quote_id,
      beneficiary_bank_name,
      beneficiary_local_bank_code,
    } = body || {};

    // Filled in by the SEPA branch below; the euro area is the default case
    // for this bank, so these live at function scope rather than in it.
    let sepaCountry: string | null = null;
    let sepaInstant = false;
    let normalizedIban: string | null = null;
    let vop: string | null = null;

    // ── Bank-style authorisation gate ──────────────────────────────────────
    // The transfer is only created if the user supplies a valid, unused
    // 6-digit code that we emailed them via POST /api/transfers/otp.
    const code = String(otp || "").replace(/\D/g, "");
    if (code.length !== 6) {
      return fail(401, "Enter the 6-digit code we emailed you to authorise this transfer.");
    }

    const sbAuth = supabaseAdmin();
    const { data: authUser } = await sbAuth
      .from("users")
      .select("email")
      .eq("id", u.id)
      .single();
    if (!authUser) return fail(500, "Account not found");

    const otpOk = await verifyOtp(authUser.email, code, "transfer");
    if (!otpOk) {
      return fail(401, "That authorisation code is invalid or has expired. Request a new one.");
    }
    // ───────────────────────────────────────────────────────────────────────

    const accType = account_type === "savings" ? "savings" : "checking";
    if (!ALLOWED_RAILS.includes(rail)) return fail(400, "Invalid rail");
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return fail(400, "Invalid amount");
    if (!beneficiary_name) return fail(400, "Beneficiary name required");

    const sb = supabaseAdmin();
    const { data: sender } = await sb
      .from("users")
      .select("id, email, first_name, currency, balance_checking, balance_savings, blocked")
      .eq("id", u.id)
      .single();
    if (!sender) return fail(500, "Account not found");
    if (sender.blocked) return fail(403, "Account suspended");

    const baseCurrency = accountCurrency(sender.currency);
    if (baseCurrency === "USD" && rail !== "internal" && rail !== "swift") return fail(400, "SEPA is available only on EUR accounts");
    const balance = accType === "savings" ? Number(sender.balance_savings) : Number(sender.balance_checking);

    // A new international request always uses a server-issued quote. The
    // browser cannot select a rate or invent the receiving amount.
    const hasNewFxQuote = rail === "swift" && typeof fx_quote_id === "string" && fx_quote_id.length > 0;
    let fxQuote: any = null;
    if (hasNewFxQuote) {
      const { data: stored, error: quoteErr } = await sb.from("fx_transfer_quotes")
        .select("*")
        .eq("id", fx_quote_id)
        .eq("user_id", u.id)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      if (quoteErr || !stored) return fail(409, "Conversion preview expired. Return to International Transfers for a new quote.");
      const dest = countryByCode(String(beneficiary_country || ""));
      if (!dest || stored.destination_country !== dest.code || stored.recipient_currency !== dest.currency ||
          stored.source_currency !== baseCurrency ||
          Math.abs(Number(stored.source_amount) - amt) > 0.001 ||
          String(currency || "").toUpperCase() !== dest.currency) {
        return fail(400, "Transfer details no longer match your conversion preview.");
      }
      fxQuote = stored;
    }

    // Legacy USD transfers must remain USD unless they use the dedicated FX quote flow.
    if (!hasNewFxQuote && baseCurrency === "USD" && String(currency || "USD").toUpperCase() !== "USD")
      return fail(400, "A currency conversion preview is required for a dollar-to-foreign-currency transfer.");
    let debitAmount = amt;
    if (!hasNewFxQuote && baseCurrency === "EUR" && rail === "swift" && currency && String(currency).toUpperCase() !== "EUR") {
      // Older transfer screens may still send recipient-currency amounts. Reject
      // new unquoted cross-currency requests rather than converting with a
      // silently fabricated 1:1 fallback.
      return fail(400, "Please request a conversion preview on the International Transfers page.");
    }
    if (balance < debitAmount) return fail(400, `Insufficient ${accType} balance`);

    let beneficiary_user_id: string | null = null;
    if (rail === "internal") {
      if (!beneficiary_email) return fail(400, "Recipient email required");
      const { data: rec } = await sb
        .from("users")
        .select("id, blocked, currency")
        .ilike("email", beneficiary_email)
        .maybeSingle();
      if (!rec) return fail(404, "No Ridgeford Capital Bank user found with that email");
      if (rec.id === u.id) return fail(400, "You can't send money to yourself");
      if (rec.blocked) return fail(400, "Recipient account is not active");
      if (accountCurrency(rec.currency) !== baseCurrency) return fail(400, "Internal transfers between USD and EUR accounts require an FX facility. Choose a recipient with the same account currency.");
      beneficiary_user_id = rec.id;
    } else if (rail === "swift") {
      if (!beneficiary_iban) return fail(400, "Beneficiary account number or IBAN required");
      if (!beneficiary_bic || !validSwift(String(beneficiary_bic).toUpperCase())) return fail(400, "A valid beneficiary SWIFT / BIC code is required");
      if (!beneficiary_country) return fail(400, "Beneficiary country required");
      if (hasNewFxQuote) {
        const dest = countryByCode(String(beneficiary_country));
        if (!dest) return fail(400, "Unsupported destination country");
        if (!beneficiary_bank_name || String(beneficiary_bank_name).trim().length < 2)
          return fail(400, "Enter the receiving bank name");
        if (dest.iban && !isValidIbanForCountry(String(beneficiary_iban), dest.code))
          return fail(400, `Enter a valid ${dest.label} IBAN`);
        if (dest.bankCodeRequired && !String(beneficiary_local_bank_code || "").trim())
          return fail(400, `${dest.bankCodeLabel} is required`);
        if (dest.code === "US" && !validAba(String(beneficiary_local_bank_code || "").replace(/\s/g, "")))
          return fail(400, "Enter a valid nine-digit U.S. wire routing number supplied by the recipient's bank");
      }
    } else {
      // ── SEPA, anywhere in the euro area ────────────────────────────────
      // Real mod-97 validation against the SEPA IBAN registry. A German bank
      // that only accepts German IBANs isn't a euro bank, so the country is
      // derived from the IBAN rather than assumed.
      const verdict = verifyIban(String(beneficiary_iban || ""));
      if (!verdict.ok) return fail(400, verdict.reason);

      sepaCountry = verdict.country.code;
      sepaInstant = verdict.instant && instant !== false;
      normalizedIban = normalizeIban(String(beneficiary_iban));

      // Verification of Payee — Art. 5c IPR. Free, on every euro transfer, and
      // it warns rather than blocks: a "no match" that the payer has explicitly
      // acknowledged still goes through, because that is what the law says.
      if (beneficiary_name) {
        const { data: onFile } = await sb
          .from("users")
          .select("first_name, last_name")
          .eq("iban", normalizedIban)
          .maybeSingle();

        vop = onFile
          ? comparePayeeName(
              String(beneficiary_name),
              `${onFile.first_name || ""} ${onFile.last_name || ""}`
            )
          : "not_supported";

        if ((vop === "no_match" || vop === "close_match") && !vop_acknowledged) {
          return fail(409, "Check the beneficiary name before this payment is sent.", {
            vop,
            requires_acknowledgement: true,
          });
        }
      }
    }

    const reference_id = genReference("TR");
    // Art. 5b IPR: an instant euro transfer may never cost more than a standard
    // one, so both are zero. Only SWIFT carries a fee.
    // The FX preview is indicative and does not price intermediary/wire charges.
    // Do not debit an undisclosed fee on this new request path.
    const fee = hasNewFxQuote ? 0 : rail === "swift" ? 14 : 0;

    const { data: transfer, error: tErr } = await sb
      .from("transfers")
      .insert({
        reference_id,
        user_id: u.id,
        // An instant-eligible euro IBAN books on the instant rail. Same price
        // either way — that is the whole point of Art. 5b.
        rail: rail === "sepa" && sepaInstant ? "sepa_instant" : rail,
        direction: "debit",
        account_type: accType,
        amount: fxQuote ? Number(fxQuote.recipient_amount) : amt,
        currency: fxQuote ? fxQuote.recipient_currency : baseCurrency === "USD" ? "USD" : currency || "EUR",
        ...(fxQuote ? {
          fx_quote_id: fxQuote.id,
          source_amount: Number(fxQuote.source_amount),
          source_currency: fxQuote.source_currency,
          recipient_amount: Number(fxQuote.recipient_amount),
          recipient_currency: fxQuote.recipient_currency,
          fx_rate: Number(fxQuote.fx_rate),
          fx_rate_date: fxQuote.fx_rate_date,
          fx_rate_provider: fxQuote.provider,
          beneficiary_bank_name: String(beneficiary_bank_name || "").slice(0, 120),
          beneficiary_local_bank_code: String(beneficiary_local_bank_code || "").slice(0, 60) || null,
        } : {}),
        fee,
        beneficiary_name,
        beneficiary_iban: normalizedIban || beneficiary_iban || null,
        beneficiary_bic: beneficiary_bic || null,
        beneficiary_email: beneficiary_email || null,
        beneficiary_user_id,
        beneficiary_country: beneficiary_country || sepaCountry || null,
        beneficiary_address: beneficiary_address || null,
        intermediary_bank: intermediary_bank || null,
        reference: reference || null,
        memo: memo || null,
        status: "pending_admin",
      })
      .select("*")
      .single();

    if (tErr || !transfer) return fail(500, tErr?.message || "Could not submit transfer");

    // Post a ledger row immediately so the transaction shows up in the user's
    // activity as "pending". The balance is NOT moved yet — that happens on
    // admin approval.
    await sb.from("transactions").insert({
      user_id: u.id,
      transfer_id: transfer.id,
      account_type: accType,
      direction: "debit",
      amount: debitAmount, // Always the amount denominated in the sender's account currency.
      currency: baseCurrency,
      rail,
      category: "Transfer",
      counterparty_name: beneficiary_name,
      counterparty_iban: normalizedIban || beneficiary_iban || null,
      counterparty_email: beneficiary_email || null,
      description: fxQuote
        ? `International FX · ${Number(fxQuote.source_amount).toFixed(2)} ${baseCurrency} → ${Number(fxQuote.recipient_amount).toFixed(2)} ${fxQuote.recipient_currency} · 1 ${baseCurrency} = ${Number(fxQuote.fx_rate).toFixed(6)} ${fxQuote.recipient_currency} · ${reference || memo || "Pending review"}`
        : reference || memo || "Transfer out",
      merchant: beneficiary_name,
      reference: reference_id,
      status: "pending",
    });

    deferEmail(() =>
      sendTransferSubmitted(sender.email, {
        firstName: sender.first_name || "there",
        reference: transfer.reference_id,
        amount: fxQuote ? Number(fxQuote.source_amount) : amt,
        currency: fxQuote ? baseCurrency : transfer.currency,
        beneficiaryName: beneficiary_name,
        rail,
      })
    );

    await notify(
      u.id,
      "transfer_submitted",
      `Transfer ${transfer.reference_id} submitted`,
      fxQuote
        ? `${fmtFxMoney(Number(fxQuote.source_amount), baseCurrency)} → approximately ${fmtFxMoney(Number(fxQuote.recipient_amount), fxQuote.recipient_currency)} to ${beneficiary_name}. FX transfer request pending admin approval.`
        : `${fmtMoney(amt, transfer.currency)} to ${beneficiary_name} — under review.`,
      { transfer_id: transfer.id, reference: transfer.reference_id, amount: amt, rail, account_type: accType,
        ...(fxQuote ? { source_currency: baseCurrency, recipient_currency: fxQuote.recipient_currency,
          recipient_amount: fxQuote.recipient_amount, fx_rate: fxQuote.fx_rate, settlement: "not_settled" } : {}) }
    );

    return ok({ transfer });
  } catch (e) {
    return handleError(e);
  }
}
