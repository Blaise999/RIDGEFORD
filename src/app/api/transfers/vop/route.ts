import { NextRequest } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";
import { verifyIban, comparePayeeName, normalizeIban, VOP_COPY } from "@/lib/iban";

export const dynamic = "force-dynamic";

/**
 * POST /api/transfers/vop — Verification of Payee.
 *
 * Regulation (EU) 2024/886 Art. 5c: before a euro credit transfer is
 * authorised, the payer is told whether the name they typed matches the account
 * holder behind the IBAN. Free of charge, on standard and instant transfers
 * alike, anywhere in the EEA.
 *
 * It answers match / close match / no match / not supported — and it never
 * blocks. The payer decides.
 */
export async function POST(req: NextRequest) {
  try {
    const u = await requireActiveUser();
    const { iban, name } = (await req.json()) || {};

    const verdict = verifyIban(String(iban || ""));
    if (!verdict.ok) return fail(400, verdict.reason);

    const sb = supabaseAdmin();
    const normalized = normalizeIban(String(iban));

    // Ridgeford-held accounts answer from our own book. A real deployment
    // routes anything else through the EPC VoP scheme via the receiving PSP;
    // outside that, "not supported" is the correct and honest answer.
    const { data: onFile } = await sb
      .from("users")
      .select("first_name, last_name")
      .eq("iban", normalized)
      .maybeSingle();

    const result = onFile
      ? comparePayeeName(String(name || ""), `${onFile.first_name || ""} ${onFile.last_name || ""}`)
      : "not_supported";

    return ok({
      result,
      copy: VOP_COPY[result],
      country: verdict.country.code,
      country_name: verdict.country.name,
      instant: verdict.instant,
      note: verdict.note,
      formatted: verdict.formatted,
      // Never echo the name we hold — that would turn a fraud control into an
      // account-name lookup service.
      checked_at: new Date().toISOString(),
    });
  } catch (e) {
    return handleError(e);
  }
}
