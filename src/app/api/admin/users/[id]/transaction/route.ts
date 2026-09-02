import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";
import { notify } from "@/lib/notify";
import { fmtMoney } from "@/lib/utils";
import { sendTransactionPosted, deferEmail } from "@/lib/email";

const CATEGORIES = [
  "Transfer","Income","Bills","Dining","Groceries","Transport","Shopping",
  "Refund","Subscriptions","Housing","Fee","Topup","Salary","Travel","Entertainment","Health",
];

/**
 * POST /api/admin/users/:id/transaction
 * body: {
 *   direction: 'debit' | 'credit',
 *   account_type: 'checking' | 'savings',
 *   amount: number,                          // positive
 *   date?: ISO string,                       // default now
 *   merchant?: string,
 *   counterparty_name?: string,
 *   category?: one of CATEGORIES,
 *   description?: string,
 *   reference?: string,
 *   rail?: 'card' | 'sepa' | 'sepa_instant' | 'internal' | 'swift' | 'salary' | 'topup' | 'refund' | 'adjustment' | 'fee',
 *   adjust_balance?: boolean                 // default true — moves user's balance
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const direction = body?.direction === "credit" ? "credit" : body?.direction === "debit" ? "debit" : null;
    const account_type = body?.account_type === "savings" ? "savings" : "checking";
    const amount = Math.abs(Number(body?.amount));
    const date = body?.date ? new Date(body.date) : new Date();
    const category = CATEGORIES.includes(body?.category) ? body.category : (direction === "credit" ? "Income" : "Shopping");
    const rail = body?.rail || (direction === "credit" ? "topup" : "card");
    const adjustBalance = body?.adjust_balance !== false;

    if (!direction) return fail(400, "direction must be 'debit' or 'credit'");
    if (!Number.isFinite(amount) || amount <= 0) return fail(400, "Invalid amount");
    if (Number.isNaN(date.getTime())) return fail(400, "Invalid date");

    const sb = supabaseAdmin();
    const { data: user } = await sb
      .from("users")
      .select("id,role,balance_checking,balance_savings,email,first_name")
      .eq("id", id)
      .single();
    if (!user) return fail(404, "User not found");
    if (user.role === "admin") return fail(400, "Refusing to insert into admin account");

    // Insert ledger row (with backdated created_at)
    const { data: txn, error: tErr } = await sb
      .from("transactions")
      .insert({
        user_id: id,
        account_type,
        direction,
        amount,
        currency: "EUR",
        rail,
        category,
        counterparty_name: body?.counterparty_name || body?.merchant || "Transaction",
        merchant: body?.merchant || body?.counterparty_name || null,
        description: body?.description || null,
        reference: body?.reference || null,
        status: "posted",
        created_at: date.toISOString(),
      })
      .select("*")
      .single();
    if (tErr || !txn) return fail(500, tErr?.message || "Could not insert");

    // Optionally move the balance
    if (adjustBalance) {
      const col = account_type === "savings" ? "balance_savings" : "balance_checking";
      const current = Number((user as any)[col]);
      const next = direction === "credit" ? current + amount : Math.max(0, current - amount);
      await sb.from("users").update({ [col]: next }).eq("id", id);
    }

    await sb.from("admin_actions").insert({
      admin_id: admin.id,
      action: "inject_transaction",
      target_type: "user",
      target_id: id,
      metadata: { direction, account_type, amount, date: date.toISOString(), category, rail, adjusted_balance: adjustBalance },
    });

    await notify(
      id,
      direction === "credit" ? "credit" : "debit",
      direction === "credit"
        ? `You received ${fmtMoney(amount)}`
        : `${fmtMoney(amount)} was spent`,
      `${body?.merchant || body?.counterparty_name || "Transaction"}${body?.description ? " · " + body.description : ""}`,
      { transaction_id: txn.id }
    );

    // Email the user about the new transaction. Non-blocking via after().
    if (user.email) {
      deferEmail(() =>
        sendTransactionPosted(user.email, {
          firstName: user.first_name || "there",
          direction,
          amount,
          currency: "EUR",
          amountFmt: fmtMoney(amount),
          counterparty: body?.merchant || body?.counterparty_name || undefined,
          category,
          accountType: account_type,
          description: body?.description || undefined,
          reference: body?.reference || undefined,
        })
      );
    }

    return ok({ transaction: txn });
  } catch (e) {
    return handleError(e);
  }
}
