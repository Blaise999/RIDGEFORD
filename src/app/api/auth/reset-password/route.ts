import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hashPassword } from "@/lib/auth";
import { verifyOtp } from "@/lib/otp";
import { ok, fail, handleError } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const { email, code, password } = await req.json();
    if (!email || !code || !password) return fail(400, "All fields are required");
    if (String(password).length < 8) return fail(400, "Password must be at least 8 characters");

    const valid = await verifyOtp(email, String(code).trim(), "password_reset");
    if (!valid) return fail(401, "Invalid or expired code");

    const sb = supabaseAdmin();
    const password_hash = await hashPassword(password);
    const { error } = await sb
      .from("users")
      .update({ password_hash })
      .ilike("email", email);
    if (error) return fail(500, error.message);

    return ok();
  } catch (e) {
    return handleError(e);
  }
}
