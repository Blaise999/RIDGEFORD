import { assertServiceKey } from "./key-guard";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the service role key.
 * Bypasses RLS — only use inside API routes / server components.
 */
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase env missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  // Fail loudly on a swapped key rather than through a stream of misleading
  // RLS errors on unrelated screens.
  assertServiceKey(key);

  if (url.includes("your-project")) {
    throw new Error(
      "SUPABASE_URL is still the placeholder 'your-project.supabase.co'. " +
        "Set it to your real project URL."
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
