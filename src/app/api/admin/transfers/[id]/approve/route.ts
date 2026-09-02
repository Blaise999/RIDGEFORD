import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";
import { sendTransferApproved, sendReceipt, deferEmail } from "@/lib/email";
import { notify } from "@/lib/notify";
import { fmtMoney } from "@/lib/utils";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const sb = supabaseAdmin();

    const { data: transfer, error: tErr } = await sb
      .from("transfers")
      .select("*")
      .eq("id", id)
      .single();
    if (tErr || !transfer) return fail(404, "Transfer not found");
    if (transfer.status !== "pending_admin") return fail(400, `Transfer is already ${transfer.status}`);

    const { data: sender } = await sb
      .from("users")
      .select("id,email,first_name,last_name,balance_checking,balance_savings,blocked,iban")
      .eq("id", transfer.user_id)
      .single();
    if (!sender) return fail(404, "Sender not found");
    if (sender.blocked) return fail(403, "Sender account is suspended");

    // For SWIFT in non-EUR, re-convert at approval time so the debit matches.
    let amt = Number(transfer.amount);
    if (transfer.rail === "swift" && transfer.currency && String(transfer.currency).toUpperCase() !== "EUR") {
      const { convertToEur } = await import("@/lib/fx");
      amt = await convertToEur(Number(transfer.amount), String(transfer.currency));
      amt = Math.round(amt * 100) / 100;
    }
    const accType = transfer.account_type === "savings" ? "savings" : "checking";
    const col = accType === "savings" ? "balance_savings" : "balance_checking";
    const senderBal = Number((sender as any)[col]);
    if (senderBal < amt) return fail(400, "Sender has insufficient balance");

    // Debit sender balance
    await sb.from("users").update({ [col]: senderBal - amt }).eq("id", sender.id);

    // Settle the pending ledger row that was created at submission time
    const { data: updatedRows, error: upErr } = await sb
      .from("transactions")
      .update({ status: "posted" })
      .eq("transfer_id", transfer.id)
      .eq("user_id", sender.id)
      .eq("direction", "debit")
      .eq("status", "pending")
      .select("id");
    if (upErr) return fail(500, upErr.message);

    // Fallback: if no pending row existed (older transfers), create a posted one now
    if (!updatedRows || updatedRows.length === 0) {
      await sb.from("transactions").insert({
        user_id: sender.id,
        transfer_id: transfer.id,
        account_type: accType,
        direction: "debit",
        amount: amt,
        currency: transfer.currency,
        rail: transfer.rail,
        category: "Transfer",
        counterparty_name: transfer.beneficiary_name,
        counterparty_iban: transfer.beneficiary_iban,
        counterparty_email: transfer.beneficiary_email,
        description: transfer.reference || transfer.memo || "Transfer out",
        merchant: transfer.beneficiary_name,
        reference: transfer.reference_id,
        status: "posted",
      });
    }

    // Internal: credit the recipient immediately
    if (transfer.rail === "internal" && transfer.beneficiary_user_id) {
      const { data: rec } = await sb
        .from("users")
        .select("id,balance_checking,email,first_name,blocked")
        .eq("id", transfer.beneficiary_user_id)
        .single();
      if (rec && !rec.blocked) {
        await sb
          .from("users")
          .update({ balance_checking: Number(rec.balance_checking) + amt })
          .eq("id", rec.id);
        await sb.from("transactions").insert({
          user_id: rec.id,
          transfer_id: transfer.id,
          account_type: "checking",
          direction: "credit",
          amount: amt,
          currency: transfer.currency,
          rail: "internal",
          category: "Transfer",
          counterparty_name: sender.first_name || sender.email,
          counterparty_email: sender.email,
          description: transfer.reference || transfer.memo || "Transfer in",
          merchant: sender.first_name || sender.email,
          reference: transfer.reference_id,
          status: "posted",
        });
        await notify(
          rec.id,
          "credit",
          `You received ${fmtMoney(amt, transfer.currency)}`,
          `From ${sender.first_name || sender.email}${transfer.reference ? ` · ${transfer.reference}` : ""}`,
          { from: sender.email, reference: transfer.reference_id }
        );
      }
    }

    const now = new Date().toISOString();
    await sb
      .from("transfers")
      .update({
        status: "completed",
        reviewed_at: now,
        reviewed_by: admin.id,
        completed_at: now,
      })
      .eq("id", id);

    await sb.from("admin_actions").insert({
      admin_id: admin.id,
      action: "approve_transfer",
      target_type: "transfer",
      target_id: id,
    });

    // Email: approval + receipt
    const senderFullName =
      [sender.first_name, sender.last_name].filter(Boolean).join(" ") || sender.email;

    const receiptPayload = {
      firstName: sender.first_name || "there",
      reference: transfer.reference_id,
      amount: amt,
      currency: transfer.currency,
      beneficiaryName: transfer.beneficiary_name,
      beneficiaryIban: transfer.beneficiary_iban || undefined,
      beneficiaryBic: transfer.beneficiary_bic || undefined,
      beneficiaryCountry: transfer.beneficiary_country || undefined,
      rail: transfer.rail,
      fee: Number(transfer.fee || 0),
      completedAt: now,
      senderName: senderFullName,
      senderIban: sender.iban || undefined,
      reference_note: transfer.reference || transfer.memo || undefined,
    };

    deferEmail(() => sendTransferApproved(sender.email, receiptPayload));
    deferEmail(() => sendReceipt(sender.email, receiptPayload));

    await notify(
      sender.id,
      "transfer_approved",
      `Transfer ${transfer.reference_id} approved`,
      `${fmtMoney(amt, transfer.currency)} sent to ${transfer.beneficiary_name}. A receipt has been emailed to you.`,
      { transfer_id: transfer.id, reference: transfer.reference_id, receipt: true }
    );

    return ok({ status: "completed" });
  } catch (e) {
    return handleError(e);
  }
}
