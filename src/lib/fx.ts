/**
 * Fetches a live FX rate from EUR → target currency.
 * Uses exchangerate.host (free, no API key).
 * Falls back to 1.0 if the call fails.
 * The returned rate means: 1 EUR = `rate` units of `to`.
 */
export async function fxRateEurTo(to: string): Promise<number> {
  const code = String(to || "EUR").toUpperCase();
  if (code === "EUR") return 1;
  try {
    const r = await fetch(
      `https://api.exchangerate.host/latest?base=EUR&symbols=${code}`,
      { cache: "no-store" }
    );
    if (!r.ok) return 1;
    const d = await r.json();
    const rate = Number(d?.rates?.[code]);
    return Number.isFinite(rate) && rate > 0 ? rate : 1;
  } catch {
    return 1;
  }
}

/**
 * Converts an amount from `from` currency to EUR.
 * Useful for debiting the user's EUR account when they pay in another currency.
 */
export async function convertToEur(amount: number, from: string): Promise<number> {
  const code = String(from || "EUR").toUpperCase();
  if (code === "EUR") return amount;
  const rate = await fxRateEurTo(code); // 1 EUR = `rate` in `from`
  if (rate <= 0) return amount;
  return amount / rate;
}
