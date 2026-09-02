import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { signSession, setSessionCookie } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/http";
import { verifyOtp } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) return fail(400, "Email and code required");

    const okCode = await verifyOtp(email, String(code), "login");
    if (!okCode) return fail(401, "Invalid or expired code");

    const sb = supabaseAdmin();
    const { data: user } = await sb
      .from("users")
      .select("id,email,role,first_name,onboarding_status,blocked")
      .ilike("email", email)
      .maybeSingle();
    if (!user) return fail(404, "Account not found");
    if (user.onboarding_status !== "APPROVED") return fail(403, "Account is not active");
    if (user.role !== "user") return fail(403, "Wrong sign-in page");

    const token = signSession({ id: user.id, role: "user" });
    await setSessionCookie(token);

    return ok({ user: { id: user.id, email: user.email, first_name: user.first_name } });
  } catch (e) {
    return handleError(e);
  }
}
