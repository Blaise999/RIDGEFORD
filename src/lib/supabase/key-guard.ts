/**
 * KEY GUARD
 *
 * Supabase keys are JWTs with a `role` claim: `anon` for the publishable key,
 * `service_role` for the secret one. They look identical to the eye, sit next
 * to each other in the dashboard, and swapping them fails in ways that never
 * name the real problem:
 *
 *   · service key in SUPABASE_SERVICE_ROLE_KEY  → correct
 *   · anon key there instead                    → every server query runs as
 *     `anon`, RLS denies it, and you get "new row violates row-level security
 *     policy" on signup and a bare 401 on OTP verification, because the code
 *     row simply cannot be read back
 *   · service key in NEXT_PUBLIC_SUPABASE_ANON_KEY → it is bundled into the
 *     client JavaScript and handed to every visitor. Full database access,
 *     RLS bypassed, for anyone who opens devtools
 *
 * That last one is a live incident, not a misconfiguration. So we check the
 * claim at startup and refuse to continue rather than failing quietly hours
 * later on an unrelated screen.
 */

export type KeyRole = "anon" | "service_role" | "unknown";

/** Read the `role` claim without verifying the signature — we only classify. */
export function roleOf(key?: string | null): KeyRole {
  if (!key) return "unknown";

  // New-style keys announce themselves in the prefix.
  if (key.startsWith("sb_secret_")) return "service_role";
  if (key.startsWith("sb_publishable_")) return "anon";

  const parts = key.split(".");
  if (parts.length !== 3) return "unknown";
  try {
    const json = Buffer.from(
      parts[1].replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf8");
    const role = JSON.parse(json)?.role;
    return role === "service_role" || role === "anon" ? role : "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Called by the server client. Throws on a swap, because continuing produces
 * a stream of misleading RLS errors instead of one clear one.
 */
export function assertServiceKey(key?: string | null) {
  const role = roleOf(key);

  if (role === "anon") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY contains the ANON / publishable key.\n" +
        "Every server query will run as `anon` and be denied by RLS — this is " +
        "what causes 'new row violates row-level security policy' on signup and " +
        "a 401 on OTP verification.\n" +
        "Fix: Supabase → Settings → API Keys → copy the SECRET / service_role key."
    );
  }

  if (role === "unknown") {
    console.warn(
      "[supabase] SUPABASE_SERVICE_ROLE_KEY does not look like a Supabase key. " +
        "If requests start failing with RLS errors, check it first."
    );
  }
}

/**
 * Called by the browser client. A service key here is an exposure, so we
 * refuse to build the client at all — better a broken chat widget than a
 * public database.
 */
export function assertPublicKeySafe(key?: string | null): boolean {
  if (roleOf(key) === "service_role") {
    console.error(
      "🚨 SECURITY: NEXT_PUBLIC_SUPABASE_ANON_KEY contains the SERVICE ROLE key.\n" +
        "NEXT_PUBLIC_ variables are compiled into the client bundle, so this key " +
        "is being served to every visitor — full database access, RLS bypassed.\n" +
        "1. Rotate the service-role key in Supabase immediately.\n" +
        "2. Put the PUBLISHABLE / anon key in NEXT_PUBLIC_SUPABASE_ANON_KEY.\n" +
        "Realtime is disabled until this is corrected."
    );
    return false;
  }
  return true;
}
