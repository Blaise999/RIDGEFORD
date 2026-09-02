import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { getChart, getMarket } from "@/lib/crypto";
import { ok, fail, handleError } from "@/lib/http";

export const dynamic = "force-dynamic";

const RANGES: Record<string, number> = { "1": 1, "7": 7, "30": 30, "90": 90, "365": 365 };

/** GET /api/crypto/chart?id=bitcoin&days=7 */
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const id = req.nextUrl.searchParams.get("id") || "";
    const daysParam = req.nextUrl.searchParams.get("days") || "7";
    if (!id) return fail(400, "Missing asset id");
    const days = RANGES[daysParam] ?? 7;

    const [series, market] = await Promise.all([getChart(id, days), getMarket(id)]);
    return ok({ id, days, series, market });
  } catch (e) {
    return handleError(e);
  }
}
