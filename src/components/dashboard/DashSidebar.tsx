"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/landing/Logo";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Send,
  CreditCard,
  Wallet,
  Bitcoin,
  Settings,
  LogOut,
} from "lucide-react";
import { cx } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", Icon: LayoutDashboard, exact: true },
  { href: "/dashboard/transactions", label: "Transactions", Icon: ArrowLeftRight },
  { href: "/dashboard/transfer", label: "Send money", Icon: Send },
  { href: "/dashboard/crypto", label: "Crypto", Icon: Bitcoin },
  { href: "/dashboard/vault", label: "Vault", Icon: Wallet },
  { href: "/dashboard/cards", label: "Cards", Icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", Icon: Settings },
];

export function DashSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 dash-chrome bg-ink-2 border-r border-ink-200 flex-col">
      <div className="h-16 flex items-center px-6 border-b border-ink-100">
        <Logo />
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map((it) => {
          const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cx(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition",
                active
                  ? "nav-active"
                  : "text-ink-700 hover:bg-ink-50"
              )}
            >
              <it.Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-ink-100">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium text-ink-700 hover:bg-ink-50 transition"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
