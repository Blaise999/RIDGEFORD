import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";
import { generateTransactions } from "@/lib/seed";
import { fmtMoney } from "@/lib/utils";

/**
 * POST /api/admin/users/:id/seed
 * body: {
 *   direction?: 'sent' | 'received' | 'both',
 *   count?: number, minAmount?: number, maxAmount?: number,
 *   from?: ISO, to?: ISO,
 *   accountType?: 'checking' | 'savings',
 *   adjustBalance?: boolean
 * }
 * Writes a notification for EACH transaction (backdated to the txn) so the
 * user's notification feed matches their transactions.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const sb = supabaseAdmin();
    const { data: user } = await sb
      .from("users")
      .select("id,role,balance_checking,balance_savings")
      .eq("id", id)
      .single();
    if (!user) return fail(404, "User not found");
    if (user.role === "admin") return fail(400, "Refusing to seed into admin account");

    const rows = generateTransactions(id, {
      direction: body?.direction,
      count: body?.count,
      minAmount: body?.minAmount,
      maxAmount: body?.maxAmount,
      from: body?.from,
      to: body?.to,
      accountType: body?.accountType,
    });
    if (!rows.length) return fail(400, "No transactions generated — check your parameters");

    const { data: inserted, error } = await sb
      .from("transactions")
      .insert(rows)
      .select("id, created_at, direction, amount, currency, counterparty_name, merchant, category");
    if (error) return fail(500, error.message);

    // Per-transaction notifications, backdated to created_at
    const notifRows = (inserted || []).map((t: any) => ({
      user_id: id,
      kind: t.direction === "credit" ? "credit" : "debit",
      title:
        t.direction === "credit"
          ? `You received ${fmtMoney(Number(t.amount), t.currency)}`
          : `${fmtMoney(Number(t.amount), t.currency)} spent at ${t.merchant || t.counterparty_name || "merchant"}`,
      body:
        t.direction === "credit"
          ? `From ${t.counterparty_name || "sender"} · ${t.category || "Income"}`
          : `${t.category || "Transaction"}`,
      metadata: { transaction_id: t.id },
      created_at: t.created_at,
      read: false,
    }));
    if (notifRows.length) {
      await sb.from("notifications").insert(notifRows);
    }

    // Optional: roll balance by the net of the seeded txns
    if (body?.adjustBalance) {
      const acc = body?.accountType === "savings" ? "savings" : "checking";
      const col = acc === "savings" ? "balance_savings" : "balance_checking";
      const delta = rows.reduce(
        (s, r) => s + (r.direction === "credit" ? r.amount : -r.amount),
        0
      );
      const current = Number((user as any)[col]);
      await sb
        .from("users")
        .update({ [col]: Math.max(0, current + delta) })
        .eq("id", id);
    }

    await sb.from("admin_actions").insert({
      admin_id: admin.id,
      action: "seed_transactions",
      target_type: "user",
      target_id: id,
      metadata: {
        count: rows.length,
        direction: body?.direction || "both",
        accountType: body?.accountType || "checking",
        from: body?.from, to: body?.to,
      },
    });

    return ok({ inserted: rows.length });
  } catch (e) {
    return handleError(e);
  }
}
