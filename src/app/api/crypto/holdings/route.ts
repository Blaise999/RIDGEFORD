import { NextRequest } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/crypto/holdings — pin / unpin an asset on the dashboard crypto bar.
 * body: { asset_id, pinned }
 */
export async function PATCH(req: NextRequest) {
  try {
    const u = await requireActiveUser();
    const { asset_id, pinned } = (await req.json()) || {};
    if (!asset_id) return fail(400, "Missing asset");

    const sb = supabaseAdmin();
    const { error } = await sb
      .from("crypto_holdings")
      .update({ pinned: Boolean(pinned) })
      .eq("user_id", u.id)
      .eq("asset_id", String(asset_id));
    if (error) return fail(500, error.message);
    return ok({ asset_id, pinned: Boolean(pinned) });
  } catch (e) {
    return handleError(e);
  }
}
