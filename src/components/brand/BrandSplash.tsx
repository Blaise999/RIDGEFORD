"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";

/**
 * BRAND SPLASH
 *
 * A blank field, the mark, the tagline under it, then a fade into the page.
 *
 * Three rules keep this from becoming the thing everyone hates about splash
 * screens:
 *
 *  1. It shows ONCE per session. sessionStorage, not localStorage — a returning
 *     visitor in the same tab goes straight to the page, but a fresh visit
 *     still gets the moment.
 *  2. It never blocks. The landing renders underneath the whole time; this is
 *     an overlay that lifts, not a gate that opens. If the JS fails, you see
 *     the site.
 *  3. `prefers-reduced-motion` skips it entirely.
 *
 * Total: ~3.8s. The mark settles, the rule draws, the tagline arrives, then
 * it lifts — enough time to actually read it.
 */
export function BrandSplash({
  hold = 2900,
  fade = 900,
}: {
  hold?: number;
  fade?: number;
}) {
  // `null` = undecided, so the first paint never flashes the splash for
  // somebody who has already seen it.
  const [phase, setPhase] = useState<"idle" | "in" | "out" | "done">("idle");

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("rdgf_splash") === "1";
    } catch {
      /* private mode — show it, no harm done */
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduced) {
      setPhase("done");
      return;
    }

    try {
      sessionStorage.setItem("rdgf_splash", "1");
    } catch {
      /* ignore */
    }

    // Deliberately NOT locking body overflow. Setting overflow on the root
    // while the overlay is up would break `position: sticky` measurement for
    // the pinned hero underneath, and the overlay already covers the viewport.
    setPhase("in");
    const t1 = setTimeout(() => setPhase("out"), hold);
    const t2 = setTimeout(() => setPhase("done"), hold + fade);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [hold, fade]);

  // `idle` lasts one tick, before the effect decides. Rendering nothing in both
  // idle and done keeps the server HTML and the first client paint identical.
  if (phase === "idle" || phase === "done") return null;

  return (
    <div
      className={`splash ${phase === "out" ? "is-out" : ""}`}
      style={{ ["--fade" as any]: `${fade}ms` }}
      aria-hidden="true"
    >
      {/*
        The lockup is sized in CSS, not by the `size` prop, because a fixed
        72px mark plus a 52px wordmark plus a tracked-out tagline overflows a
        360px phone — which is exactly what was getting clipped. `svh` and
        clamp() let it shrink to the viewport instead.
      */}
      <div className="splash__in">
        <Logo size="xl" stacked showTagline href={null} className="splash__logo" />
        <span className="splash__rule" />
      </div>
    </div>
  );
}

export default BrandSplash;
