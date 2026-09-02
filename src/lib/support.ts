import { supabaseAdmin } from "./supabase/admin";
import { notify } from "./notify";

export type SupportSender = "user" | "admin";

export type SupportMessage = {
  id: string;
  conversation_id: string;
  user_id: string;
  sender: SupportSender;
  sender_id: string | null;
  sender_name: string | null;
  body: string;
  image_url: string | null;
  read_by_user: boolean;
  read_by_admin: boolean;
  created_at: string;
};

export type SupportConversation = {
  id: string;
  user_id: string;
  status: "open" | "closed";
  last_message: string | null;
  last_message_at: string | null;
  last_sender: SupportSender | null;
  unread_admin: number;
  unread_user: number;
  created_at: string;
  updated_at: string;
};

/**
 * Get the user's conversation, creating it on first access.
 * There is exactly one conversation per user (unique constraint).
 */
export async function getOrCreateConversation(
  userId: string
): Promise<SupportConversation> {
  const sb = supabaseAdmin();

  const { data: existing } = await sb
    .from("support_conversations")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing as SupportConversation;

  const { data: created, error } = await sb
    .from("support_conversations")
    .insert({ user_id: userId, status: "open" })
    .select("*")
    .single();

  if (error || !created) {
    // Lost a race with a concurrent insert — fetch the winner.
    const { data: again } = await sb
      .from("support_conversations")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (again) return again as SupportConversation;
    throw new Error(error?.message || "Could not open a support conversation");
  }

  return created as SupportConversation;
}

export async function listMessages(
  conversationId: string,
  opts: { after?: string; limit?: number } = {}
): Promise<SupportMessage[]> {
  const sb = supabaseAdmin();
  let q = sb
    .from("support_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(Math.min(opts.limit ?? 200, 500));

  if (opts.after) q = q.gt("created_at", opts.after);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data || []) as SupportMessage[];
}

/**
 * Append a message and keep the conversation's denormalised fields and
 * unread counters in sync. Also drops an in-app notification for the
 * recipient side.
 */
export async function postMessage(args: {
  userId: string; // the conversation owner (always the customer)
  sender: SupportSender;
  senderId: string | null;
  senderName: string | null;
  body: string;
  imageUrl?: string | null;
}): Promise<SupportMessage> {
  const body = args.body.trim();
  const imageUrl = args.imageUrl || null;
  if (!body && !imageUrl) {
    throw new Error("Message cannot be empty");
  }
  if (body.length > 4000) throw new Error("Message is too long (max 4000 chars)");

  const sb = supabaseAdmin();
  const convo = await getOrCreateConversation(args.userId);

  const { data: msg, error } = await sb
    .from("support_messages")
    .insert({
      conversation_id: convo.id,
      user_id: args.userId,
      sender: args.sender,
      sender_id: args.senderId,
      sender_name: args.senderName,
      body,
      image_url: imageUrl,
      read_by_user: args.sender === "user",
      read_by_admin: args.sender === "admin",
    })
    .select("*")
    .single();

  if (error || !msg) {
    throw new Error(error?.message || "Could not send the message");
  }

  const summary = body ? body.slice(0, 280) : "📷 Photo";

  // Update conversation summary + bump the *other* side's unread counter.
  const patch: Record<string, any> = {
    last_message: summary,
    last_message_at: msg.created_at,
    last_sender: args.sender,
    status: "open",
  };
  if (args.sender === "user") {
    patch.unread_admin = (convo.unread_admin || 0) + 1;
  } else {
    patch.unread_user = (convo.unread_user || 0) + 1;
  }

  await sb
    .from("support_conversations")
    .update(patch)
    .eq("id", convo.id);

  // Notify the recipient. The customer gets an in-app notification when an
  // admin replies; admins see unread counts in the support inbox.
  if (args.sender === "admin") {
    await notify(
      args.userId,
      "support_reply",
      "New reply from Ridgeford Capital Bank support",
      summary.slice(0, 140),
      { conversation_id: convo.id }
    );
  }

  return msg as SupportMessage;
}

/** Mark all messages from the other side as read for the given viewer. */
export async function markRead(
  conversationId: string,
  viewer: SupportSender
): Promise<void> {
  const sb = supabaseAdmin();

  if (viewer === "admin") {
    await sb
      .from("support_messages")
      .update({ read_by_admin: true })
      .eq("conversation_id", conversationId)
      .eq("sender", "user")
      .eq("read_by_admin", false);
    await sb
      .from("support_conversations")
      .update({ unread_admin: 0 })
      .eq("id", conversationId);
  } else {
    await sb
      .from("support_messages")
      .update({ read_by_user: true })
      .eq("conversation_id", conversationId)
      .eq("sender", "admin")
      .eq("read_by_user", false);
    await sb
      .from("support_conversations")
      .update({ unread_user: 0 })
      .eq("id", conversationId);
  }
}

/** Admin inbox: conversations sorted by most recent activity. */
export async function listConversationsForAdmin(): Promise<
  (SupportConversation & {
    user: {
      id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
    } | null;
  })[]
> {
  const sb = supabaseAdmin();

  const { data: convos, error } = await sb
    .from("support_conversations")
    .select("*")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) throw new Error(error.message);
  const list = (convos || []) as SupportConversation[];

  const ids = Array.from(new Set(list.map((c) => c.user_id)));
  let users: Record<string, any> = {};
  if (ids.length) {
    const { data: us } = await sb
      .from("users")
      .select("id,email,first_name,last_name,avatar_url")
      .in("id", ids);
    users = Object.fromEntries((us || []).map((u) => [u.id, u]));
  }

  return list.map((c) => ({ ...c, user: users[c.user_id] || null }));
}

const SUPPORT_BUCKET = "support-attachments";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);

/**
 * Upload a support attachment (image) and return its public URL.
 * Uploads run server-side with the service-role key, so the bucket needs
 * no anon INSERT policy — only public read (set in the schema/migration).
 */
export async function uploadSupportImage(args: {
  userId: string;
  fileName: string;
  contentType: string;
  bytes: Buffer;
}): Promise<string> {
  if (!ALLOWED_TYPES.has(args.contentType)) {
    throw new Error("Unsupported image type. Use PNG, JPG, WEBP or GIF.");
  }
  if (args.bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large (max 8 MB).");
  }

  const sb = supabaseAdmin();
  const ext =
    (args.fileName.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "jpg";
  const path = `${args.userId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const { error } = await sb.storage
    .from(SUPPORT_BUCKET)
    .upload(path, args.bytes, {
      contentType: args.contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || "Could not upload the image");
  }

  const { data } = sb.storage.from(SUPPORT_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("Could not resolve the uploaded image URL");
  }
  return data.publicUrl;
}
