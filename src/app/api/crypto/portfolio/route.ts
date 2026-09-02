import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getMarkets, logoFor } from "@/lib/crypto";
import { ok, handleError } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * GET /api/crypto/portfolio
 * Holdings marked to market, plus the P/L the dashboard crypto bar shows.
 */
export async function GET() {
  try {
    const u = await requireUser();
    const sb = supabaseAdmin();

    const [{ data: holdings }, markets, { data: pending }] = await Promise.all([
      sb.from("crypto_holdings").select("*").eq("user_id", u.id).gt("quantity", 0),
      getMarkets(),
      sb
        .from("crypto_withdrawals")
        .select("id, reference_id, asset_id, quantity, status, address, network, created_at, eur_value")
        .eq("user_id", u.id)
        .in("status", ["pending_admin", "approved"])
        .order("created_at", { ascending: false }),
    ]);

    const priceOf = new Map(markets.map((m) => [m.id, m]));

    const positions = (holdings || []).map((h: any) => {
      const m = priceOf.get(h.asset_id);
      const qty = Number(h.quantity) || 0;
      const price = m?.price_eur || 0;
      const value = qty * price;
      const invested = Number(h.invested_eur) || 0;
      return {
        asset_id: h.asset_id,
        symbol: m?.symbol || h.asset_id.toUpperCase(),
        name: m?.name || h.asset_id,
        color: m?.color || "#8a9bab",
        // The bar renders held positions, not markets, so the logo has to
        // travel on the position — without this it always fell back to
        // initials no matter how well the market feed was working.
        image: logoFor(m?.symbol || h.asset_id, m?.image),
        network: m?.network || "",
        quantity: qty,
        price_eur: price,
        change_24h: m?.change_24h || 0,
        sparkline: m?.sparkline || [],
        value_eur: value,
        invested_eur: invested,
        pnl_eur: value - invested,
        pnl_pct: invested > 0 ? ((value - invested) / invested) * 100 : 0,
        pinned: h.pinned !== false,
      };
    });

    positions.sort((a, b) => b.value_eur - a.value_eur);

    const total = positions.reduce((s, p) => s + p.value_eur, 0);
    const invested = positions.reduce((s, p) => s + p.invested_eur, 0);
    // Yesterday's value, backed out of each position's 24h move.
    const yesterday = positions.reduce(
      (s, p) => s + p.value_eur / (1 + (p.change_24h || 0) / 100),
      0
    );

    return ok({
      positions,
      totals: {
        value_eur: total,
        invested_eur: invested,
        pnl_eur: total - invested,
        pnl_pct: invested > 0 ? ((total - invested) / invested) * 100 : 0,
        change_24h_eur: total - yesterday,
        change_24h_pct: yesterday > 0 ? ((total - yesterday) / yesterday) * 100 : 0,
      },
      pending_withdrawals: pending || [],
    });
  } catch (e) {
    return handleError(e);
  }
}
