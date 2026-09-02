import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ok, fail, handleError } from "@/lib/http";
import { uploadSupportImage } from "@/lib/support";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * POST /api/admin/support/upload  (multipart/form-data, field: "file")
 * Same as the user upload, but admin-authorised. The returned URL is then
 * sent via POST /api/admin/support/:userId with { imageUrl }.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return fail(400, "No file provided");
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const url = await uploadSupportImage({
      userId: admin.id, // store admin uploads under the admin's id prefix
      fileName: file.name || "upload.jpg",
      contentType: file.type || "image/jpeg",
      bytes,
    });

    return ok({ url });
  } catch (e) {
    return handleError(e);
  }
}
