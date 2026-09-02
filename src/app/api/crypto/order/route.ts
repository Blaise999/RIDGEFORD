import { NextRequest } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyOtp } from "@/lib/otp";
import { notify } from "@/lib/notify";
import { ok, fail, handleError } from "@/lib/http";
import { genReference, fmtMoney } from "@/lib/utils";
import {
  DESK,
  buildQuote,
  fmtCoin,
  getAsset,
  getMarket,
  round2,
  validateAddress,
} from "@/lib/crypto";

export const dynamic = "force-dynamic";

/**
 * POST /api/crypto/order
 *
 * Converts EUR ⇄ crypto against the Ridgeford desk.
 *
 * body: {
 *   asset_id, side: "buy" | "sell",
 *   eur?            // buy: how many euros to convert
 *   quantity?       // sell: how much coin to liquidate
 *   account_type?   // "checking" (default) | "savings"
 *   destination?    // "hold"  -> credited to the customer's crypto bar
 *                   // "withdraw" -> bought and immediately queued to an address
 *   address?, memo?, note?, otp?
 * }
 *
 * Guards, in order: KYC gate → balance / holding check → live re-price with a
 * 1,5 % slippage tolerance → step-up OTP for large or outbound orders.
 */
export async function POST(req: NextRequest) {
  try {
    const u = await requireActiveUser();
    const sb = supabaseAdmin();
    const body = (await req.json()) || {};

    const side: "buy" | "sell" = body.side === "sell" ? "sell" : "buy";
    const assetId = String(body.asset_id || "");
    const destination: "hold" | "withdraw" =
      body.destination === "withdraw" ? "withdraw" : "hold";
    const accountType = body.account_type === "savings" ? "savings" : "checking";

    if (!assetId) return fail(400, "Missing asset");

    const [asset, market] = await Promise.all([getAsset(assetId), getMarket(assetId)]);
    if (!asset || !market) return fail(404, "We don't trade that asset");

    // ── customer + KYC gate ────────────────────────────────────────────────
    const { data: me } = await sb
      .from("users")
      .select("id, email, first_name, balance_checking, balance_savings, blocked, onboarding_status")
      .eq("id", u.id)
      .single();
    if (!me) return fail(500, "Account not found");
    if (me.blocked) return fail(403, "This account is suspended.");
    if (me.onboarding_status && me.onboarding_status !== "APPROVED") {
      return fail(403, "Complete identity verification before trading digital assets.");
    }

    // ── price + size ───────────────────────────────────────────────────────
    const quote = buildQuote(market, side, {
      eur: Number(body.eur),
      quantity: Number(body.quantity),
    });

    if (side === "buy") {
      if (!Number.isFinite(quote.eur_amount) || quote.eur_amount <= 0) {
        return fail(400, "Enter an amount in euros");
      }
      if (quote.eur_amount < DESK.MIN_ORDER_EUR) {
        return fail(400, `Minimum order is ${DESK.MIN_ORDER_EUR} €`);
      }
      if (quote.eur_amount > DESK.MAX_ORDER_EUR) {
        return fail(400, `Maximum order is ${DESK.MAX_ORDER_EUR.toLocaleString("en-GB")} €`);
      }
    } else if (quote.quantity <= 0) {
      return fail(400, "Enter a quantity to sell");
    }

    // Client-side quotes expire; refuse to fill if the market ran away.
    const clientPrice = Number(body.quoted_unit_price);
    if (Number.isFinite(clientPrice) && clientPrice > 0) {
      const slip = Math.abs(quote.unit_price_eur - clientPrice) / clientPrice;
      if (slip > 0.015) {
        return fail(409, "The price moved while you were confirming. Here's a fresh quote.", {
          quote,
        });
      }
    }

    // ── step-up authorisation ──────────────────────────────────────────────
    const needsOtp =
      destination === "withdraw" || quote.eur_amount >= DESK.OTP_THRESHOLD_EUR;
    if (needsOtp) {
      const code = String(body.otp || "").replace(/\D/g, "");
      if (code.length !== 6) {
        return fail(401, "Enter the 6-digit code we emailed you to authorise this order.", {
          otp_required: true,
          reason: "missing",
        });
      }
      const valid = await verifyOtp(me.email, code, "crypto_withdrawal");
      if (!valid) {
        // An unexplained 401 on a payment screen is the worst possible error,
        // so say which of the two it is.
        const hint = !process.env.RESEND_API_KEY
          ? " No mail provider is configured on this deployment, so no code could have been sent."
          : "";
        return fail(401, `That authorisation code is invalid or has expired.${hint}`, {
          otp_required: true,
          reason: "invalid",
        });
      }
    }

    // ── withdrawal pre-flight (validate BEFORE money moves) ────────────────
    let address = "";
    let memo: string | null = null;
    if (destination === "withdraw") {
      address = String(body.address || "").trim();
      const addrErr = validateAddress(asset, address);
      if (addrErr) return fail(400, addrErr);
      if (asset.needs_memo && !String(body.memo || "").trim()) {
        return fail(400, `${asset.network} transfers need a destination tag / memo.`);
      }
      memo = String(body.memo || "").trim() || null;

      const netFee = Number(asset.network_fee) || 0;
      if (quote.quantity <= netFee) {
        return fail(
          400,
          `Order too small to send on-chain — the ${asset.network} network fee alone is ${fmtCoin(netFee, asset.symbol)}.`
        );
      }
    }

    const balance =
      accountType === "savings"
        ? Number(me.balance_savings) || 0
        : Number(me.balance_checking) || 0;

    // ── existing position ──────────────────────────────────────────────────
    const { data: holding } = await sb
      .from("crypto_holdings")
      .select("*")
      .eq("user_id", u.id)
      .eq("asset_id", assetId)
      .maybeSingle();

    if (side === "buy" && balance < quote.eur_amount) {
      return fail(400, `Not enough money in your ${accountType} account.`);
    }
    if (side === "sell") {
      const held = Number(holding?.quantity) || 0;
      if (held <= 0) return fail(400, `You don't hold any ${asset.symbol}.`);
      if (quote.quantity > held + 1e-12) {
        return fail(400, `You only hold ${fmtCoin(held, asset.symbol)}.`);
      }
    }

    // ── move the money ─────────────────────────────────────────────────────
    const balanceField = accountType === "savings" ? "balance_savings" : "balance_checking";
    const newBalance =
      side === "buy"
        ? round2(balance - quote.eur_amount)
        : round2(balance + quote.eur_amount);

    const { error: balErr } = await sb
      .from("users")
      .update({ [balanceField]: newBalance })
      .eq("id", u.id);
    if (balErr) return fail(500, "Could not settle the cash leg of this order.");

    const reference_id = genReference(side === "buy" ? "CB" : "CS");

    // ── position ───────────────────────────────────────────────────────────
    let positionError: string | null = null;
    if (side === "buy") {
      const nextQty = (Number(holding?.quantity) || 0) + quote.quantity;
      const nextInvested = round2((Number(holding?.invested_eur) || 0) + quote.eur_amount);
      const { error } = await sb.from("crypto_holdings").upsert(
        {
          user_id: u.id,
          asset_id: assetId,
          quantity: nextQty,
          invested_eur: nextInvested,
          pinned: holding?.pinned ?? true,
        },
        { onConflict: "user_id,asset_id" }
      );
      positionError = error?.message || null;
    } else {
      const held = Number(holding?.quantity) || 0;
      const invested = Number(holding?.invested_eur) || 0;
      const share = held > 0 ? quote.quantity / held : 1;
      const nextQty = Math.max(0, held - quote.quantity);
      const nextInvested = round2(Math.max(0, invested - invested * share));
      const { error } = await sb
        .from("crypto_holdings")
        .update({ quantity: nextQty, invested_eur: nextInvested })
        .eq("user_id", u.id)
        .eq("asset_id", assetId);
      positionError = error?.message || null;
    }

    if (positionError) {
      // Roll the cash leg back — never leave the customer short.
      await sb.from("users").update({ [balanceField]: balance }).eq("id", u.id);
      return fail(500, "Could not book the position. Nothing was charged.");
    }

    // ── order record ───────────────────────────────────────────────────────
    const { data: order } = await sb
      .from("crypto_orders")
      .insert({
        reference_id,
        user_id: u.id,
        asset_id: assetId,
        side,
        account_type: accountType,
        eur_amount: quote.eur_amount,
        fee_eur: quote.fee_eur,
        spread_bps: quote.spread_bps,
        unit_price_eur: quote.unit_price_eur,
        quantity: quote.quantity,
        status: "filled",
        destination,
      })
      .select("*")
      .single();

    // ── ledger row so it appears in Transactions like everything else ──────
    await sb.from("transactions").insert({
      user_id: u.id,
      account_type: accountType,
      direction: side === "buy" ? "debit" : "credit",
      amount: quote.eur_amount,
      currency: "EUR",
      rail: side === "buy" ? "crypto_buy" : "crypto_sell",
      category: "Crypto",
      counterparty_name: `Ridgeford Crypto Desk · ${asset.symbol}`,
      merchant: asset.name,
      description:
        side === "buy"
          ? `Bought ${fmtCoin(quote.quantity, asset.symbol)} @ ${quote.unit_price_eur.toFixed(2)} €`
          : `Sold ${fmtCoin(quote.quantity, asset.symbol)} @ ${quote.unit_price_eur.toFixed(2)} €`,
      reference: reference_id,
      status: "posted",
    });

    // ── optional: queue the coin straight out to an address ────────────────
    let withdrawal: any = null;
    if (destination === "withdraw") {
      const netFee = Number(asset.network_fee) || 0;
      const sendQty = Math.max(0, quote.quantity - netFee);

      const { data: w, error: wErr } = await sb
        .from("crypto_withdrawals")
        .insert({
          reference_id: genReference("CW"),
          user_id: u.id,
          asset_id: assetId,
          order_id: order?.id || null,
          quantity: sendQty,
          network_fee: netFee,
          unit_price_eur: market.price_eur,
          eur_value: round2(sendQty * market.price_eur),
          network: asset.network,
          address,
          memo,
          note: String(body.note || "").trim() || null,
          status: "pending_admin",
        })
        .select("*")
        .single();

      if (wErr) {
        // The buy stands; tell the customer the coin is in their bar instead.
        await notify(
          u.id,
          "crypto_buy",
          `${asset.symbol} purchased`,
          `We couldn't queue the on-chain transfer, so ${fmtCoin(quote.quantity, asset.symbol)} is sitting in your Ridgeford crypto bar. You can send it from there.`,
          { reference: reference_id }
        );
        return ok({
          order,
          quote,
          asset,
          balance: newBalance,
          withdrawal: null,
          warning: "Purchase completed, but the on-chain transfer could not be queued.",
        });
      }

      withdrawal = w;

      // The coin is held in escrow while compliance reviews the address.
      const { data: h2 } = await sb
        .from("crypto_holdings")
        .select("quantity")
        .eq("user_id", u.id)
        .eq("asset_id", assetId)
        .maybeSingle();
      await sb
        .from("crypto_holdings")
        .update({ quantity: Math.max(0, (Number(h2?.quantity) || 0) - quote.quantity) })
        .eq("user_id", u.id)
        .eq("asset_id", assetId);

      await notify(
        u.id,
        "crypto_send_submitted",
        `${asset.symbol} withdrawal submitted`,
        `${fmtCoin(sendQty, asset.symbol)} to ${shorten(address)} is pending compliance review. Reference ${w.reference_id}.`,
        { reference: w.reference_id, asset: asset.symbol }
      );
    } else {
      await notify(
        u.id,
        side === "buy" ? "crypto_buy" : "crypto_sell",
        side === "buy" ? `${asset.symbol} purchased` : `${asset.symbol} sold`,
        side === "buy"
          ? `${fmtCoin(quote.quantity, asset.symbol)} added to your crypto bar for ${fmtMoney(quote.eur_amount)}.`
          : `${fmtCoin(quote.quantity, asset.symbol)} sold for ${fmtMoney(quote.eur_amount)}, settled to your ${accountType} account.`,
        { reference: reference_id, asset: asset.symbol }
      );
    }

    return ok({ order, quote, asset, withdrawal, balance: newBalance });
  } catch (e) {
    return handleError(e);
  }
}

function shorten(addr: string) {
  return addr.length > 16 ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : addr;
}
