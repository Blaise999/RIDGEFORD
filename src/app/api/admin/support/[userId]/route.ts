import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";
import {
  getOrCreateConversation,
  listMessages,
  markRead,
  postMessage,
} from "@/lib/support";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/support/:userId
 * Full conversation + messages for one customer.
 * ?after=<iso> returns only newer messages (polling).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin();
    const { userId } = await params;
    const url = new URL(req.url);
    const after = url.searchParams.get("after") || undefined;

    const sb = supabaseAdmin();
    const { data: customer } = await sb
      .from("users")
      .select("id,email,first_name,last_name,avatar_url,blocked,created_at")
      .eq("id", userId)
      .single();
    if (!customer) return fail(404, "User not found");

    const convo = await getOrCreateConversation(userId);
    const messages = await listMessages(convo.id, { after });

    if (!after) {
      await markRead(convo.id, "admin");
    }

    return ok({
      customer,
      conversation: { ...convo, unread_admin: after ? convo.unread_admin : 0 },
      messages,
      serverTime: new Date().toISOString(),
    });
  } catch (e) {
    return handleError(e);
  }
}

/**
 * POST /api/admin/support/:userId
 * body: { body?: string, imageUrl?: string }
 * Admin replies to the customer (text and/or image).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { userId } = await params;
    const json = await req.json().catch(() => ({}));
    const body = typeof json?.body === "string" ? json.body : "";
    const imageUrl =
      typeof json?.imageUrl === "string" && json.imageUrl ? json.imageUrl : null;

    if (!body.trim() && !imageUrl) {
      return fail(400, "Message cannot be empty");
    }

    const adminName =
      [admin.first_name, admin.last_name].filter(Boolean).join(" ").trim() ||
      "Ridgeford Capital Bank Support";

    const msg = await postMessage({
      userId,
      sender: "admin",
      senderId: admin.id,
      senderName: adminName,
      body,
      imageUrl,
    });

    return ok({ message: msg });
  } catch (e) {
    return handleError(e);
  }
}
