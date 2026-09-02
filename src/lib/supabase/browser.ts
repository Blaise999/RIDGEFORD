"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertPublicKeySafe } from "./key-guard";

/**
 * Browser Supabase client — anon key, used ONLY to subscribe to Realtime
 * row changes on the support tables. All authorised reads/writes still go
 * through the server API routes (service-role key).
 *
 * If the anon env vars are not configured, this returns null and the chat
 * UI transparently falls back to polling.
 */
let cached: SupabaseClient | null | undefined;

export function supabaseBrowser(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // A service-role key here is served to every visitor. Refuse to build the
  // client — a broken chat widget beats a public database.
  if (!assertPublicKeySafe(anon)) {
    cached = null;
    return cached;
  }

  // The placeholder URL produces the confusing
  // `wss://your-project.supabase.co/realtime/...` websocket failure.
  if (url && url.includes("your-project")) {
    console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL is still the placeholder value.");
    cached = null;
    return cached;
  }

  if (!url || !anon) {
    cached = null;
    return cached;
  }

  cached = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 5 } },
  });
  return cached;
}

export const REALTIME_ENABLED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
