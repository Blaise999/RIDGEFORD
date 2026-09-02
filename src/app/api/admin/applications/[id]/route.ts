import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";
import { generateIban } from "@/lib/utils";
import { sendOnboardingApproved, sendOnboardingRejected, deferEmail } from "@/lib/email";
import { notify } from "@/lib/notify";

type NotifyKind = Parameters<typeof notify>[1];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const sb = supabaseAdmin();

    const { data, error } = await sb
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return fail(404, "Application not found");

    return ok({ application: data });
  } catch (e) {
    return handleError(e);
  }
}

/**
 * POST /api/admin/applications/:id
 * body: { action: 'approve' | 'reject', reason?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    const reason = body?.reason ? String(body.reason).slice(0, 500) : null;

    if (!["approve", "reject"].includes(action)) {
      return fail(400, "Invalid action");
    }

    const sb = supabaseAdmin();

    const { data: user, error: userError } = await sb
      .from("users")
      .select("id,email,first_name,onboarding_status,role,iban")
      .eq("id", id)
      .single();

    if (userError || !user) return fail(404, "User not found");
    if (user.role === "admin") return fail(400, "Cannot action admin accounts");

    if (user.onboarding_status !== "PENDING_REVIEW") {
      return fail(400, `Application is already ${user.onboarding_status}`);
    }

    const now = new Date().toISOString();

    if (action === "approve") {
      let iban = user.iban;

      if (!iban) {
        for (let i = 0; i < 3 && !iban; i++) {
          const candidate = generateIban();

          const { error: updErr } = await sb
            .from("users")
            .update({
              iban: candidate,
              account_number: candidate.replace(/\s+/g, "").slice(-10),
              card_last4: String(Math.floor(1000 + Math.random() * 9000)),
              email_verified: true,
              onboarding_status: "APPROVED",
              reviewed_at: now,
              reviewed_by: admin.id,
              rejection_reason: null,
            })
            .eq("id", id);

          if (!updErr) iban = candidate;
        }

        if (!iban) return fail(500, "Could not issue IBAN; please retry");
      } else {
        await sb
          .from("users")
          .update({
            email_verified: true,
            onboarding_status: "APPROVED",
            reviewed_at: now,
            reviewed_by: admin.id,
            rejection_reason: null,
          })
          .eq("id", id);
      }

      await sb.from("admin_actions").insert({
        admin_id: admin.id,
        action: "approve_application",
        target_type: "user",
        target_id: id,
      });

      // Email goes out — but intentionally NO bell notification on account
      // opening. The welcome belongs in the inbox, not in the activity feed.
      deferEmail(() =>
        sendOnboardingApproved(user.email, user.first_name || "there", iban)
      );

      return ok({ status: "APPROVED", iban });
    }

    await sb
      .from("users")
      .update({
        onboarding_status: "REJECTED",
        rejection_reason: reason,
        reviewed_at: now,
        reviewed_by: admin.id,
      })
      .eq("id", id);

    await sb.from("admin_actions").insert({
      admin_id: admin.id,
      action: "reject_application",
      target_type: "user",
      target_id: id,
      notes: reason,
    });

    deferEmail(() =>
      sendOnboardingRejected(user.email, user.first_name || "there", reason || undefined)
    );

    await notify(
      id,
      "application_rejected" as NotifyKind,
      "Your application wasn't approved",
      reason || "Please contact support if you'd like more information.",
      { reason }
    );

    return ok({ status: "REJECTED" });
  } catch (e) {
    return handleError(e);
  }
}