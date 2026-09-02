import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyPassword, signSession, setSessionCookie } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return fail(400, "Email and password required");

    const sb = supabaseAdmin();
    const { data: user } = await sb
      .from("users")
      .select("id, email, password_hash, role")
      .ilike("email", email)
      .maybeSingle();

    if (!user || user.role !== "admin") return fail(401, "Invalid credentials");
    const okPass = await verifyPassword(password, user.password_hash);
    if (!okPass) return fail(401, "Invalid credentials");

    const token = signSession({ id: user.id, role: "admin" });
    await setSessionCookie(token);
    return ok({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (e) {
    return handleError(e);
  }
}
