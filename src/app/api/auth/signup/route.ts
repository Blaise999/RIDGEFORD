import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { hashPassword, signSession, setSessionCookie } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/http";
import { BLOCKED_COUNTRIES } from "@/lib/kyc";
import { resolveDesk, recordClaim } from "@/lib/desks";

/**
 * POST /api/auth/signup
 *
 * Deliberately short: an EU bank opens a *file*, not an account. We take
 * credentials and enough identity to address the customer, then hand them
 * straight to the CDD wizard at /kyc. No IBAN, no balance, no product
 * access until compliance approves.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) || {};
    const {
      first_name, last_name, email, password, phone, residence_country,
      consent_terms, consent_privacy, referral_code,
    } = body;

    if (!email || !password) return fail(400, "Email and password are required");
    if (!/.+@.+\..+/.test(String(email))) return fail(400, "Enter a valid email address");
    if (!first_name || !last_name) return fail(400, "Enter your first and last name");
    if (String(password).length < 10) {
      return fail(400, "Use at least 10 characters — this protects your money");
    }
    if (!/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)) {
      return fail(400, "Mix letters and numbers in your password");
    }
    if (!residence_country) return fail(400, "Select your country of residence");
    if (BLOCKED_COUNTRIES.includes(String(residence_country))) {
      return fail(403, "We're not able to open accounts for residents of that country.");
    }
    if (!consent_terms || !consent_privacy) {
      return fail(400, "You need to accept the terms and the privacy notice");
    }

    const sb = supabaseAdmin();
    const { data: existing } = await sb
      .from("users")
      .select("id")
      .ilike("email", String(email))
      .maybeSingle();
    if (existing) return fail(409, "An account with this email already exists");

    const password_hash = await hashPassword(String(password));

    // Which desk owns this customer? A valid code routes them to that admin;
    // anything else (blank, unknown, exhausted) falls to head office. A
    // mistyped referral code never costs someone their account.
    const desk = await resolveDesk(referral_code);

    const { data, error } = await sb
      .from("users")
      .insert({
        email: String(email).toLowerCase(),
        password_hash,
        role: "user",
        first_name,
        last_name,
        phone: phone || null,
        country: residence_country,
        iban: null,
        balance_checking: 0,
        balance_savings: 0,
        admin_owner_id: desk.admin_owner_id,
        referral_code: desk.referral_code,
        referred_at: desk.referral_code ? new Date().toISOString() : null,
        onboarding_status: "KYC_REQUIRED",
        kyc_status: "not_started",
        email_verified: false,
      })
      .select("id, email, role, first_name, onboarding_status")
      .single();

    if (error || !data) {
      if (error?.code === "23505") return fail(409, "An account with this email already exists");
      return fail(500, error?.message || "Could not start your application");
    }

    // Seed the CDD file with what we already know, so the wizard opens pre-filled.
    await sb.from("kyc_applications").upsert(
      {
        user_id: data.id,
        status: "draft",
        step: 1,
        legal_first_name: first_name,
        legal_last_name: last_name,
        phone: phone || null,
        residence_country,
        consent_terms: Boolean(consent_terms),
        consent_privacy: Boolean(consent_privacy),
        consent_marketing: Boolean(body.consent_marketing),
      },
      { onConflict: "user_id" }
    );

    await recordClaim(data.id, desk, {
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      ua: req.headers.get("user-agent"),
    });

    const token = signSession({ id: data.id, role: "user" });
    await setSessionCookie(token);

    const { sendWelcome, deferEmail } = await import("@/lib/email");
    deferEmail(() => sendWelcome(data.email, data.first_name || "there"));

    return ok({
      user: data,
      next: "/kyc",
      desk: desk.admin_label,
      // Told plainly rather than silently ignored, so the customer can fix it
      // with support if the code mattered to them.
      code_rejected: desk.code_rejected,
    });
  } catch (e) {
    return handleError(e);
  }
}
