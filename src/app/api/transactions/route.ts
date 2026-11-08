import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";

export async function GET(req: NextRequest) {
  try {
    const u = await requireUser();
    const url = new URL(req.url);
    const dir = url.searchParams.get("direction");     // 'sent' | 'received'
    const account = url.searchParams.get("account");   // 'checking' | 'savings' | 'all'
    const sinceDays = Number(url.searchParams.get("sinceDays") || "0");
    const limit = Math.min(Number(url.searchParams.get("limit") || 200), 500);

    const sb = supabaseAdmin();
    let q = sb
      .from("transactions")
      .select("*")
      .eq("user_id", u.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (dir === "sent") q = q.eq("direction", "debit");
    if (dir === "received") q = q.eq("direction", "credit");
    if (account === "checking" || account === "savings") q = q.eq("account_type", account);
    if (sinceDays > 0) {
      const since = new Date(Date.now() - sinceDays * 86400000).toISOString();
      q = q.gte("created_at", since);
    }

    const { data, error } = await q;
    if (error) return fail(500, error.message);
    const transferIds = [...new Set((data || []).map((txn) => txn.transfer_id).filter(Boolean))];
    let linked: Record<string, any> = {};
    if (transferIds.length) {
      const { data: transfers, error: txErr } = await sb.from("transfers")
        .select("id,fx_quote_id,source_amount,source_currency,recipient_amount,recipient_currency,fx_rate,fx_rate_date,beneficiary_country,status")
        .eq("user_id", u.id).in("id", transferIds);
      if (txErr) return fail(500, txErr.message);
      linked = Object.fromEntries((transfers || []).map((transfer) => [transfer.id, transfer]));
    }
    const enriched = (data || []).map((txn) => ({
      ...txn,
      fx: txn.transfer_id && linked[txn.transfer_id]?.fx_quote_id ? linked[txn.transfer_id] : null,
    }));
    return ok({ transactions: enriched });
  } catch (e) {
    return handleError(e);
  }
}
