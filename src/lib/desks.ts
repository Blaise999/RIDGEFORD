import { supabaseAdmin } from "./supabase/admin";

/**
 * DESKS
 *
 * The bank runs on two tiers. A root admin is the bank and sees everything. A
 * desk admin is a book of business inside it and sees only the customers who
 * arrived through their own referral code.
 *
 * Every customer belongs to exactly one desk — `users.admin_owner_id`. Signups
 * with no code fall to the root admin, so the column is never null and no
 * customer is ever invisible to everyone.
 */

export type Role = "user" | "admin" | "root_admin";

export const isAdmin = (role?: string | null) => role === "admin" || role === "root_admin";
export const isRoot = (role?: string | null) => role === "root_admin";

/** The root admin's id — every unreferred signup lands here. Cached briefly. */
let rootCache: { at: number; id: string | null } = { at: 0, id: null };

export async function rootAdminId(): Promise<string | null> {
  if (rootCache.id && Date.now() - rootCache.at < 60_000) return rootCache.id;
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("users")
    .select("id")
    .eq("role", "root_admin")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  rootCache = { at: Date.now(), id: data?.id || null };
  return rootCache.id;
}

export interface DeskResolution {
  admin_owner_id: string | null;
  referral_code: string | null;
  admin_label: string | null;
  /** True when a code was typed but didn't match anything active. */
  code_rejected: boolean;
}

/**
 * Resolve a signup to a desk.
 *
 * Matching is case-insensitive, so "blaise999" reaches the same desk as
 * "Blaise999". An unknown or exhausted code does NOT fail the signup — the
 * customer still gets an account, it just belongs to head office. Refusing to
 * open an account over a mistyped referral code would be absurd.
 */
export async function resolveDesk(code?: string | null): Promise<DeskResolution> {
  const root = await rootAdminId();
  const typed = (code || "").trim();

  if (!typed) {
    return { admin_owner_id: root, referral_code: null, admin_label: null, code_rejected: false };
  }

  const sb = supabaseAdmin();
  const { data } = await sb
    .from("referral_codes")
    .select("id, code, admin_id, label, active, max_uses, uses")
    .ilike("code", typed)
    .maybeSingle();

  const usable =
    data && data.active && (data.max_uses == null || data.uses < data.max_uses);

  if (!usable) {
    return {
      admin_owner_id: root,
      referral_code: null,
      admin_label: null,
      code_rejected: true,
    };
  }

  return {
    admin_owner_id: data!.admin_id,
    referral_code: data!.code,
    admin_label: data!.label || null,
    code_rejected: false,
  };
}

/** Record the claim and bump the counter. Best-effort: never blocks a signup. */
export async function recordClaim(
  userId: string,
  desk: DeskResolution,
  meta: { ip?: string | null; ua?: string | null }
) {
  if (!desk.referral_code || !desk.admin_owner_id) return;
  try {
    const sb = supabaseAdmin();
    await sb.from("referral_claims").insert({
      user_id: userId,
      code: desk.referral_code,
      admin_id: desk.admin_owner_id,
      ip_address: meta.ip || null,
      user_agent: meta.ua || null,
    });
    const { data: rc } = await sb
      .from("referral_codes")
      .select("id, uses")
      .ilike("code", desk.referral_code)
      .maybeSingle();
    if (rc) {
      await sb.from("referral_codes").update({ uses: (rc.uses || 0) + 1 }).eq("id", rc.id);
    }
  } catch {
    /* the account exists; the counter is not worth failing over */
  }
}

/**
 * Scope a Supabase query to what this admin is allowed to see.
 *
 * Root sees everything. A desk admin sees only their own book. Pass the column
 * that holds the owning desk on whatever table is being queried — it's
 * `admin_owner_id` on users and a joined lookup elsewhere, which is why the
 * caller supplies it rather than this function guessing.
 */
export function scopeToDesk<T extends { eq: (col: string, val: any) => T }>(
  query: T,
  admin: { id: string; role?: string | null },
  column = "admin_owner_id"
): T {
  if (isRoot(admin.role)) return query;
  return query.eq(column, admin.id);
}

/** The set of user ids a desk admin may act on. Root gets null = "all". */
export async function visibleUserIds(admin: {
  id: string;
  role?: string | null;
}): Promise<string[] | null> {
  if (isRoot(admin.role)) return null;
  const sb = supabaseAdmin();
  const { data } = await sb.from("users").select("id").eq("admin_owner_id", admin.id);
  return (data || []).map((r: any) => r.id);
}

/** Guard for single-record admin actions. */
export async function canActOn(
  admin: { id: string; role?: string | null },
  targetUserId: string
): Promise<boolean> {
  if (isRoot(admin.role)) return true;
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("users")
    .select("admin_owner_id")
    .eq("id", targetUserId)
    .maybeSingle();
  return data?.admin_owner_id === admin.id;
}
