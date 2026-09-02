import { NextRequest } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";

export async function GET() {
  try {
    const u = await requireActiveUser();
    const sb = supabaseAdmin();

    const { data, error } = await sb
      .from("spaces")
      .select("*")
      .eq("user_id", u.id)
      .order("created_at", { ascending: false });

    if (error) return fail(500, error.message);

    return ok({ spaces: data || [] });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const u = await requireActiveUser();
    const { name, goal_amount, target_date, locked_until, emoji } =
      await req.json();

    if (!name || !String(name).trim()) {
      return fail(400, "Name required");
    }

    const sb = supabaseAdmin();

    const { data, error } = await sb
      .from("spaces")
      .insert({
        user_id: u.id,
        name: String(name).trim().slice(0, 40),
        goal_amount: Number(goal_amount) > 0 ? Number(goal_amount) : 0,
        target_date: target_date || null,
        locked_until: locked_until || null,
        emoji: emoji || "🎯",
        balance: 0,
      })
      .select("*")
      .single();

    if (error) return fail(500, error.message);

    return ok({ space: data });
  } catch (e) {
    return handleError(e);
  }
}