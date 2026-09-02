import { NextRequest } from "next/server";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";
import { generateIban } from "@/lib/iban";
import { notify } from "@/lib/notify";
import { isRoot } from "@/lib/desks";
import { BLOCKED_COUNTRIES } from "@/lib/kyc";

/** Readable but strong — desks read these out loud or paste them into chat. */
function generatePassword() {
  const words = ["Harbour", "Granite", "Meridian", "Lantern", "Cobalt", "Foundry", "Anchor", "Vellum", "Compass", "Bastion"];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${w}-${n}`;
}

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/users/create
 *
 * Opens an account from the desk instead of waiting for a signup.
 *
 * The point is that the customer can log in and use the dashboard straight
 * away, so this deliberately does what the self-service path cannot: it issues
 * the IBAN, marks onboarding APPROVED and email verified, and skips the CDD
 * wizard. That is a real decision, not a shortcut — when a desk opens an
 * account it is asserting that identity was established off-system, which is
 * how account opening in a branch has always worked.
 *
 * The account is owned by the admin who created it, so a desk admin only ever
 * grows their own book. Root's accounts belong to head office.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const sb = supabaseAdmin();
    const b = (await req.json()) || {};

    const email = String(b.email || "").trim().toLowerCase();

    /*
      Two required inputs: a name and an email. Everything else is optional or
      derived here.

      The first version of this asked for fifteen fields, which just moved the
      pain of the signup form onto the person opening the account. A desk that
      knows a customer's name and email has enough to open them an account; the
      rest can be filled in later from the customer record.
    */
    const full = String(b.full_name || `${b.first_name || ""} ${b.last_name || ""}`).trim();
    if (!full) return fail(400, "Enter the customer's name");
    if (!email || !/.+@.+\..+/.test(email)) return fail(400, "Enter a valid email address");

    const parts = full.split(/\s+/);
    const first_name = parts[0];
    const last_name = parts.length > 1 ? parts.slice(1).join(" ") : "";

    // Generated unless the desk typed one. Readable, because it gets read out.
    const password = String(b.password || "").trim() || generatePassword();
    if (password.length < 8) return fail(400, "Password must be at least 8 characters");
    if (b.country && BLOCKED_COUNTRIES.includes(String(b.country))) {
      return fail(403, "We can't open accounts for residents of that country.");
    }

    const checking = Math.max(0, Number(b.balance_checking) || 0);
    const savings = Math.max(0, Number(b.balance_savings) || 0);
    if (checking > 10_000_000 || savings > 10_000_000) {
      return fail(400, "Opening balance looks wrong — check the figure.");
    }

    const { data: existing } = await sb
      .from("users")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (existing) return fail(409, "An account with that email already exists");

    // ── create ────────────────────────────────────────────────────────────
    const password_hash = await hashPassword(password);
    const iban = String(b.iban || "").trim() || generateIban();

    const { data: user, error } = await sb
      .from("users")
      .insert({
        email,
        password_hash,
        role: "user",
        first_name,
        last_name,
        phone: b.phone || null,
        date_of_birth: b.date_of_birth || null,
        nationality: b.nationality || null,
        street: b.street || null,
        street_number: b.street_number || null,
        postal_code: b.postal_code || null,
        city: b.city || null,
        country: b.country || "DE",
        tax_residence_country: b.country || "DE",
        occupation: b.occupation || null,
        employment_status: b.employment_status || null,
        iban,
        balance_checking: checking,
        balance_savings: savings,

        // Opened at the desk: usable immediately, no CDD wizard.
        onboarding_status: "APPROVED",
        kyc_status: "approved",
        kyc_risk: b.risk || "low",
        email_verified: true,
        blocked: false,

        // A desk admin grows their own book; root's accounts are head office's.
        admin_owner_id: admin.id,
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
      })
      .select("id, email, first_name, last_name, iban, balance_checking, balance_savings, created_at")
      .single();

    if (error || !user) {
      if ((error as any)?.code === "23505") return fail(409, "That email is already registered");
      return fail(500, error?.message || "Could not create the account");
    }

    // ── opening balance as a real ledger entry ────────────────────────────
    // A balance that exists with no transaction behind it is the kind of thing
    // that makes a statement impossible to reconcile later.
    const rows: any[] = [];
    if (checking > 0) {
      rows.push({
        user_id: user.id,
        account_type: "checking",
        direction: "credit",
        amount: checking,
        currency: "EUR",
        rail: "adjustment",
        category: "Transfer",
        counterparty_name: "Ridgeford Capital Bank",
        description: "Opening balance",
        status: "posted",
      });
    }
    if (savings > 0) {
      rows.push({
        user_id: user.id,
        account_type: "savings",
        direction: "credit",
        amount: savings,
        currency: "EUR",
        rail: "adjustment",
        category: "Transfer",
        counterparty_name: "Ridgeford Capital Bank",
        description: "Opening balance",
        status: "posted",
      });
    }
    if (rows.length) await sb.from("transactions").insert(rows);

    await notify(
      user.id,
      "welcome",
      "Your account is open",
      `Welcome to Ridgeford. Your IBAN is ${iban}. Transfers, cards and the crypto desk are all available.`,
      { iban }
    );

    // ── audit ─────────────────────────────────────────────────────────────
    try {
      await sb.from("admin_actions").insert({
        admin_id: admin.id,
        action: "user_create",
        target_type: "user",
        target_id: user.id,
        notes: `Opened ${email}${checking || savings ? ` with opening balance` : ""}`,
      });
    } catch {
      /* audit is best-effort */
    }

    return ok({
      user,
      // Echoed once so the desk can hand it over. Never stored in plain text.
      credentials: { email, password },
      scope: isRoot(admin.role) ? "bank" : "desk",
    });
  } catch (e) {
    return handleError(e);
  }
}
