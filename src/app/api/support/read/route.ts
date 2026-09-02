import { requireUser } from "@/lib/auth";
import { ok, handleError } from "@/lib/http";
import { getOrCreateConversation, markRead } from "@/lib/support";

export const dynamic = "force-dynamic";

/** POST /api/support/read — mark admin messages as read for this user. */
export async function POST() {
  try {
    const user = await requireUser();
    const convo = await getOrCreateConversation(user.id);
    await markRead(convo.id, "user");
    return ok({});
  } catch (e) {
    return handleError(e);
  }
}
