import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";
import { isRoot } from "@/lib/desks";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/desks
 *
 * Root sees every desk and its book. A desk admin sees only their own row —
 * enough to know their code and how many customers came through it, and
 * nothing about anyone else's book.
 */
export async function GET() {
  try {
    const admin = await requireAdmin();
    const sb = supabaseAdmin();

    let adminQuery = sb
      .from("users")
      .select("id, username, first_name, last_name, email, role, admin_label, created_at")
      .in("role", ["admin", "root_admin"]);
    if (!isRoot(admin.role)) adminQuery = adminQuery.eq("id", admin.id);

    const { data: admins, error } = await adminQuery;
    if (error) return fail(500, error.message);

    const ids = (admins || []).map((a: any) => a.id);
    const [{ data: codes }, { data: members }] = await Promise.all([
      sb.from("referral_codes").select("*").in("admin_id", ids),
      sb.from("users").select("id, admin_owner_id, balance_checking, balance_savings, onboarding_status")
        .eq("role", "user")
        .in("admin_owner_id", ids),
    ]);

    const desks = (admins || []).map((a: any) => {
      const book = (members || []).filter((m: any) => m.admin_owner_id === a.id);
      return {
        ...a,
        is_root: a.role === "root_admin",
        codes: (codes || []).filter((c: any) => c.admin_id === a.id),
        customers: book.length,
        approved: book.filter((m: any) => m.onboarding_status === "APPROVED").length,
        pending: book.filter((m: any) => m.onboarding_status !== "APPROVED").length,
        deposits: book.reduce(
          (s: number, m: any) => s + (Number(m.balance_checking) || 0) + (Number(m.balance_savings) || 0),
          0
        ),
      };
    });

    return ok({ desks, scope: isRoot(admin.role) ? "bank" : "desk" });
  } catch (e) {
    return handleError(e);
  }
}

/**
 * POST /api/admin/desks — mint a referral code.
 * Root can mint for any desk; a desk admin only for themselves.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { code, admin_id, label, max_uses } = (await req.json()) || {};

    const raw = String(code || "").trim();
    if (!/^[A-Za-z0-9_-]{4,32}$/.test(raw)) {
      return fail(400, "Codes are 4–32 characters: letters, digits, hyphen or underscore.");
    }

    const owner = isRoot(admin.role) ? String(admin_id || admin.id) : admin.id;
    const sb = supabaseAdmin();

    const { data: clash } = await sb
      .from("referral_codes")
      .select("id")
      .ilike("code", raw)
      .maybeSingle();
    if (clash) return fail(409, "That code is already in use.");

    const { data, error } = await sb
      .from("referral_codes")
      .insert({
        code: raw,
        admin_id: owner,
        label: label || null,
        max_uses: Number.isFinite(Number(max_uses)) && Number(max_uses) > 0 ? Number(max_uses) : null,
        created_by: admin.id,
      })
      .select("*")
      .single();
    if (error) return fail(500, error.message);

    await sb.from("admin_actions").insert({
      admin_id: admin.id,
      action: "referral_code_create",
      target_type: "referral_code",
      target_id: data.id,
      notes: raw,
    });

    return ok({ code: data });
  } catch (e) {
    return handleError(e);
  }
}
