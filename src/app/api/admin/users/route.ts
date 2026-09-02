import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";
import { isRoot } from "@/lib/desks";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const sb = supabaseAdmin();

    let query = sb
      .from("users")
      .select(
        "id,email,first_name,last_name,role,blocked,blocked_reason,iban," +
          "balance_checking,balance_savings,created_at,admin_owner_id,referral_code,onboarding_status,kyc_risk"
      )
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(500);

    // A desk admin sees only the customers who arrived through their code.
    // The root admin sees the whole bank.
    if (!isRoot(admin.role)) {
      query = query.eq("admin_owner_id", admin.id);
    }

    if (q) {
      query = query.or(`email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) return fail(500, error.message);
    return ok({
      users: data || [],
      scope: isRoot(admin.role) ? "bank" : "desk",
      admin: { id: admin.id, role: admin.role },
    });
  } catch (e) {
    return handleError(e);
  }
}
