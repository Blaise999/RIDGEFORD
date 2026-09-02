import { NextRequest } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyOtp } from "@/lib/otp";
import { notify } from "@/lib/notify";
import { ok, fail, handleError } from "@/lib/http";
import { genReference } from "@/lib/utils";
import { fmtCoin, getAsset, getMarket, round2, validateAddress } from "@/lib/crypto";

export const dynamic = "force-dynamic";

/**
 * POST /api/crypto/send — move coin the customer already holds to an
 * external address.
 *
 * body: { asset_id, quantity? | eur?, address, memo?, note?, otp }
 *
 * The quantity is debited from the position immediately and held in escrow;
 * compliance approves the address before anything is broadcast. Rejections
 * return the coin to the customer's bar untouched.
 */
export async function POST(req: NextRequest) {
  try {
    const u = await requireActiveUser();
    const sb = supabaseAdmin();
    const body = (await req.json()) || {};

    const assetId = String(body.asset_id || "");
    if (!assetId) return fail(400, "Missing asset");

    const [asset, market] = await Promise.all([getAsset(assetId), getMarket(assetId)]);
    if (!asset || !market) return fail(404, "We don't support that asset");

    const { data: me } = await sb
      .from("users")
      .select("id, email, blocked, onboarding_status")
      .eq("id", u.id)
      .single();
    if (!me) return fail(500, "Account not found");
    if (me.blocked) return fail(403, "This account is suspended.");
    if (me.onboarding_status && me.onboarding_status !== "APPROVED") {
      return fail(403, "Complete identity verification before moving digital assets.");
    }

    // ── destination ────────────────────────────────────────────────────────
    const address = String(body.address || "").trim();
    const addrErr = validateAddress(asset, address);
    if (addrErr) return fail(400, addrErr);

    const memo = String(body.memo || "").trim() || null;
    if (asset.needs_memo && !memo) {
      return fail(400, `${asset.network} transfers need a destination tag / memo.`);
    }

    // ── size: either a coin quantity or a euro value ───────────────────────
    const { data: holding } = await sb
      .from("crypto_holdings")
      .select("*")
      .eq("user_id", u.id)
      .eq("asset_id", assetId)
      .maybeSingle();

    const held = Number(holding?.quantity) || 0;
    if (held <= 0) return fail(400, `You don't hold any ${asset.symbol}.`);

    let quantity = Number(body.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      const eur = Number(body.eur);
      if (Number.isFinite(eur) && eur > 0 && market.price_eur > 0) {
        quantity = eur / market.price_eur;
      }
    }
    if (body.max === true) quantity = held;
    if (!Number.isFinite(quantity) || quantity <= 0) return fail(400, "Enter an amount to send");
    if (quantity > held + 1e-12) return fail(400, `You only hold ${fmtCoin(held, asset.symbol)}.`);

    const networkFee = Number(asset.network_fee) || 0;
    const netQty = round10(quantity - networkFee);
    if (netQty <= 0) {
      return fail(
        400,
        `That's below the ${asset.network} network fee of ${fmtCoin(networkFee, asset.symbol)}.`
      );
    }

    // ── step-up authorisation — always, for anything leaving the bank ─────
    const code = String(body.otp || "").replace(/\D/g, "");
    if (code.length !== 6) {
      return fail(401, "Enter the 6-digit code we emailed you to authorise this withdrawal.", {
        otp_required: true,
      });
    }
    const valid = await verifyOtp(me.email, code, "crypto_withdrawal");
    if (!valid) {
      return fail(401, "That authorisation code is invalid or has expired.", { otp_required: true });
    }

    // ── escrow the coin ────────────────────────────────────────────────────
    const remaining = round10(held - quantity);
    const invested = Number(holding?.invested_eur) || 0;
    const nextInvested = round2(Math.max(0, invested - invested * (held > 0 ? quantity / held : 1)));

    const { error: hErr } = await sb
      .from("crypto_holdings")
      .update({ quantity: remaining, invested_eur: nextInvested })
      .eq("user_id", u.id)
      .eq("asset_id", assetId);
    if (hErr) return fail(500, "Could not reserve the funds for this withdrawal.");

    const reference_id = genReference("CW");
    const { data: w, error: wErr } = await sb
      .from("crypto_withdrawals")
      .insert({
        reference_id,
        user_id: u.id,
        asset_id: assetId,
        quantity: netQty,
        network_fee: networkFee,
        unit_price_eur: market.price_eur,
        eur_value: round2(netQty * market.price_eur),
        network: asset.network,
        address,
        memo,
        note: String(body.note || "").trim() || null,
        status: "pending_admin",
      })
      .select("*")
      .single();

    if (wErr || !w) {
      // put the coin back
      await sb
        .from("crypto_holdings")
        .update({ quantity: held, invested_eur: invested })
        .eq("user_id", u.id)
        .eq("asset_id", assetId);
      return fail(500, "Could not queue the withdrawal. Nothing was deducted.");
    }

    await notify(
      u.id,
      "crypto_send_submitted",
      `${asset.symbol} withdrawal submitted`,
      `${fmtCoin(netQty, asset.symbol)} to ${shorten(address)} is pending compliance review. Reference ${reference_id}.`,
      { reference: reference_id, asset: asset.symbol }
    );

    return ok({ withdrawal: w, asset, remaining });
  } catch (e) {
    return handleError(e);
  }
}

function round10(n: number) {
  return Math.max(0, Math.floor((Number(n) || 0) * 1e10) / 1e10);
}

function shorten(addr: string) {
  return addr.length > 16 ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : addr;
}
