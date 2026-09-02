import { NextRequest } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateOtp, storeOtp } from "@/lib/otp";
import { sendOtp, deferEmail } from "@/lib/email";
import { ok, fail, handleError } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * POST /api/crypto/otp — step-up authorisation for a crypto withdrawal.
 * Same pattern the SEPA rails use: emailed 6-digit code, 10-minute TTL.
 */
export async function POST(req: NextRequest) {
  try {
    const u = await requireActiveUser();
    const sb = supabaseAdmin();

    let ctx: { amount?: string; beneficiary?: string } | undefined;
    try {
      const b = await req.json();
      if (b?.amount || b?.address) {
        ctx = { amount: b.amount, beneficiary: b.address };
      }
    } catch {
      /* body is optional */
    }

    const { data } = await sb.from("users").select("email").eq("id", u.id).single();
    if (!data) return fail(500, "Account not found");

    const code = generateOtp();
    await storeOtp(data.email, code, "crypto_withdrawal");
    deferEmail(() => sendOtp(data.email, code, "crypto_withdrawal", ctx));

    // Tell the truth about deliverability. This used to always report
    // sent: true, so a customer waited for an email that was never going to
    // arrive and then hit a 401 they had no way to understand.
    const mailConfigured = Boolean(process.env.RESEND_API_KEY);
    return ok({
      sent: mailConfigured,
      to: maskEmail(data.email),
      note: mailConfigured
        ? undefined
        : "Email is not configured on this deployment — check the server console for the code.",
    });
  } catch (e) {
    return handleError(e);
  }
}

function maskEmail(e: string) {
  const [name, domain] = String(e).split("@");
  if (!domain) return e;
  return `${name.slice(0, 2)}${"•".repeat(Math.max(2, name.length - 2))}@${domain}`;
}
