import { NextRequest } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";
import { notify } from "@/lib/notify";
import { fmtMoney } from "@/lib/utils";

/**
 * POST /api/spaces/:id
 * body: { action: 'deposit' | 'withdraw', amount: number }
 *
 * Moves money between the user's checking balance and the space's balance.
 * Withdraw is blocked if `locked_until` is in the future.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const u = await requireActiveUser();
    const { id } = params;
    const body = await req.json();
    const action = body?.action;
    const amount = Number(body?.amount);

    if (!["deposit", "withdraw"].includes(action)) {
      return fail(400, "Invalid action");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return fail(400, "Invalid amount");
    }

    const sb = supabaseAdmin();

    const { data: space, error: spaceErr } = await sb
      .from("spaces")
      .select("*")
      .eq("id", id)
      .eq("user_id", u.id)
      .single();

    if (spaceErr || !space) return fail(404, "Space not found");

    const { data: user, error: userErr } = await sb
      .from("users")
      .select("balance_checking")
      .eq("id", u.id)
      .single();

    if (userErr || !user) return fail(500, "Account not found");

    const checking = Number(user.balance_checking);
    const spaceBalance = Number(space.balance);

    if (action === "deposit") {
      if (checking < amount) return fail(400, "Insufficient checking balance");

      const { error: userUpdateErr } = await sb
        .from("users")
        .update({ balance_checking: checking - amount })
        .eq("id", u.id);

      if (userUpdateErr) return fail(500, userUpdateErr.message);

      const { error: spaceUpdateErr } = await sb
        .from("spaces")
        .update({ balance: spaceBalance + amount })
        .eq("id", id)
        .eq("user_id", u.id);

      if (spaceUpdateErr) return fail(500, spaceUpdateErr.message);

      const { error: txErr } = await sb.from("transactions").insert({
        user_id: u.id,
        account_type: "checking",
        direction: "debit",
        amount,
        currency: "EUR",
        rail: "topup",
        category: "Topup",
        counterparty_name: `Space: ${space.name}`,
        merchant: space.name,
        description: `Moved to ${space.name}`,
        status: "posted",
      });

      if (txErr) return fail(500, txErr.message);

      await notify(
        u.id,
        "info",
        `Moved ${fmtMoney(amount)} to ${space.name}`,
        `${space.emoji || "🎯"} Space balance: ${fmtMoney(spaceBalance + amount)}`
      );

      return ok({ balance: spaceBalance + amount });
    }

    if (space.locked_until && new Date(space.locked_until).getTime() > Date.now()) {
      return fail(
        403,
        `This space is locked until ${new Date(space.locked_until).toLocaleDateString("de-DE")}. You can't withdraw before then.`
      );
    }

    if (spaceBalance < amount) return fail(400, "Insufficient space balance");

    const { error: spaceUpdateErr } = await sb
      .from("spaces")
      .update({ balance: spaceBalance - amount })
      .eq("id", id)
      .eq("user_id", u.id);

    if (spaceUpdateErr) return fail(500, spaceUpdateErr.message);

    const { error: userUpdateErr } = await sb
      .from("users")
      .update({ balance_checking: checking + amount })
      .eq("id", u.id);

    if (userUpdateErr) return fail(500, userUpdateErr.message);

    const { error: txErr } = await sb.from("transactions").insert({
      user_id: u.id,
      account_type: "checking",
      direction: "credit",
      amount,
      currency: "EUR",
      rail: "topup",
      category: "Topup",
      counterparty_name: `Space: ${space.name}`,
      merchant: space.name,
      description: `Moved from ${space.name}`,
      status: "posted",
    });

    if (txErr) return fail(500, txErr.message);

    await notify(
      u.id,
      "info",
      `Moved ${fmtMoney(amount)} from ${space.name}`,
      `${space.emoji || "🎯"} Space balance: ${fmtMoney(Math.max(0, spaceBalance - amount))}`
    );

    return ok({ balance: spaceBalance - amount });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const u = await requireActiveUser();
    const { id } = params;
    const sb = supabaseAdmin();

    const { data: space, error: spaceErr } = await sb
      .from("spaces")
      .select("*")
      .eq("id", id)
      .eq("user_id", u.id)
      .single();

    if (spaceErr || !space) return fail(404, "Space not found");

    if (space.locked_until && new Date(space.locked_until).getTime() > Date.now()) {
      return fail(403, "Space is locked and can't be deleted until after the lock date.");
    }

    const bal = Number(space.balance);

    if (bal > 0) {
      const { data: user, error: userErr } = await sb
        .from("users")
        .select("balance_checking")
        .eq("id", u.id)
        .single();

      if (userErr || !user) return fail(500, "Account not found");

      const { error: updateErr } = await sb
        .from("users")
        .update({ balance_checking: Number(user.balance_checking) + bal })
        .eq("id", u.id);

      if (updateErr) return fail(500, updateErr.message);
    }

    const { error: deleteErr } = await sb
      .from("spaces")
      .delete()
      .eq("id", id)
      .eq("user_id", u.id);

    if (deleteErr) return fail(500, deleteErr.message);

    return ok();
  } catch (e) {
    return handleError(e);
  }
}