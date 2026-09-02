import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";
import { sendTransferRejected, deferEmail } from "@/lib/email";
import { notify } from "@/lib/notify";
import { fmtMoney } from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body?.reason ? String(body.reason).slice(0, 500) : null;
    const sb = supabaseAdmin();

    const { data: transfer } = await sb
      .from("transfers")
      .select("*")
      .eq("id", id)
      .single();
    if (!transfer) return fail(404, "Transfer not found");
    if (transfer.status !== "pending_admin")
      return fail(400, `Transfer is already ${transfer.status}`);

    const { data: sender } = await sb
      .from("users")
      .select("id,email,first_name")
      .eq("id", transfer.user_id)
      .single();

    // Reverse the pending ledger row so it visibly shows as rejected
    await sb
      .from("transactions")
      .update({
        status: "reversed",
        description: reason ? `Rejected: ${reason}` : "Rejected by compliance",
      })
      .eq("transfer_id", transfer.id)
      .eq("status", "pending");

    await sb
      .from("transfers")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin.id,
        rejection_reason: reason,
      })
      .eq("id", id);

    await sb.from("admin_actions").insert({
      admin_id: admin.id,
      action: "reject_transfer",
      target_type: "transfer",
      target_id: id,
      notes: reason,
    });

    if (sender) {
      deferEmail(() =>
        sendTransferRejected(sender.email, {
          firstName: sender.first_name || "there",
          reference: transfer.reference_id,
          amount: Number(transfer.amount),
          currency: transfer.currency,
          beneficiaryName: transfer.beneficiary_name,
          rail: transfer.rail,
          reason: reason || undefined,
        })
      );

      await notify(
        transfer.user_id,
        "transfer_rejected",
        `Transfer ${transfer.reference_id} rejected`,
        reason
          ? `${fmtMoney(Number(transfer.amount), transfer.currency)} to ${transfer.beneficiary_name} — ${reason}`
          : `${fmtMoney(Number(transfer.amount), transfer.currency)} to ${transfer.beneficiary_name} was not approved.`,
        { transfer_id: transfer.id, reference: transfer.reference_id, reason }
      );
    }

    return ok();
  } catch (e) {
    return handleError(e);
  }
}
