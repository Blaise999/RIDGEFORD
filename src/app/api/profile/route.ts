import { NextRequest } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const u = await requireActiveUser();
    const body = await req.json().catch(() => ({}));
    const updates: any = {};

    if (typeof body.avatar_url === "string") {
      if (body.avatar_url.length > 2_500_000) return fail(413, "Image too large — please use a smaller picture.");
      updates.avatar_url = body.avatar_url;
    }
    if (typeof body.phone === "string") updates.phone = body.phone.slice(0, 40);
    if (typeof body.first_name === "string") updates.first_name = body.first_name.slice(0, 60);
    if (typeof body.last_name === "string") updates.last_name = body.last_name.slice(0, 60);

    if (!Object.keys(updates).length) return fail(400, "No fields to update");

    const sb = supabaseAdmin();
    const { error } = await sb.from("users").update(updates).eq("id", u.id);
    if (error) return fail(500, error.message);
    return ok();
  } catch (e) {
    return handleError(e);
  }
}
