import { NextRequest } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";
import { countryByCode } from "@/lib/international-countries";
import { accountCurrency } from "@/lib/account-currency";
import { fxMinorDigits } from "@/lib/fx-money";

export const dynamic = "force-dynamic";

/** Indicative FX reference, not an executable or guaranteed bank exchange rate. */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireActiveUser();
    const payload = await req.json().catch(() => ({}));
    const country = countryByCode(String(payload.country || ""));
    if (!country) return fail(400, "Choose a supported destination country.");

    const amount = Math.round(Number(payload.amount) * 100) / 100;
    if (!Number.isFinite(amount) || amount < 0.01 || amount > 10_000_000)
      return fail(400, "Enter a valid sending amount.");

    const sb = supabaseAdmin();
    const { data: user } = await sb.from("users")
      .select("currency,blocked")
      .eq("id", auth.id).single();
    if (!user || user.blocked) return fail(403, "Account unavailable.");

    const source = accountCurrency(user.currency);
    const target = country.currency;
    let rate = 1;
    let rateDate = new Date().toISOString().slice(0, 10);
    let provider = "SAME_CURRENCY";

    if (source !== target) {
      const url = `https://api.frankfurter.dev/v2/rate/${source.toLowerCase()}/${target.toLowerCase()}`;
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (!res.ok) return fail(503, "Exchange rates are temporarily unavailable. Please try again.");
      const rateData = await res.json();
      rate = Number(rateData?.rate);
      rateDate = String(rateData?.date || "");
      provider = "FRANKFURTER_REFERENCE";
      if (!Number.isFinite(rate) || rate <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(rateDate))
        return fail(503, "No reliable exchange rate is currently available.");
      const ageMs = Date.now() - new Date(`${rateDate}T00:00:00Z`).getTime();
      if (ageMs > 7 * 86400_000 || ageMs < -86400_000)
        return fail(503, "The available exchange rate is too old. Try again later.");
    }

    const factor = 10 ** fxMinorDigits(target);
    const recipientAmount = Math.round(amount * rate * factor) / factor;
    if (!Number.isFinite(recipientAmount) || recipientAmount <= 0)
      return fail(400, "Amount is too small for this currency pair.");

    const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
    const { data: quote, error } = await sb.from("fx_transfer_quotes")
      .insert({
        user_id: auth.id,
        destination_country: country.code,
        source_currency: source,
        recipient_currency: target,
        source_amount: amount,
        recipient_amount: recipientAmount,
        fx_rate: rate,
        fx_rate_date: rateDate,
        provider,
        expires_at: expiresAt,
      })
      .select("id,source_currency,recipient_currency,source_amount,recipient_amount,fx_rate,fx_rate_date,expires_at,provider")
      .single();
    if (error || !quote) return fail(500, error?.message || "Could not prepare the conversion preview.");

    return ok({
      quote: {
        ...quote,
        country: country.code,
        isIndicative: true,
        fee: null,
        disclaimer: "Reference-rate estimate only. FX and settlement require a banking provider; correspondent charges may apply.",
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
