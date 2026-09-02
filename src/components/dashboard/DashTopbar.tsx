"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Send, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import type { SessionUser } from "@/lib/auth-types";
import { cx, hashStr } from "@/lib/utils";
import { NotificationsBell } from "./NotificationsBell";

function initials(u: SessionUser) {
  const a = (u.first_name || u.email || "U").trim();
  const b = (u.last_name || "").trim();
  return ((a[0] || "") + (b[0] || "")).toUpperCase() || "U";
}

function hue(id: string) {
  // Deterministic hue so the avatar color is stable per user
  if (!id) return 210;
  return hashStr(id) % 360;
}

export function DashTopbar({ user }: { user: SessionUser }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore — we redirect either way */
    }
    // Hard navigation so the cleared cookie is honored on the next request.
    window.location.assign("/");
  }

  return (
    <header className="sticky top-0 z-30 dash-chrome border-b border-ink-200">
      <div className="h-16 flex items-center gap-3 px-5 sm:px-8">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="lg:hidden h-10 w-10 grid place-items-center rounded-full hover:bg-ink-50 focus-ring"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            className="w-full h-10 rounded-full bg-ink-50 border border-ink-100 pl-10 pr-4 text-[14px] placeholder:text-ink-400 outline-none focus:bg-panel focus:border-ink-200"
            placeholder="Search transactions…"
          />
        </div>

        <Link
          href="/dashboard/transfer"
          className="hidden sm:inline-flex btn btn-primary h-10 px-4"
        >
          <Send className="h-4 w-4" />
          Send money
        </Link>

        <NotificationsBell />

        <div
          className={cx(
            "h-10 w-10 rounded-full overflow-hidden grid place-items-center text-[13px] font-bold text-white shrink-0"
          )}
          style={
            user.avatar_url
              ? undefined
              : {
                  background: `linear-gradient(135deg, hsl(${hue(
                    user.id
                  )} 60% 45%), hsl(${(hue(user.id) + 40) % 360} 60% 35%))`,
                }
          }
          title={user.email}
        >
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url}
              alt={user.email || "User avatar"}
              className="h-full w-full object-cover"
            />
          ) : (
            initials(user)
          )}
        </div>

        <button
          onClick={logout}
          className="hidden sm:inline-flex h-10 w-10 grid place-items-center rounded-full hover:bg-ink-50 focus-ring"
          title="Log out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {mobileOpen && (
        <nav className="lg:hidden border-t border-ink-100 bg-panel px-3 py-3 space-y-1">
          {[
            "/dashboard",
            "/dashboard/transactions",
            "/dashboard/transfer",
            "/dashboard/crypto",
            "/dashboard/spaces",
            "/dashboard/cards",
            "/dashboard/settings",
          ].map((href) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-4 py-2.5 text-[14px] font-medium text-ink-700 hover:bg-ink-50"
            >
              {href === "/dashboard"
                ? "Overview"
                : href
                    .replace("/dashboard/", "")
                    .replace(/^\w/, (c) => c.toUpperCase())}
            </Link>
          ))}

          <button
            onClick={logout}
            className="w-full text-left rounded-xl px-4 py-2.5 text-[14px] font-medium text-ink-700 hover:bg-ink-50"
          >
            Log out
          </button>
        </nav>
      )}
    </header>
  );
}
