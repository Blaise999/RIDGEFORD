import { requireUser } from "@/lib/auth";
import { ok, handleError } from "@/lib/http";
import {
  getOrCreateConversation,
  listMessages,
  markRead,
} from "@/lib/support";

export const dynamic = "force-dynamic";

/**
 * GET /api/support
 * Returns the signed-in user's conversation and its messages.
 * Optional ?after=<iso> returns only newer messages (used by polling).
 */
export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const after = url.searchParams.get("after") || undefined;

    const convo = await getOrCreateConversation(user.id);
    const messages = await listMessages(convo.id, { after });

    // Opening the chat marks admin messages as read for the user.
    if (!after) {
      await markRead(convo.id, "user");
    }

    return ok({
      conversation: { ...convo, unread_user: after ? convo.unread_user : 0 },
      messages,
      serverTime: new Date().toISOString(),
    });
  } catch (e) {
    return handleError(e);
  }
}
