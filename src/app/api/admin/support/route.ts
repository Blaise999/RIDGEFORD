import { requireAdmin } from "@/lib/auth";
import { ok, handleError } from "@/lib/http";
import { listConversationsForAdmin } from "@/lib/support";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/support
 * Returns every support conversation with its customer, newest activity
 * first. Used by the admin support inbox (also polled for live updates).
 */
export async function GET() {
  try {
    await requireAdmin();
    const conversations = await listConversationsForAdmin();
    const totalUnread = conversations.reduce(
      (s, c) => s + (c.unread_admin || 0),
      0
    );
    return ok({
      conversations,
      totalUnread,
      serverTime: new Date().toISOString(),
    });
  } catch (e) {
    return handleError(e);
  }
}
