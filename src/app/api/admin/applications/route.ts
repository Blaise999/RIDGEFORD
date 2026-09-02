import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "PENDING_REVIEW";
    const sb = supabaseAdmin();
    let q = sb
      .from("users")
      .select(
        "id,email,first_name,middle_name,last_name,date_of_birth,place_of_birth,nationality,phone,street,street_number,postal_code,city,country,employment_status,employer,occupation,monthly_income,source_of_funds,tax_id,id_document_type,id_document_number,onboarding_status,rejection_reason,reviewed_at,created_at"
      )
      .neq("role", "admin")
      .order("created_at", { ascending: false })
      .limit(500);
    if (status !== "ALL") q = q.eq("onboarding_status", status);
    const { data, error } = await q;
    if (error) return fail(500, error.message);
    return ok({ applications: data || [] });
  } catch (e) {
    return handleError(e);
  }
}
