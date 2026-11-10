"use client";

import { useEffect } from "react";

/** Reloads only when a customer's restriction status changes. */
export function BlockStatusWatcher({ initialBlocked }: { initialBlocked: boolean }) {
  useEffect(() => {
    let stopped = false;
    let running = false;

    async function check() {
      if (stopped || running) return;
      running = true;
      try {
        const response = await fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" });
        if (!stopped && response.ok) {
          const json = await response.json();
          if (typeof json?.user?.blocked === "boolean" && json.user.blocked !== initialBlocked) {
            window.location.reload();
          }
        }
      } catch {
        // A network failure must not log the customer out.
      } finally {
        running = false;
      }
    }

    const onFocus = () => { if (document.visibilityState === "visible") void check(); };
    const timer = window.setInterval(onFocus, 30000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [initialBlocked]);
  return null;
}
