import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";
import { sendCustomerMessage } from "@/lib/email";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Search customers assigned to the signed-in admin, plus their sent history. */
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const sb = supabaseAdmin();
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim().slice(0, 80);
    const userId = (url.searchParams.get("userId") || "").trim();
    if (userId && !UUID_RE.test(userId)) return fail(400, "Invalid customer ID");

    let query = sb.from("users")
      .select("id,email,first_name,last_name,currency,blocked")
      .eq("role", "user")
      .eq("admin_owner_id", admin.id)
      .order("created_at", { ascending: false })
      .limit(q || userId ? 40 : 60);
    if (userId) query = query.eq("id", userId);
    else if (q) {
      // Strip PostgREST filter punctuation so search input cannot alter the filter.
      const safeQ = q.replace(/[^a-zA-Z0-9 @.+_-]/g, "").trim();
      if (safeQ) query = query.or(`email.ilike.%${safeQ}%,first_name.ilike.%${safeQ}%,last_name.ilike.%${safeQ}%`);
    }
    const [{ data: users, error: usersError }, { data: history, error: historyError }] = await Promise.all([
      query,
      sb.from("admin_actions")
        .select("target_id,notes,metadata,created_at")
        .eq("admin_id", admin.id)
        .eq("action", "customer_email_sent")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    if (usersError) return fail(500, "Unable to load customers");
    if (historyError) return fail(500, "Unable to load sent email history");
    return ok({ users: users || [], history: history || [] });
  } catch (error) {
    return handleError(error);
  }
}

/** A composed message is sent only to the stored email of a customer on this admin's desk. */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.startsWith("application/json")) return fail(415, "Expected JSON request");
    const body = await req.json().catch(() => null);
    const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!UUID_RE.test(userId)) return fail(400, "Choose a customer");
    if (subject.length < 4 || subject.length > 120 || /[\r\n]/.test(subject)) {
      return fail(400, "Subject must be 4–120 characters on one line");
    }
    if (message.length < 10 || message.length > 4000) {
      return fail(400, "Message must be 10–4,000 characters");
    }

    const sb = supabaseAdmin();
    const { data: customer, error: customerError } = await sb.from("users")
      .select("id,email,first_name")
      .eq("id", userId)
      .eq("role", "user")
      .eq("admin_owner_id", admin.id)
      .maybeSingle();
    if (customerError) return fail(500, "Unable to verify customer");
    if (!customer?.email) return fail(404, "Customer not found on your desk");

    // Basic abuse protection for manual customer correspondence.
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recent, error: recentError } = await sb.from("admin_actions")
      .select("target_id")
      .eq("admin_id", admin.id)
      .eq("action", "customer_email_sent")
      .gte("created_at", since)
      .limit(25);
    if (recentError) return fail(500, "Unable to verify sending limits");
    if ((recent || []).length >= 10) return fail(429, "Hourly sending limit reached. Try again later.");

    const result = await sendCustomerMessage(
      customer.email,
      customer.first_name || "there",
      subject,
      message
    );
    if (!result.ok) return fail(502, result.error || "Email could not be sent");

    const { error: auditError } = await sb.from("admin_actions").insert({
      admin_id: admin.id,
      action: "customer_email_sent",
      target_type: "user",
      target_id: customer.id,
      notes: subject,
      metadata: { recipient: customer.email, provider_id: result.id, subject },
    });

    // Provider already accepted the email. Do not claim it failed when logging fails.
    if (auditError) {
      console.error("[admin-email] sent but audit failed:", auditError.message);
      return ok({ sent: true, warning: "Email accepted, but the activity log could not be updated." });
    }
    return ok({ sent: true, id: result.id });
  } catch (error) {
    return handleError(error);
  }
}
