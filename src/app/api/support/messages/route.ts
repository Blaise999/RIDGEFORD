import { requireUser } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/http";
import { postMessage } from "@/lib/support";

export const dynamic = "force-dynamic";

/**
 * POST /api/support/messages
 * body: { body?: string, imageUrl?: string }
 * The signed-in user sends a message (text and/or image) to support.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const json = await req.json().catch(() => ({}));
    const body = typeof json?.body === "string" ? json.body : "";
    const imageUrl =
      typeof json?.imageUrl === "string" && json.imageUrl ? json.imageUrl : null;

    if (!body.trim() && !imageUrl) {
      return fail(400, "Message cannot be empty");
    }

    const name =
      [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
      user.email;

    const msg = await postMessage({
      userId: user.id,
      sender: "user",
      senderId: user.id,
      senderName: name,
      body,
      imageUrl,
    });

    return ok({ message: msg });
  } catch (e) {
    return handleError(e);
  }
}
