import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getMarkets } from "@/lib/crypto";
import { ok, handleError } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/crypto/markets — full desk, priced in EUR. */
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const force = req.nextUrl.searchParams.get("refresh") === "1";
    const markets = await getMarkets(force);
    return ok({
      markets,
      as_of: new Date().toISOString(),
      stale: markets.some((m) => m.stale),
    });
  } catch (e) {
    return handleError(e);
  }
}
