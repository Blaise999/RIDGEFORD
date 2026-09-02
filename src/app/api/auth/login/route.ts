import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyPassword } from "@/lib/auth";
import { generateOtp, storeOtp } from "@/lib/otp";
import { sendOtp } from "@/lib/email";
import { ok, fail, handleError } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return fail(400, "Email and password required");

    const sb = supabaseAdmin();
    const { data: user } = await sb
      .from("users")
      .select("id, email, password_hash, role, blocked, onboarding_status")
      .ilike("email", email)
      .maybeSingle();

    // Resend path — triggered by /login/verify page on "Resend code".
    // We still require a user to exist, but skip the password check.
    const isResend = password === "__resend__";

    const pass = !isResend && user?.password_hash
      ? await verifyPassword(password, user.password_hash)
      : isResend && !!user;
    if (!user || !pass) return fail(401, "Invalid email or password");

    if (user.role !== "user") {
      return fail(403, "Please use the team sign-in page");
    }
    // Blocked users CAN sign in — the dashboard is read-only when blocked.

    // Generate & store OTP, email it.
    // We `await` here on purpose: the user is staring at a "code sent" screen,
    // so we'd rather take ~300ms now than risk the serverless runtime freezing
    // a fire-and-forget Promise mid-flight.
    const code = generateOtp();
    await storeOtp(user.email, code, "login");
    await sendOtp(user.email, code, "login");

    return ok({ next: "/login/verify", emailMasked: maskEmail(user.email) });
  } catch (e) {
    return handleError(e);
  }
}

function maskEmail(e: string) {
  const [local, domain] = e.split("@");
  if (!domain) return e;
  const shown = local.slice(0, 2);
  return `${shown}${"•".repeat(Math.max(0, local.length - 2))}@${domain}`;
}
