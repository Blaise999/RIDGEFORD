import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/http";
import { uploadSupportImage } from "@/lib/support";

export const dynamic = "force-dynamic";

// Allow reasonably large image uploads.
export const maxDuration = 30;

/**
 * POST /api/support/upload  (multipart/form-data, field: "file")
 * Uploads an image and returns its public URL. The URL is then sent as a
 * normal message via POST /api/support/messages with { imageUrl }.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return fail(400, "No file provided");
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const url = await uploadSupportImage({
      userId: user.id,
      fileName: file.name || "upload.jpg",
      contentType: file.type || "image/jpeg",
      bytes,
    });

    return ok({ url });
  } catch (e) {
    return handleError(e);
  }
}
