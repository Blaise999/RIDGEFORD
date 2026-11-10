"use client";

import { useEffect } from "react";

/** A running dashboard must not stay open indefinitely after admin suspension. */
export function BlockStatusWatcher() {
  useEffect(() => {
    let stopped = false;
    let running = false;

    async function check() {
      if (stopped || running) return;
      running = true;
      try {
        const r = await fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store" });
        if (!stopped && r.ok) {
          const j = await r.json();
          if (j?.user?.blocked === true) window.location.replace("/dashboard");
        }
      } catch {
        // Network failures must not log the customer out.
      } finally {
        running = false;
      }
    }
    const onFocus = () => { if (document.visibilityState === "visible") void check(); };
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void check(); }, 30000);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);
  return null;
}
