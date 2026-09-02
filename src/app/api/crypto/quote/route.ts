import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getMarket, buildQuote, DESK } from "@/lib/crypto";
import { ok, fail, handleError } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * POST /api/crypto/quote
 * body: { asset_id, side: "buy" | "sell", eur?, quantity? }
 *
 * Quotes are indicative for 45 seconds; the order route re-prices at
 * execution time and refuses to fill outside a 1,5 % tolerance.
 */
export async function POST(req: NextRequest) {
  try {
    await requireUser();
    const { asset_id, side = "buy", eur, quantity } = (await req.json()) || {};
    if (!asset_id) return fail(400, "Missing asset");

    const market = await getMarket(String(asset_id));
    if (!market) return fail(404, "We don't trade that asset");

    if (side === "buy") {
      const amount = Number(eur);
      if (!Number.isFinite(amount) || amount <= 0) return fail(400, "Enter an amount in euros");
      if (amount < DESK.MIN_ORDER_EUR) return fail(400, `Minimum order is ${DESK.MIN_ORDER_EUR} €`);
      if (amount > DESK.MAX_ORDER_EUR) return fail(400, `Maximum order is ${DESK.MAX_ORDER_EUR.toLocaleString("en-GB")} €`);
    } else if (!Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
      return fail(400, "Enter a quantity");
    }

    const quote = buildQuote(market, side === "sell" ? "sell" : "buy", {
      eur: Number(eur),
      quantity: Number(quantity),
    });
    return ok({ quote, desk: DESK });
  } catch (e) {
    return handleError(e);
  }
}
