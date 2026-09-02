import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/admin/crypto/withdrawals?status=pending_admin */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const status = req.nextUrl.searchParams.get("status");
    const sb = supabaseAdmin();

    let q = sb
      .from("crypto_withdrawals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(400);
    if (status && status !== "all") q = q.eq("status", status);

    const { data: rows, error } = await q;
    if (error) return fail(500, error.message);

    const ids = Array.from(new Set((rows || []).map((r: any) => r.user_id)));
    let users: Record<string, any> = {};
    if (ids.length) {
      const { data: us } = await sb
        .from("users")
        .select("id, email, first_name, last_name, kyc_risk, blocked")
        .in("id", ids);
      users = Object.fromEntries((us || []).map((u: any) => [u.id, u]));
    }

    return ok({
      withdrawals: (rows || []).map((r: any) => ({ ...r, user: users[r.user_id] || null })),
    });
  } catch (e) {
    return handleError(e);
  }
}
