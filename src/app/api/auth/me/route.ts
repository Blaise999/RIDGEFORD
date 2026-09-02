import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) return fail(401, "Not authenticated");
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("users")
      .select("id,email,role,first_name,last_name,phone,iban,account_number,bic,card_last4,balance_checking,balance_savings,blocked,blocked_reason,avatar_url,currency,country,created_at")
      .eq("id", session.id)
      .single();
    if (error || !data) return fail(404, "User not found");
    return ok({ user: data });
  } catch (e) {
    return handleError(e);
  }
}
