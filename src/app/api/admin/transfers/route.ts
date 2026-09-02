import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const status = url.searchParams.get("status"); // 'pending_admin' | 'approved' | ...
    const sb = supabaseAdmin();

    // pull transfers + sender info in two passes (keeping it simple & RLS-safe)
    let q = sb
      .from("transfers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (status) q = q.eq("status", status);

    const { data: transfers, error } = await q;
    if (error) return fail(500, error.message);

    const userIds = Array.from(new Set((transfers || []).map((t) => t.user_id)));
    let users: Record<string, any> = {};
    if (userIds.length) {
      const { data: us } = await sb
        .from("users")
        .select("id,email,first_name,last_name")
        .in("id", userIds);
      users = Object.fromEntries((us || []).map((u) => [u.id, u]));
    }

    const enriched = (transfers || []).map((t) => ({
      ...t,
      sender: users[t.user_id] || null,
    }));

    return ok({ transfers: enriched });
  } catch (e) {
    return handleError(e);
  }
}
