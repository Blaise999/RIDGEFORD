import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/admin/kyc?status=submitted — the compliance queue. */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const status = req.nextUrl.searchParams.get("status");
    const sb = supabaseAdmin();

    let q = sb
      .from("kyc_applications")
      .select("*")
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .limit(400);
    if (status && status !== "all") q = q.eq("status", status);

    const { data: apps, error } = await q;
    if (error) return fail(500, error.message);

    const ids = Array.from(new Set((apps || []).map((a: any) => a.user_id)));
    let users: Record<string, any> = {};
    let docs: Record<string, any[]> = {};
    if (ids.length) {
      const [{ data: us }, { data: ds }] = await Promise.all([
        sb.from("users").select("id, email, first_name, last_name, created_at, onboarding_status, blocked").in("id", ids),
        sb.from("kyc_documents").select("id, user_id, kind, status").in("user_id", ids),
      ]);
      users = Object.fromEntries((us || []).map((u: any) => [u.id, u]));
      for (const d of ds || []) (docs[d.user_id] ||= []).push(d);
    }

    return ok({
      applications: (apps || []).map((a: any) => ({
        ...a,
        user: users[a.user_id] || null,
        documents: docs[a.user_id] || [],
      })),
    });
  } catch (e) {
    return handleError(e);
  }
}
