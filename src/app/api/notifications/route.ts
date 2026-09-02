import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";

export async function GET(req: NextRequest) {
  try {
    const u = await requireUser();
    const url = new URL(req.url);
    const unreadOnly = url.searchParams.get("unread") === "1";
    const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);

    const sb = supabaseAdmin();
    let q = sb
      .from("notifications")
      .select("*")
      .eq("user_id", u.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (unreadOnly) q = q.eq("read", false);

    const { data, error } = await q;
    if (error) return fail(500, error.message);

    const { count } = await sb
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", u.id)
      .eq("read", false);

    return ok({ notifications: data || [], unread: count || 0 });
  } catch (e) {
    return handleError(e);
  }
}

/** POST /api/notifications — body: { ids?: string[], all?: true } → mark as read */
export async function POST(req: NextRequest) {
  try {
    const u = await requireUser();
    const body = await req.json().catch(() => ({}));
    const sb = supabaseAdmin();
    let q = sb.from("notifications").update({ read: true }).eq("user_id", u.id);
    if (!body?.all && Array.isArray(body?.ids) && body.ids.length) {
      q = q.in("id", body.ids);
    }
    const { error } = await q;
    if (error) return fail(500, error.message);
    return ok();
  } catch (e) {
    return handleError(e);
  }
}
