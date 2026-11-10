import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "./supabase/admin";
import type { SessionUser } from "./auth-types";

// Re-export so existing server-side imports `from "@/lib/auth"` keep working.
export type { SessionUser };

const COOKIE_NAME = "rdgf_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

function jwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return s;
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function signSession(user: { id: string; role: "user" | "admin" }) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    jwtSecret(),
    { expiresIn: COOKIE_MAX_AGE }
  );
}

export function verifySession(
  token: string
): { sub: string; role: "user" | "admin" } | null {
  try {
    const p = jwt.verify(token, jwtSecret()) as any;
    if (!p?.sub) return null;

    return {
      sub: String(p.sub),
      role: p.role === "admin" ? "admin" : "user",
    };
  } catch {
    return null;
  }
}

// cookies() is sync in Next 14, async (Promise) in Next 15. Support both.
async function cookieStore() {
  const c = cookies() as any;
  return typeof c?.then === "function" ? await c : c;
}

export async function setSessionCookie(token: string) {
  const c = await cookieStore();

  c.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const c = await cookieStore();
  c.delete(COOKIE_NAME);
}

export async function getSessionToken() {
  const c = await cookieStore();
  return c.get(COOKIE_NAME)?.value || null;
}

/** Loads the authenticated user or returns null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const payload = verifySession(token);
  if (!payload) return null;

  const sb = supabaseAdmin();

  const { data, error } = await sb
    .from("users")
    .select("id,email,role,first_name,last_name,avatar_url,blocked")
    .eq("id", payload.sub)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email,
    role: data.role === "root_admin" ? "root_admin" : data.role === "admin" ? "admin" : "user",
    first_name: data.first_name ?? null,
    last_name: data.last_name ?? null,
    avatar_url: data.avatar_url ?? null,
    blocked: Boolean(data.blocked),
  };
}

/**
 * A narrow exception for support chat. Suspended customers must be able to
 * view, send and upload support messages while everything else is locked.
 */
export async function requireSupportUser() {
  const u = await getCurrentUser();
  if (!u) throw new AuthError(401, "Not authenticated");
  if (u.role !== "user") throw new AuthError(403, "Customer only");
  return u;
}

/**
 * Viewing-only authentication for read-only GET handlers.
 * A restriction does not hide a customer's own balances, transactions,
 * cards, or history. Never use this helper for mutating endpoints.
 */
export async function requireViewingUser() {
  return requireSupportUser();
}

/**
 * Require an active session for customer mutations.
 * All payment and account-changing endpoints must use this, not
 * requireViewingUser. The database blocked flag is checked per request.
 */
export async function requireUser() {
  const u = await requireSupportUser();
  if (u.blocked) {
    throw new AuthError(403, "Account restricted. Viewing is available, but banking actions are disabled. Please contact Ridgeford Support Team.");
  }
  return u;
}

/** Active and normal account sessions share the same protection. */
export async function requireActiveUser() {
  return requireUser();
}

/** Require admin. */
export async function requireAdmin() {
  const u = await getCurrentUser();
  if (!u) throw new AuthError(401, "Not authenticated");

  // All admins, including root, may enter the console. Individual API routes
  // restrict access to customers owned by the current admin's desk.
  if (u.role !== "admin" && u.role !== "root_admin") {
    throw new AuthError(403, "Admin only");
  }
  if (u.blocked) throw new AuthError(403, "Admin account is suspended");

  return u;
}

export class AuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
