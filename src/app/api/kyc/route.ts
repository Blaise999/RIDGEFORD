import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";
import { notify } from "@/lib/notify";
import { assessRisk, validateStep, WRITABLE_FIELDS, KYC_STEPS } from "@/lib/kyc";

export const dynamic = "force-dynamic";

/** GET /api/kyc — the customer's draft application + uploaded documents. */
export async function GET() {
  try {
    const u = await requireUser();
    const sb = supabaseAdmin();

    const [{ data: app }, { data: docs }, { data: me }] = await Promise.all([
      sb.from("kyc_applications").select("*").eq("user_id", u.id).maybeSingle(),
      sb.from("kyc_documents").select("id, kind, file_name, mime_type, size_bytes, status, created_at").eq("user_id", u.id).order("created_at", { ascending: false }),
      sb.from("users").select("first_name, last_name, email, phone, onboarding_status, kyc_status").eq("id", u.id).single(),
    ]);

    return ok({ application: app || null, documents: docs || [], user: me || null });
  } catch (e) {
    return handleError(e);
  }
}

/**
 * PATCH /api/kyc — save a draft step. Called on every "continue", so the
 * customer never loses work if they close the tab mid-onboarding.
 */
export async function PATCH(req: NextRequest) {
  try {
    const u = await requireUser();
    const sb = supabaseAdmin();
    const body = (await req.json()) || {};

    const { data: existing } = await sb
      .from("kyc_applications")
      .select("id, status")
      .eq("user_id", u.id)
      .maybeSingle();

    if (existing && ["submitted", "in_review", "approved"].includes(existing.status)) {
      return fail(409, "Your application is already with our compliance team.");
    }

    const patch: Record<string, any> = {};
    for (const f of WRITABLE_FIELDS) {
      if (f in body) patch[f] = body[f];
    }
    patch.user_id = u.id;
    patch.status = existing?.status === "more_info" ? "more_info" : "draft";

    const { data, error } = await sb
      .from("kyc_applications")
      .upsert(patch, { onConflict: "user_id" })
      .select("*")
      .single();
    if (error) return fail(500, error.message);

    return ok({ application: data });
  } catch (e) {
    return handleError(e);
  }
}

/**
 * POST /api/kyc — final submission. Re-validates every step server-side,
 * scores the file, stamps the eIDAS signature record, and hands it to
 * compliance. The client cannot skip a step by calling this directly.
 */
export async function POST(req: NextRequest) {
  try {
    const u = await requireUser();
    const sb = supabaseAdmin();
    const body = (await req.json()) || {};

    const { data: existing } = await sb
      .from("kyc_applications")
      .select("*")
      .eq("user_id", u.id)
      .maybeSingle();
    if (existing && ["submitted", "in_review", "approved"].includes(existing.status)) {
      return fail(409, "Your application has already been submitted.");
    }

    const patch: Record<string, any> = {};
    for (const f of WRITABLE_FIELDS) {
      if (f in body) patch[f] = body[f];
    }
    const merged = { ...(existing || {}), ...patch };

    const { data: docs } = await sb
      .from("kyc_documents")
      .select("kind")
      .eq("user_id", u.id);
    (merged as any).__uploaded = Array.from(new Set((docs || []).map((d: any) => d.kind)));

    // Server-side re-validation of every step — the wizard is a convenience,
    // not the control.
    const errors: Record<string, string> = {};
    for (const s of KYC_STEPS) {
      Object.assign(errors, validateStep(s.key, merged));
    }
    if (Object.keys(errors).length) {
      return fail(400, "Some details are still missing or invalid.", { errors });
    }

    const risk = assessRisk(merged);
    if (risk.score >= 100) {
      return fail(403, "We're unable to open an account for customers in that jurisdiction.");
    }

    const now = new Date().toISOString();
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    const { data: app, error } = await sb
      .from("kyc_applications")
      .upsert(
        {
          ...patch,
          user_id: u.id,
          status: "submitted",
          submitted_at: now,
          signed_at: now,
          ip_address: ip,
          user_agent: req.headers.get("user-agent"),
          locale: req.headers.get("accept-language")?.split(",")[0] || null,
          risk_score: risk.score,
          risk_rating: risk.rating,
          risk_factors: risk.factors,
        },
        { onConflict: "user_id" }
      )
      .select("*")
      .single();
    if (error) return fail(500, error.message);

    // Mirror the identity onto the user record so the rest of the app
    // (dashboard, receipts, SEPA screens) has what it needs.
    await sb
      .from("users")
      .update({
        first_name: merged.legal_first_name,
        middle_name: merged.legal_middle_name || null,
        last_name: merged.legal_last_name,
        title: merged.title || null,
        gender: merged.gender || null,
        phone: merged.phone,
        date_of_birth: merged.date_of_birth,
        place_of_birth: merged.place_of_birth,
        country_of_birth: merged.country_of_birth,
        nationality: merged.nationality,
        second_nationality: merged.second_nationality || null,
        street: merged.street,
        street_number: merged.street_number,
        postal_code: merged.postal_code,
        city: merged.city,
        country: merged.residence_country,
        tax_residence_country: merged.tax_residence_country,
        tax_id: merged.tax_id || null,
        employment_status: merged.employment_status,
        employer: merged.employer_name || null,
        occupation: merged.occupation || null,
        monthly_income: merged.annual_income_band || null,
        source_of_funds: Array.isArray(merged.source_of_funds)
          ? merged.source_of_funds.join(", ")
          : merged.source_of_funds || null,
        id_document_type: merged.id_document_type,
        id_document_number: merged.id_document_number,
        onboarding_status: "KYC_SUBMITTED",
        kyc_status: "submitted",
        kyc_risk: risk.rating,
      })
      .eq("id", u.id);

    await notify(
      u.id,
      "kyc_submitted",
      "Identity verification submitted",
      "Thanks — your file is with our compliance team. Most checks finish within one business day.",
      { risk: risk.rating }
    );

    return ok({ application: app, risk });
  } catch (e) {
    return handleError(e);
  }
}
