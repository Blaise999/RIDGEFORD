import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const sb = supabaseAdmin();

    const [{ data: user }, { data: txns }, { data: transfers }] = await Promise.all([
      sb.from("users").select("*").eq("id", id).single(),
      sb
        .from("transactions")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
      sb
        .from("transfers")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (!user) return fail(404, "User not found");
    return ok({
      user,
      transactions: txns || [],
      transfers: transfers || [],
    });
  } catch (e) {
    return handleError(e);
  }
}
