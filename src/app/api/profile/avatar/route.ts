import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";

export const dynamic = "force-dynamic";

const BUCKET = "avatars";
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/gif"];

/**
 * POST /api/profile/avatar — multipart { file }
 *
 * The settings page previously read the file with FileReader and saved the
 * base64 data URL straight into users.avatar_url. A 3 MB photo became roughly
 * 4 MB of text on the user row, which then travelled with EVERY query that
 * selected the user — the session lookup, the dashboard, the admin list. It
 * "worked" in the sense that a picture appeared, and quietly made the whole
 * app slower for that customer.
 *
 * Files now go to object storage and the column holds a URL, which is what it
 * was always meant to hold.
 */
export async function POST(req: NextRequest) {
  try {
    const u = await requireUser();
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) return fail(400, "No image received");
    if (file.size > MAX_BYTES) return fail(413, "That image is larger than 4 MB");
    if (file.type && !ALLOWED.includes(file.type)) {
      return fail(415, "Upload a JPG, PNG, WEBP or GIF");
    }

    const sb = supabaseAdmin();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().slice(0, 5);
    // Overwrite a stable path so old avatars don't accumulate forever.
    const path = `${u.id}/avatar.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: upErr } = await sb.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: file.type || "image/jpeg",
        upsert: true,
        cacheControl: "3600",
      });
    if (upErr) return fail(500, `Upload failed: ${upErr.message}`);

    const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
    // Cache-bust, or the browser keeps showing the previous photo after a change.
    const url = `${pub.publicUrl}?v=${Date.now()}`;

    const { error } = await sb.from("users").update({ avatar_url: url }).eq("id", u.id);
    if (error) return fail(500, error.message);

    return ok({ avatar_url: url });
  } catch (e) {
    return handleError(e);
  }
}

/** DELETE /api/profile/avatar — back to initials. */
export async function DELETE() {
  try {
    const u = await requireUser();
    const sb = supabaseAdmin();
    for (const ext of ["jpg", "jpeg", "png", "webp", "heic", "gif"]) {
      await sb.storage.from(BUCKET).remove([`${u.id}/avatar.${ext}`]);
    }
    await sb.from("users").update({ avatar_url: null }).eq("id", u.id);
    return ok({ avatar_url: null });
  } catch (e) {
    return handleError(e);
  }
}
