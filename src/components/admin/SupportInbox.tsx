"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare, Search, RefreshCw } from "lucide-react";
import { cx } from "@/lib/utils";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Convo = {
  id: string;
  user_id: string;
  status: "open" | "closed";
  last_message: string | null;
  last_message_at: string | null;
  last_sender: "user" | "admin" | null;
  unread_admin: number;
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
};

function fullName(u: Convo["user"]) {
  if (!u) return "Unknown user";
  const n = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return n || u.email;
}

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return "";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function SupportInbox() {
  const router = useRouter();
  const [convos, setConvos] = useState<Convo[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const mounted = useRef(true);

  async function load(silent = false) {
    if (!silent) setRefreshing(true);
    try {
      const r = await fetch("/api/admin/support", {
        credentials: "same-origin",
      });
      const d = await r.json().catch(() => null);
      if (d?.ok && Array.isArray(d.conversations) && mounted.current) {
        setConvos(d.conversations);
      }
    } catch {
      /* keep stale list */
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }

  useEffect(() => {
    mounted.current = true;
    load(true);

    // Realtime: any change to conversations refreshes the list.
    const sb = supabaseBrowser();
    let channel: any = null;
    if (sb) {
      channel = sb
        .channel("admin-support-inbox")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "support_conversations",
          },
          () => load(true)
        )
        .subscribe();
    }

    // Poll fallback every 6s
    const poll = setInterval(() => load(true), sb ? 20000 : 6000);

    return () => {
      mounted.current = false;
      clearInterval(poll);
      if (channel) {
        try {
          sb?.removeChannel(channel);
        } catch {
          /* ignore */
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? convos.filter((c) => {
        const u = c.user;
        return (
          fullName(u).toLowerCase().includes(needle) ||
          (u?.email || "").toLowerCase().includes(needle) ||
          (c.last_message || "").toLowerCase().includes(needle)
        );
      })
    : convos;

  const totalUnread = convos.reduce((s, c) => s + (c.unread_admin || 0), 0);

  return (
    <div className="pt-4 sm:pt-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight text-ink-900">
            Support inbox
          </h1>
          <p className="text-[13px] text-ink-500 mt-0.5">
            {totalUnread > 0
              ? `${totalUnread} unread message${totalUnread === 1 ? "" : "s"} across ${convos.length} conversation${convos.length === 1 ? "" : "s"}`
              : `${convos.length} conversation${convos.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <button
          onClick={() => load()}
          className="btn btn-ghost h-9 px-3 text-[13px]"
          disabled={refreshing}
        >
          <RefreshCw
            className={cx("h-4 w-4", refreshing && "animate-spin")}
          />
          Refresh
        </button>
      </div>

      <div className="relative mt-4 max-w-md">
        <Search className="h-4 w-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email or message…"
          className="w-full h-10 rounded-full bg-panel border border-ink-200 pl-10 pr-4 text-[14px] outline-none focus:border-brand-500"
        />
      </div>

      <div className="mt-5 card divide-y divide-ink-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-ink-400 text-[13.5px]">
            <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
            Loading conversations…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-ink-100 grid place-items-center text-ink-400">
              <MessageSquare className="h-6 w-6" />
            </div>
            <p className="mt-3 text-[13.5px] text-ink-500">
              {needle ? "No conversations match your search." : "No support conversations yet."}
            </p>
          </div>
        ) : (
          filtered.map((c) => {
            const unread = c.unread_admin > 0;
            return (
              <button
                key={c.id}
                onClick={() => router.push(`/admin/support/${c.user_id}`)}
                className="w-full text-left px-4 sm:px-5 py-4 flex items-center gap-3 hover:bg-ink-50 transition"
              >
                <div className="relative shrink-0">
                  <div className="h-11 w-11 rounded-full bg-ink-100 grid place-items-center overflow-hidden text-[13px] font-bold text-ink-600">
                    {c.user?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.user.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      fullName(c.user).slice(0, 1).toUpperCase()
                    )}
                  </div>
                  {unread && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center ring-2 ring-white">
                      {c.unread_admin}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cx(
                        "text-[14px] truncate",
                        unread ? "font-bold text-ink-900" : "font-semibold text-ink-800"
                      )}
                    >
                      {fullName(c.user)}
                    </span>
                    <span className="text-[11px] text-ink-400 shrink-0">
                      {timeAgo(c.last_message_at)}
                    </span>
                  </div>
                  <div
                    className={cx(
                      "text-[12.5px] truncate mt-0.5",
                      unread ? "text-ink-700" : "text-ink-400"
                    )}
                  >
                    {c.last_sender === "admin" && (
                      <span className="text-ink-400">You: </span>
                    )}
                    {c.last_message || "No messages yet"}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <p className="mt-3 text-[12px] text-ink-400">
        Tip: open a conversation to reply. Replies are delivered to the
        customer instantly and also create an in-app notification.
      </p>
      <Link
        href="/admin"
        className="inline-block mt-2 text-[12.5px] text-brand-600 font-semibold hover:underline"
      >
        ← Back to overview
      </Link>
    </div>
  );
}
