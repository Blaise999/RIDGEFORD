import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, handleError } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/crypto/withdrawals — this user's send-outs, newest first. */
export async function GET() {
  try {
    const u = await requireUser();
    const sb = supabaseAdmin();
    const { data } = await sb
      .from("crypto_withdrawals")
      .select("*")
      .eq("user_id", u.id)
      .order("created_at", { ascending: false })
      .limit(100);
    return ok({ withdrawals: data || [] });
  } catch (e) {
    return handleError(e);
  }
}
