import { canActOn } from "@/lib/desks";
import { fmtFxMoney } from "@/lib/fx-money";
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
    if (!(await canActOn(admin, transfer.user_id))) return fail(404, "Transfer not found in your desk");
    if (transfer.status !== "pending_admin")
      return fail(400, `Transfer is already ${transfer.status}`);

    const { data: sender } = await sb
      .from("users")
      .select("id,email,first_name")
      .eq("id", transfer.user_id)
      .single();

    // FX approvals debit atomically in SQL. Claim the pending status before
    // reversing its ledger entry so a simultaneous approval cannot debit a
    // request that was already rejected (or vice versa).
    if (transfer.fx_quote_id) {
      const { data: rejected, error: rejectError } = await sb
        .from("transfers")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: admin.id,
          rejection_reason: reason,
        })
        .eq("id", id)
        .eq("status", "pending_admin")
        .select("id")
        .maybeSingle();
      if (rejectError || !rejected) return fail(409, "Transfer already reviewed");
    }

    // Rejected transfers are never debited. Mark their pending ledger as reversed.
    await sb
      .from("transactions")
      .update({
        status: "reversed",
        description: reason ? `Rejected: ${reason}` : "Rejected by compliance",
      })
      .eq("transfer_id", transfer.id)
      .eq("status", "pending");

    if (!transfer.fx_quote_id) {
      await sb
        .from("transfers")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: admin.id,
          rejection_reason: reason,
        })
        .eq("id", id);
    }

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
          amount: Number(transfer.fx_quote_id ? transfer.source_amount : transfer.amount),
          currency: transfer.fx_quote_id ? transfer.source_currency : transfer.currency,
          beneficiaryName: transfer.beneficiary_name,
          rail: transfer.rail,
          reason: reason || undefined,
        })
      );

      await notify(
        transfer.user_id,
        "transfer_rejected",
        `Transfer ${transfer.reference_id} rejected`,
        transfer.fx_quote_id
          ? `${fmtFxMoney(Number(transfer.source_amount), transfer.source_currency)} → approximately ${fmtFxMoney(Number(transfer.recipient_amount), transfer.recipient_currency)} for ${transfer.beneficiary_name} was not approved.${reason ? ` Reason: ${reason}` : ""}`
          : reason
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
