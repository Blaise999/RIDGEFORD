import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";

export const dynamic = "force-dynamic";

const BUCKET = "kyc-documents";
const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
const KINDS = ["id_front", "id_back", "selfie", "proof_of_address", "source_of_funds", "tax_document", "other"];

/**
 * POST /api/kyc/upload — multipart { file, kind }
 *
 * KYC files land in a PRIVATE bucket. Nothing here is ever publicly
 * readable; compliance views them through short-lived signed URLs.
 */
export async function POST(req: NextRequest) {
  try {
    const u = await requireUser();
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const kind = String(form.get("kind") || "other");

    if (!file) return fail(400, "No file received");
    if (!KINDS.includes(kind)) return fail(400, "Unknown document type");
    if (file.size > MAX_BYTES) return fail(413, "That file is larger than 12 MB");
    if (file.type && !ALLOWED.includes(file.type)) {
      return fail(415, "Upload a JPG, PNG, WEBP or PDF");
    }

    const sb = supabaseAdmin();
    const ext = (file.name.split(".").pop() || "bin").toLowerCase().slice(0, 8);
    const path = `${u.id}/${kind}-${Date.now()}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: upErr } = await sb.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type || "application/octet-stream", upsert: false });
    if (upErr) return fail(500, `Upload failed: ${upErr.message}`);

    const { data: app } = await sb
      .from("kyc_applications")
      .select("id")
      .eq("user_id", u.id)
      .maybeSingle();

    // One live document per kind — replacing supersedes the previous file.
    const { data: old } = await sb
      .from("kyc_documents")
      .select("id, file_path")
      .eq("user_id", u.id)
      .eq("kind", kind);
    if (old?.length) {
      await sb.storage.from(BUCKET).remove(old.map((o: any) => o.file_path));
      await sb.from("kyc_documents").delete().eq("user_id", u.id).eq("kind", kind);
    }

    const { data, error } = await sb
      .from("kyc_documents")
      .insert({
        user_id: u.id,
        application_id: app?.id || null,
        kind,
        file_path: path,
        file_name: file.name,
        mime_type: file.type || null,
        size_bytes: file.size,
      })
      .select("id, kind, file_name, mime_type, size_bytes, status, created_at")
      .single();
    if (error) return fail(500, error.message);

    return ok({ document: data });
  } catch (e) {
    return handleError(e);
  }
}

/** DELETE /api/kyc/upload?kind=id_back — remove a document before submitting. */
export async function DELETE(req: NextRequest) {
  try {
    const u = await requireUser();
    const kind = req.nextUrl.searchParams.get("kind") || "";
    if (!KINDS.includes(kind)) return fail(400, "Unknown document type");

    const sb = supabaseAdmin();
    const { data: app } = await sb
      .from("kyc_applications")
      .select("status")
      .eq("user_id", u.id)
      .maybeSingle();
    if (app && ["submitted", "in_review", "approved"].includes(app.status)) {
      return fail(409, "Your application is locked while it's being reviewed.");
    }

    const { data: rows } = await sb
      .from("kyc_documents")
      .select("id, file_path")
      .eq("user_id", u.id)
      .eq("kind", kind);
    if (rows?.length) {
      await sb.storage.from(BUCKET).remove(rows.map((r: any) => r.file_path));
      await sb.from("kyc_documents").delete().eq("user_id", u.id).eq("kind", kind);
    }
    return ok({ kind });
  } catch (e) {
    return handleError(e);
  }
}
