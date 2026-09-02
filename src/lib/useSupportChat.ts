"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export type ChatMessage = {
  id: string;
  conversation_id: string;
  user_id: string;
  sender: "user" | "admin";
  sender_id: string | null;
  sender_name: string | null;
  body: string;
  image_url: string | null;
  created_at: string;
};

type UseSupportChatArgs = {
  /** API endpoint that returns { conversation, messages, serverTime } */
  endpoint: string;
  /** API endpoint that accepts POST { body, imageUrl } to send a message */
  sendEndpoint: string;
  /** API endpoint that accepts multipart POST (field "file") → { url } */
  uploadEndpoint: string;
  /** poll interval (ms) when realtime is unavailable */
  pollMs?: number;
};

/**
 * Powers both the customer widget and the admin thread.
 *
 * - Subscribes to Supabase Realtime row inserts on `support_messages`
 *   (filtered by conversation) for instant delivery.
 * - Always also runs a lightweight poll as a fallback so the chat works
 *   even when the anon key / realtime is not configured, or a socket drops.
 * - De-dupes by message id, so realtime + poll + optimistic send never
 *   produce duplicates.
 */
export function useSupportChat({
  endpoint,
  sendEndpoint,
  uploadEndpoint,
  pollMs = 4000,
}: UseSupportChatArgs) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [live, setLive] = useState(false);

  const lastTsRef = useRef<string | null>(null);
  const idsRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);

  const mergeIn = useCallback((incoming: ChatMessage[]) => {
    if (!incoming.length) return;
    setMessages((prev) => {
      const next = [...prev];
      let changed = false;
      for (const m of incoming) {
        if (idsRef.current.has(m.id)) continue;
        idsRef.current.add(m.id);
        next.push(m);
        changed = true;
        if (!lastTsRef.current || m.created_at > lastTsRef.current) {
          lastTsRef.current = m.created_at;
        }
      }
      if (!changed) return prev;
      next.sort((a, b) => a.created_at.localeCompare(b.created_at));
      return next;
    });
  }, []);

  // Initial load
  const loadInitial = useCallback(async () => {
    try {
      const r = await fetch(endpoint, { credentials: "same-origin" });
      const raw = await r.text();
      let d: any = {};
      try {
        d = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error("Unexpected server response");
      }
      if (!r.ok || !d.ok) throw new Error(d.error || "Could not load chat");

      const msgs: ChatMessage[] = Array.isArray(d.messages) ? d.messages : [];
      idsRef.current = new Set(msgs.map((m) => m.id));
      if (msgs.length) {
        lastTsRef.current = msgs[msgs.length - 1].created_at;
      } else if (d.serverTime) {
        lastTsRef.current = d.serverTime;
      }
      if (mountedRef.current) {
        setMessages(msgs);
        setConversationId(d.conversation?.id || null);
        setError(null);
      }
      return d.conversation?.id as string | undefined;
    } catch (e: any) {
      if (mountedRef.current) {
        setError(e?.message || "Could not load chat");
      }
      return undefined;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [endpoint]);

  // Poll for new messages since the last seen timestamp
  const pollOnce = useCallback(async () => {
    if (!lastTsRef.current) return;
    try {
      const sep = endpoint.includes("?") ? "&" : "?";
      const r = await fetch(
        `${endpoint}${sep}after=${encodeURIComponent(lastTsRef.current)}`,
        { credentials: "same-origin" }
      );
      if (!r.ok) return;
      const d = await r.json().catch(() => null);
      if (d?.ok && Array.isArray(d.messages) && d.messages.length) {
        mergeIn(d.messages);
      }
    } catch {
      /* network blip — next tick retries */
    }
  }, [endpoint, mergeIn]);

  const send = useCallback(
    async (text: string, imageUrl?: string | null) => {
      const body = text.trim();
      if ((!body && !imageUrl) || sending) return false;
      setSending(true);
      setError(null);
      try {
        const r = await fetch(sendEndpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ body, imageUrl: imageUrl || undefined }),
        });
        const raw = await r.text();
        let d: any = {};
        try {
          d = raw ? JSON.parse(raw) : {};
        } catch {
          throw new Error("Unexpected server response");
        }
        if (!r.ok || !d.ok) throw new Error(d.error || "Could not send");
        if (d.message) mergeIn([d.message]);
        return true;
      } catch (e: any) {
        setError(e?.message || "Could not send your message");
        return false;
      } finally {
        setSending(false);
      }
    },
    [sendEndpoint, sending, mergeIn]
  );

  /**
   * Upload an image file, then post it as a message (optionally with a
   * caption). Returns true on success.
   */
  const sendImage = useCallback(
    async (file: File, caption?: string) => {
      if (uploading || sending) return false;
      if (!file.type.startsWith("image/")) {
        setError("Only image files can be attached.");
        return false;
      }
      if (file.size > 8 * 1024 * 1024) {
        setError("Image is too large (max 8 MB).");
        return false;
      }
      setUploading(true);
      setError(null);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch(uploadEndpoint, {
          method: "POST",
          credentials: "same-origin",
          body: fd,
        });
        const raw = await r.text();
        let d: any = {};
        try {
          d = raw ? JSON.parse(raw) : {};
        } catch {
          throw new Error("Unexpected server response");
        }
        if (!r.ok || !d.ok || !d.url) {
          throw new Error(d.error || "Could not upload the image");
        }
        // chain into a normal message send carrying the image URL
        return await send(caption || "", d.url);
      } catch (e: any) {
        setError(e?.message || "Could not upload the image");
        return false;
      } finally {
        setUploading(false);
      }
    },
    [uploadEndpoint, uploading, sending, send]
  );

  useEffect(() => {
    mountedRef.current = true;
    let poll: ReturnType<typeof setInterval> | null = null;
    let channel: ReturnType<
      NonNullable<ReturnType<typeof supabaseBrowser>>["channel"]
    > | null = null;

    (async () => {
      const convoId = await loadInitial();

      // Try realtime first
      const sb = supabaseBrowser();
      if (sb && convoId) {
        channel = sb
          .channel(`support:${convoId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "support_messages",
              filter: `conversation_id=eq.${convoId}`,
            },
            (payload: any) => {
              if (payload?.new) mergeIn([payload.new as ChatMessage]);
            }
          )
          .subscribe((status: string) => {
            if (mountedRef.current) {
              setLive(status === "SUBSCRIBED");
            }
          });
      }

      // Poll always runs as a safety net (slower when realtime is live)
      poll = setInterval(pollOnce, sb && convoId ? pollMs * 3 : pollMs);
    })();

    return () => {
      mountedRef.current = false;
      if (poll) clearInterval(poll);
      if (channel) {
        const sb = supabaseBrowser();
        try {
          sb?.removeChannel(channel);
        } catch {
          /* ignore */
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    messages,
    conversationId,
    loading,
    sending,
    uploading,
    error,
    live,
    send,
    sendImage,
    reload: loadInitial,
  };
}
