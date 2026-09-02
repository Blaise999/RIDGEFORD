import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateOtp, storeOtp } from "@/lib/otp";
import { sendOtp } from "@/lib/email";
import { ok, handleError } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return ok({ sent: true }); // don't leak

    const sb = supabaseAdmin();
    const { data: user } = await sb
      .from("users")
      .select("email, role")
      .ilike("email", email)
      .maybeSingle();

    // Always respond with "sent" — don't leak whether the email exists.
    if (user && user.role === "user") {
      const code = generateOtp();
      await storeOtp(user.email, code, "password_reset");
      // Awaited on purpose — user is waiting on the code.
      await sendOtp(user.email, code, "password_reset");
    }
    return ok({ sent: true });
  } catch (e) {
    return handleError(e);
  }
}
