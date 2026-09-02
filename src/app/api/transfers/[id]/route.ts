import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const u = await requireUser();
    const { id } = await params;
    const sb = supabaseAdmin();

    // allow by uuid OR reference_id
    const isUuid = /^[0-9a-f-]{36}$/i.test(id);
    const query = sb.from("transfers").select("*").eq("user_id", u.id);
    const { data, error } = await (isUuid
      ? query.eq("id", id)
      : query.eq("reference_id", id)
    ).maybeSingle();

    if (error) return fail(500, error.message);
    if (!data) return fail(404, "Transfer not found");
    return ok({ transfer: data });
  } catch (e) {
    return handleError(e);
  }
}
