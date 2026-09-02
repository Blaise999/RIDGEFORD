import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";
import { notify } from "@/lib/notify";
import { generateIban } from "@/lib/utils";
import { deferEmail, sendOnboardingApproved, sendOnboardingRejected } from "@/lib/email";

export const dynamic = "force-dynamic";

const BUCKET = "kyc-documents";

/**
 * GET /api/admin/kyc/[id] — one application, with 10-minute signed URLs
 * for each uploaded document. URLs are minted per request and never stored.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const sb = supabaseAdmin();

    const { data: app, error } = await sb
      .from("kyc_applications")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !app) return fail(404, "Application not found");

    const [{ data: user }, { data: docs }] = await Promise.all([
      sb.from("users").select("id, email, first_name, last_name, created_at, onboarding_status, blocked, iban, last_login_ip").eq("id", app.user_id).single(),
      sb.from("kyc_documents").select("*").eq("user_id", app.user_id).order("created_at", { ascending: false }),
    ]);

    const withUrls = await Promise.all(
      (docs || []).map(async (d: any) => {
        const { data: signed } = await sb.storage.from(BUCKET).createSignedUrl(d.file_path, 600);
        return { ...d, url: signed?.signedUrl || null };
      })
    );

    return ok({ application: app, user, documents: withUrls });
  } catch (e) {
    return handleError(e);
  }
}

/**
 * POST /api/admin/kyc/[id] — compliance decision.
 * body: { action: "approve" | "reject" | "more_info" | "in_review",
 *         reason?, notes?, risk_rating? }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { action, reason, notes, risk_rating } = (await req.json()) || {};
    const sb = supabaseAdmin();

    const { data: app } = await sb.from("kyc_applications").select("*").eq("id", id).single();
    if (!app) return fail(404, "Application not found");

    const { data: user } = await sb
      .from("users")
      .select("id, email, first_name, iban")
      .eq("id", app.user_id)
      .single();
    if (!user) return fail(404, "Customer not found");

    const now = new Date().toISOString();
    const base: Record<string, any> = {
      reviewed_by: admin.id,
      reviewed_at: now,
      review_notes: notes ?? app.review_notes,
    };
    if (risk_rating) base.risk_rating = risk_rating;

    if (action === "in_review") {
      await sb.from("kyc_applications").update({ ...base, status: "in_review" }).eq("id", id);
      return ok({ status: "in_review" });
    }

    if (action === "more_info") {
      if (!reason) return fail(400, "Tell the customer what's missing");
      await sb
        .from("kyc_applications")
        .update({ ...base, status: "more_info", info_request: reason })
        .eq("id", id);
      await sb
        .from("users")
        .update({ onboarding_status: "KYC_REQUIRED", kyc_status: "more_info" })
        .eq("id", user.id);
      await notify(user.id, "kyc_more_info", "We need a bit more from you", reason);
      return ok({ status: "more_info" });
    }

    if (action === "reject") {
      if (!reason) return fail(400, "A rejection reason is required");
      await sb
        .from("kyc_applications")
        .update({ ...base, status: "rejected", rejection_reason: reason })
        .eq("id", id);
      await sb
        .from("users")
        .update({ onboarding_status: "REJECTED", kyc_status: "rejected", rejection_reason: reason, reviewed_at: now, reviewed_by: admin.id })
        .eq("id", user.id);
      await notify(user.id, "kyc_rejected", "About your application", reason);
      deferEmail(() => sendOnboardingRejected(user.email, user.first_name || "there", reason));
      await audit(sb, admin.id, "kyc_reject", user.id, reason);
      return ok({ status: "rejected" });
    }

    if (action === "approve") {
      const iban = user.iban || generateIban();
      await sb
        .from("kyc_applications")
        .update({ ...base, status: "approved" })
        .eq("id", id);
      await sb
        .from("users")
        .update({
          onboarding_status: "APPROVED",
          kyc_status: "approved",
          kyc_approved_at: now,
          email_verified: true,
          iban,
          reviewed_at: now,
          reviewed_by: admin.id,
          rejection_reason: null,
        })
        .eq("id", user.id);
      await sb.from("kyc_documents").update({ status: "accepted" }).eq("user_id", user.id);
      await notify(
        user.id,
        "kyc_approved",
        "Your account is open",
        `Verification complete. Your IBAN is ${iban}. Cards, transfers and the crypto desk are now unlocked.`,
        { iban }
      );
      deferEmail(() => sendOnboardingApproved(user.email, user.first_name || "there", iban));
      await audit(sb, admin.id, "kyc_approve", user.id, notes);
      return ok({ status: "approved", iban });
    }

    return fail(400, "Unknown action");
  } catch (e) {
    return handleError(e);
  }
}

async function audit(sb: any, adminId: string, action: string, targetId: string, notes?: string) {
  try {
    await sb.from("admin_actions").insert({
      admin_id: adminId,
      action,
      target_type: "kyc_application",
      target_id: targetId,
      notes: notes || null,
    });
  } catch {
    /* audit is best-effort */
  }
}
