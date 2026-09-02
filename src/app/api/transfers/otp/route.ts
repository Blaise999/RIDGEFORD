import { NextRequest } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";
import { generateOtp, storeOtp } from "@/lib/otp";
import { sendOtp, deferEmail } from "@/lib/email";
import { fmtMoney } from "@/lib/utils";

/**
 * POST /api/transfers/otp
 *
 * Bank-style transfer authorisation. The user fills the transfer form and
 * clicks "Send". Before we create anything, we email them a 6-digit code.
 * They enter it back on the form; the actual transfer is only created by
 * POST /api/transfers once a valid, unused code is supplied.
 *
 * body: { amount?, currency?, beneficiary_name? }  (used only to make the
 *        email informative — the real validation happens on submit)
 */
export async function POST(req: NextRequest) {
  try {
    const u = await requireActiveUser();

    const sb = supabaseAdmin();
    const { data: sender } = await sb
      .from("users")
      .select("email, first_name, blocked")
      .eq("id", u.id)
      .single();

    if (!sender) return fail(500, "Account not found");
    if (sender.blocked) return fail(403, "Account suspended");

    const body = await req.json().catch(() => ({}));
    const amount = Number(body?.amount);
    const currency =
      typeof body?.currency === "string" && body.currency
        ? String(body.currency).toUpperCase()
        : "EUR";
    const beneficiary =
      typeof body?.beneficiary_name === "string"
        ? body.beneficiary_name.slice(0, 80)
        : "";

    const code = generateOtp();
    await storeOtp(sender.email, code, "transfer");

    deferEmail(() =>
      sendOtp(sender.email, code, "transfer", {
        amount:
          Number.isFinite(amount) && amount > 0
            ? fmtMoney(amount, currency)
            : undefined,
        beneficiary: beneficiary || undefined,
      })
    );

    // Mask the email for the UI ("a••@gmail.com")
    const [local, domain] = sender.email.split("@");
    const masked =
      local.length <= 2
        ? `${local[0] || ""}••@${domain}`
        : `${local.slice(0, 2)}••@${domain}`;

    return ok({
      sent: true,
      emailMasked: masked,
      // In dev (no Resend key) the code is accepted as 000000 by verifyOtp,
      // but we also surface a hint so testing is painless.
      devHint: !process.env.RESEND_API_KEY ? "Use 000000 in dev" : undefined,
    });
  } catch (e) {
    return handleError(e);
  }
}
