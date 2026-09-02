import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";

/**
 * POST /api/admin/users/:id/balance
 * body: {
 *   account_type: 'checking' | 'savings',
 *   mode: 'set' | 'credit' | 'debit',
 *   amount: number,
 *   note?: string
 * }
 *
 * Admin balance edits are SILENT:
 *  - No ledger/transaction row is written.
 *  - No user notification is sent.
 *  - Only an admin_actions audit row is kept (admin-side only).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const account_type = body?.account_type === "savings" ? "savings" : "checking";
    const mode = body?.mode;
    const amount = Number(body?.amount);
    const note = body?.note ? String(body.note).slice(0, 500) : null;

    if (!["set", "credit", "debit"].includes(mode)) return fail(400, "Invalid mode");
    if (!Number.isFinite(amount) || amount < 0) return fail(400, "Invalid amount");

    const sb = supabaseAdmin();
    const { data: user } = await sb
      .from("users")
      .select("id,balance_checking,balance_savings,role")
      .eq("id", id)
      .single();
    if (!user) return fail(404, "User not found");
    if (user.role === "admin") return fail(400, "Refusing to edit admin balance");

    const col = account_type === "savings" ? "balance_savings" : "balance_checking";
    const current = Number((user as any)[col]);

    let next = current;
    if (mode === "set") next = amount;
    else if (mode === "credit") next = current + amount;
    else next = Math.max(0, current - amount);

    const { error } = await sb.from("users").update({ [col]: next }).eq("id", id);
    if (error) return fail(500, error.message);

    await sb.from("admin_actions").insert({
      admin_id: admin.id,
      action: "edit_balance",
      target_type: "user",
      target_id: id,
      notes: note,
      metadata: { account_type, mode, amount, previous: current, next },
    });

    return ok({ previous: current, next });
  } catch (e) {
    return handleError(e);
  }
}
