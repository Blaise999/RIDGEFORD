import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabase/admin";

const OTP_TTL_MINUTES = 10;

export type OtpPurpose = "login" | "password_reset" | "transfer" | "crypto_withdrawal";

export function generateOtp() {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  return code;
}

export async function storeOtp(email: string, code: string, purpose: OtpPurpose) {
  // If no mail provider is configured, nothing can deliver this code, so print
  // it. Not a bypass — the code is still the real one and still expires.
  if (!process.env.RESEND_API_KEY) {
    console.log(
      `\n[otp:dev] ${purpose} code for ${email}: \x1b[1m${code}\x1b[0m  (valid ${OTP_TTL_MINUTES} min)\n`
    );
  }

  const sb = supabaseAdmin();
  const code_hash = await bcrypt.hash(code, 8);
  const expires_at = new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString();

  await sb
    .from("otp_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("email", email.toLowerCase())
    .eq("purpose", purpose)
    .is("used_at", null);

  await sb.from("otp_codes").insert({
    email: email.toLowerCase(),
    code_hash,
    purpose,
    expires_at,
  });
}

/**
 * Verifies an OTP.
 *
 * The only thing accepted is the real code that was issued, unused and inside
 * its ten-minute window. There is deliberately no master code and no
 * environment-gated bypass: a back door on a payment authorisation is worth
 * far less than it costs.
 */
export async function verifyOtp(
  email: string,
  code: string,
  purpose: OtpPurpose
): Promise<boolean> {
  const submitted = String(code || "").trim();

  const sb = supabaseAdmin();
  const { data } = await sb
    .from("otp_codes")
    .select("id, code_hash, expires_at, used_at")
    .eq("email", email.toLowerCase())
    .eq("purpose", purpose)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return false;
  if (new Date(data.expires_at).getTime() < Date.now()) return false;

  const ok = await bcrypt.compare(submitted, data.code_hash);
  if (!ok) return false;

  await sb
    .from("otp_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", data.id);
  return true;
}
