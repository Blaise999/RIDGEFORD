"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Logo } from "./Logo";
import { cx } from "@/lib/utils";

type Tint = "light" | "dark" | "brand";

const SECTIONS: { label: string; href: string }[] = [
  { label: "Personal", href: "#personal" },
  { label: "Business", href: "#business" },
  { label: "Cards", href: "#cards" },
  { label: "Spaces", href: "#spaces" },
  { label: "Plans", href: "#plans" },
];

/** Tint → CSS variables applied to the navbar itself. */
function applyTint(t: Tint, scrolled: boolean) {
  const root = document.documentElement;
  if (t === "dark") {
    root.style.setProperty("--nav-fg", "#ffffff");
    root.style.setProperty("--nav-bg", scrolled ? "rgba(10,12,16,0.65)" : "rgba(10,12,16,0)");
    root.style.setProperty("--nav-ring", scrolled ? "rgba(255,255,255,0.08)" : "transparent");
  } else if (t === "brand") {
    root.style.setProperty("--nav-fg", "#ffffff");
    root.style.setProperty("--nav-bg", scrolled ? "rgba(12,38,114,0.7)" : "rgba(12,38,114,0)");
    root.style.setProperty("--nav-ring", scrolled ? "rgba(255,255,255,0.10)" : "transparent");
  } else {
    root.style.setProperty("--nav-fg", "#0a0c10");
    root.style.setProperty("--nav-bg", scrolled ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0)");
    root.style.setProperty("--nav-ring", scrolled ? "rgba(10,12,16,0.06)" : "transparent");
  }
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tint, setTint] = useState<Tint>("light");

  // Observe sections that set [data-nav-tint] so the navbar knows what color to be.
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("[data-nav-tint]");
    if (!nodes.length) {
      applyTint("light", scrolled);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        // pick the entry that is highest in the viewport and intersecting
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) {
          const next = (top.target.getAttribute("data-nav-tint") || "light") as Tint;
          setTint(next);
        }
      },
      { rootMargin: "-56px 0px -85% 0px", threshold: [0, 0.25, 0.75, 1] }
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    applyTint(tint, scrolled);
  }, [tint, scrolled]);

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 transition-[background-color,border-color] duration-500"
      style={{
        backgroundColor: "var(--nav-bg)",
        borderBottom: "1px solid var(--nav-ring)",
        backdropFilter: scrolled ? "saturate(160%) blur(14px)" : "none",
        WebkitBackdropFilter: scrolled ? "saturate(160%) blur(14px)" : "none",
      }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8 h-16">
        <div className="flex items-center gap-10">
          <Logo useChameleon />
          <div className="hidden lg:flex items-center gap-1">
            {SECTIONS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                className="group inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[14.5px] font-medium hover:bg-white/10 focus-ring transition-colors"
                style={{ color: "var(--nav-fg)" }}
              >
                {s.label}
                <ChevronDown className="h-3.5 w-3.5 opacity-40 group-hover:opacity-70 transition" />
              </a>
            ))}
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full px-4 h-10 inline-flex items-center justify-center text-[14.5px] font-semibold hover:bg-white/10 transition-colors"
            style={{ color: "var(--nav-fg)" }}
          >
            Log in
          </Link>
          <Link href="/signup" className="btn btn-brand focus-ring">
            Open an account
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden grid place-items-center h-10 w-10 rounded-full hover:bg-white/10 focus-ring"
          style={{ color: "var(--nav-fg)" }}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <div
        className={cx(
          "lg:hidden overflow-hidden transition-[max-height,opacity] duration-300 bg-panel border-b border-ink-100",
          open ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-5 sm:px-8 py-4 flex flex-col gap-1">
          {SECTIONS.map((s) => (
            <a
              key={s.href}
              href={s.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-[15px] font-medium text-ink-700 hover:bg-ink-50"
            >
              {s.label}
            </a>
          ))}
          <div className="mt-3 flex gap-2">
            <Link href="/login" className="btn btn-ghost flex-1">
              Log in
            </Link>
            <Link href="/signup" className="btn btn-brand flex-1">
              Open an account
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
