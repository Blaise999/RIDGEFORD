import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";
import { notify } from "@/lib/notify";
import { fmtCoin, getAsset } from "@/lib/crypto";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/crypto/withdrawals/[id]
 * body: { action: "approve" | "reject", tx_hash?, reason? }
 *
 * Approving marks the transfer as broadcast. Rejecting returns the escrowed
 * coin — including the network fee we reserved — to the customer's position.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const { action, tx_hash, reason } = (await req.json()) || {};
    const sb = supabaseAdmin();

    const { data: w } = await sb.from("crypto_withdrawals").select("*").eq("id", id).single();
    if (!w) return fail(404, "Withdrawal not found");
    if (w.status !== "pending_admin") return fail(400, `This withdrawal is already ${w.status}.`);

    const asset = await getAsset(w.asset_id);
    const symbol = asset?.symbol || String(w.asset_id).toUpperCase();
    const now = new Date().toISOString();

    if (action === "approve") {
      await sb
        .from("crypto_withdrawals")
        .update({
          status: "sent",
          tx_hash: tx_hash || null,
          reviewed_by: admin.id,
          reviewed_at: now,
          sent_at: now,
        })
        .eq("id", id);

      await notify(
        w.user_id,
        "crypto_send_approved",
        `${symbol} sent`,
        `${fmtCoin(Number(w.quantity), symbol)} has been broadcast to ${shorten(w.address)}${tx_hash ? ` · ${tx_hash}` : ""}.`,
        { reference: w.reference_id, tx_hash: tx_hash || null }
      );
      await audit(sb, admin.id, "crypto_withdrawal_approve", w.id, tx_hash);
      return ok({ status: "sent" });
    }

    if (action === "reject") {
      if (!reason) return fail(400, "A reason is required");

      // Return the escrowed coin (net + reserved network fee) to the position.
      const restore = Number(w.quantity) + Number(w.network_fee || 0);
      const { data: h } = await sb
        .from("crypto_holdings")
        .select("*")
        .eq("user_id", w.user_id)
        .eq("asset_id", w.asset_id)
        .maybeSingle();

      await sb.from("crypto_holdings").upsert(
        {
          user_id: w.user_id,
          asset_id: w.asset_id,
          quantity: (Number(h?.quantity) || 0) + restore,
          invested_eur: Number(h?.invested_eur) || 0,
          pinned: h?.pinned ?? true,
        },
        { onConflict: "user_id,asset_id" }
      );

      await sb
        .from("crypto_withdrawals")
        .update({
          status: "rejected",
          rejection_reason: reason,
          reviewed_by: admin.id,
          reviewed_at: now,
        })
        .eq("id", id);

      await notify(
        w.user_id,
        "crypto_send_rejected",
        `${symbol} withdrawal declined`,
        `${reason} — ${fmtCoin(restore, symbol)} has been returned to your crypto bar.`,
        { reference: w.reference_id }
      );
      await audit(sb, admin.id, "crypto_withdrawal_reject", w.id, reason);
      return ok({ status: "rejected", restored: restore });
    }

    return fail(400, "Unknown action");
  } catch (e) {
    return handleError(e);
  }
}

function shorten(a: string) {
  return a && a.length > 16 ? `${a.slice(0, 8)}…${a.slice(-6)}` : a;
}

async function audit(sb: any, adminId: string, action: string, targetId: string, notes?: string) {
  try {
    await sb.from("admin_actions").insert({
      admin_id: adminId,
      action,
      target_type: "crypto_withdrawal",
      target_id: targetId,
      notes: notes || null,
    });
  } catch {
    /* best effort */
  }
}
