import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { signSession, setSessionCookie } from "@/lib/auth";
import { verifyOtp } from "@/lib/otp";
import { ok, fail, handleError } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) return fail(400, "Email and code required");

    const valid = await verifyOtp(email, String(code).trim(), "login");
    if (!valid) return fail(401, "Invalid or expired code");

    const sb = supabaseAdmin();
    const { data: user } = await sb
      .from("users")
      .select("id, email, role, blocked, onboarding_status, first_name")
      .ilike("email", email)
      .maybeSingle();
    if (!user) return fail(404, "Account not found");
    if (user.role !== "user") return fail(403, "Please use the team sign-in page");
    // Blocked users CAN sign in — the dashboard is read-only and writes are
    // blocked server-side. They see a banner explaining the situation.

    const token = signSession({ id: user.id, role: "user" });
    await setSessionCookie(token);

    // Route by onboarding status
    const redirect =
      user.onboarding_status === "APPROVED" ? "/dashboard" : "/pending-review";

    return ok({ redirect, user: { id: user.id, email: user.email, first_name: user.first_name } });
  } catch (e) {
    return handleError(e);
  }
}
