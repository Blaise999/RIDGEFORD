import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const dir = url.searchParams.get("direction");
    const sb = supabaseAdmin();

    let q = sb
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (dir === "sent") q = q.eq("direction", "debit");
    if (dir === "received") q = q.eq("direction", "credit");

    const { data: txns, error } = await q;
    if (error) return fail(500, error.message);

    const userIds = Array.from(new Set((txns || []).map((t) => t.user_id)));
    let users: Record<string, any> = {};
    if (userIds.length) {
      const { data: us } = await sb
        .from("users")
        .select("id,email,first_name,last_name")
        .in("id", userIds);
      users = Object.fromEntries((us || []).map((u) => [u.id, u]));
    }
    const enriched = (txns || []).map((t) => ({
      ...t,
      user: users[t.user_id] || null,
    }));

    return ok({ transactions: enriched });
  } catch (e) {
    return handleError(e);
  }
}
