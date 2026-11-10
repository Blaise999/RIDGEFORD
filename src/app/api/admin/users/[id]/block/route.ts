import { canActOn } from "@/lib/desks";
import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";
import { sendAccountBlocked, sendAccountUnblocked, deferEmail } from "@/lib/email";
import { notify } from "@/lib/notify";

/**
 * POST /api/admin/users/:id/block
 * body: { block: true|false, reason?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    if (!(await canActOn(admin, id))) return fail(404, "Customer not found in your desk");
    const body = await req.json().catch(() => ({}));
    if (typeof body?.block !== "boolean") return fail(400, "Invalid block action");
    const block = body.block;
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    if (block && (reason.length < 8 || reason.length > 500)) {
      return fail(400, "Enter a suspension reason between 8 and 500 characters.");
    }

    const sb = supabaseAdmin();

    const { data: target } = await sb
      .from("users")
      .select("id,email,first_name,role,blocked")
      .eq("id", id)
      .single();
    if (!target) return fail(404, "User not found");
    if (target.role === "admin") return fail(400, "Cannot block an admin");
    // Repeated requests must not send duplicate customer notifications.
    if (Boolean(target.blocked) === block) return ok({ blocked: block, unchanged: true });

    const { data: updated, error } = await sb
      .from("users")
      .update({
        blocked: block,
        blocked_reason: block ? reason : null,
        blocked_at: block ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .eq("blocked", !block)
      .select("id")
      .maybeSingle();
    if (error) return fail(500, error.message);
    if (!updated) return fail(409, "Account status changed. Refresh and try again.");

    await sb.from("admin_actions").insert({
      admin_id: admin.id,
      action: block ? "block_user" : "unblock_user",
      target_type: "user",
      target_id: id,
      notes: block ? reason : "Account access restored",
    });

    if (block) {
      deferEmail(() =>
        sendAccountBlocked(target.email, target.first_name || "there", reason)
      );
      await notify(
        id,
        "account_blocked",
        "Your account access is restricted",
        `Your account access is temporarily restricted. Reason: ${reason}. To request information or appeal, message Ridgeford Support Team from your account.`,
        { reason }
      );
    } else {
      deferEmail(() =>
        sendAccountUnblocked(target.email, target.first_name || "there")
      );
      await notify(
        id,
        "account_unblocked",
        "Your account access is restored",
        "The restriction on your account has been removed. You can now use your available banking features again."
      );
    }

    return ok({ blocked: block });
  } catch (e) {
    return handleError(e);
  }
}
