"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

const warning = "This account is currently restricted to viewing. To request access or appeal, contact Ridgeford Support Team using the secure chat.";

/** UX only. The server separately blocks every sensitive mutation. */
export function BlockedActionGuard() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const originalFetch = window.fetch;
    let mounted = true;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
      const rawUrl = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      let path = "";
      try { path = new URL(rawUrl, window.location.href).pathname; } catch { /* leave untouched */ }
      const mutation = !["GET", "HEAD", "OPTIONS"].includes(method);
      const bankingApi = path.startsWith("/api/");
      const allowed = path.startsWith("/api/support") || path === "/api/auth/logout";
      if (bankingApi && mutation && !allowed) {
        if (mounted) setVisible(true);
        return Promise.resolve(new Response(JSON.stringify({ ok: false, error: warning }), {
          status: 403, headers: { "Content-Type": "application/json" },
        }));
      }
      return originalFetch.call(window, input, init);
    };

    // Also catch plain HTML form submissions if any are introduced later.
    function onSubmit(event: Event) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const method = (form.method || "get").toUpperCase();
      if (method === "GET") return;
      const path = new URL(form.action, window.location.href).pathname;
      if (path.startsWith("/api/support") || path === "/api/auth/logout") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setVisible(true);
    }
    document.addEventListener("submit", onSubmit, true);
    return () => {
      mounted = false;
      window.fetch = originalFetch;
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  if (!visible) return null;
  return (
    <div role="alert" className="fixed bottom-24 left-4 right-4 z-[60] mx-auto max-w-[460px] rounded-2xl border border-red-500/40 bg-panel p-4 shadow-2xl sm:left-auto sm:right-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-ink-900">Action unavailable</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-700">{warning}</p>
          <button type="button" className="mt-3 text-[13px] font-semibold text-brand-500 underline" onClick={() => { setVisible(false); window.dispatchEvent(new Event("ridgeford:open-support")); }}>
            Message support
          </button>
        </div>
        <button type="button" onClick={() => setVisible(false)} aria-label="Dismiss warning" className="text-ink-500 hover:text-ink-900"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
