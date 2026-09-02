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
    const body = await req.json().catch(() => ({}));
    const block = Boolean(body?.block);
    const reason = body?.reason ? String(body.reason).slice(0, 500) : null;

    const sb = supabaseAdmin();

    const { data: target } = await sb
      .from("users")
      .select("id,email,first_name,role")
      .eq("id", id)
      .single();
    if (!target) return fail(404, "User not found");
    if (target.role === "admin") return fail(400, "Cannot block an admin");

    const { error } = await sb
      .from("users")
      .update({
        blocked: block,
        blocked_reason: block ? reason : null,
        blocked_at: block ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) return fail(500, error.message);

    await sb.from("admin_actions").insert({
      admin_id: admin.id,
      action: block ? "block_user" : "unblock_user",
      target_type: "user",
      target_id: id,
      notes: reason,
    });

    if (block) {
      deferEmail(() =>
        sendAccountBlocked(target.email, target.first_name || "there", reason || undefined)
      );
      await notify(
        id,
        "account_blocked",
        "Your account has been suspended",
        reason || "Please contact support for more information.",
        { reason }
      );
    } else {
      deferEmail(() =>
        sendAccountUnblocked(target.email, target.first_name || "there")
      );
      await notify(
        id,
        "account_unblocked",
        "Your account is active again",
        "You can now sign in and transfer money as normal."
      );
    }

    return ok({ blocked: block });
  } catch (e) {
    return handleError(e);
  }
}
