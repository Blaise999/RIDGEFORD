"use client";

import { useEffect, useRef, useState } from "react";

/**
 * BAND MOTION
 *
 * The hero owns one long pinned timeline. The zones below it can't each pin —
 * five pinned sections is a fairground ride, not a bank — so they get the same
 * idea at a smaller scale: every zone derives its own 0 → 1 progress from where
 * it sits in the viewport, damped through a rAF loop, written once per frame to
 * a CSS custom property on the section element.
 *
 * JS owns one number per section. CSS owns every consequence. Same contract as
 * the hero, which is why the whole page reads as one instrument rather than a
 * stack of unrelated effects.
 */

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

/** Ease used for anything that should feel decelerated rather than linear. */
export const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Progress of an element through the viewport.
 *
 * 0 when its top edge touches the bottom of the viewport, 1 when its bottom
 * edge leaves the top. `window` narrows that range so the interesting part of
 * the animation happens while the section is actually being read rather than
 * while it's still half off screen.
 */
export function useBandProgress(options?: {
  damping?: number;
  window?: [number, number];
  /** Also write a `--heat` spike at these progress marks (hero-style hand-offs). */
  heatMarks?: number[];
  heatWidth?: number;
}) {
  const {
    damping = 0.14,
    window: win = [0.12, 0.78],
    heatMarks,
    heatWidth = 0.06,
  } = options || {};

  const ref = useRef<HTMLElement | null>(null);
  const target = useRef(0);
  const current = useRef(0);
  const raf = useRef(0);
  const visible = useRef(false);
  const [p, setP] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const read = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // raw: 0 as the top enters from below, 1 once the bottom has cleared the top
      const raw = (vh - r.top) / (vh + r.height);
      const [a, b] = win;
      target.current = clamp01((raw - a) / (b - a));
    };

    read();
    current.current = target.current;

    const io = new IntersectionObserver(
      ([e]) => {
        visible.current = e.isIntersecting;
      },
      { rootMargin: "20% 0px" }
    );
    io.observe(el);

    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);

    let lastWritten = -1;
    let lastHeat = -1;

    const tick = () => {
      raf.current = requestAnimationFrame(tick);
      if (!visible.current) return;

      current.current += reduced
        ? target.current - current.current
        : (target.current - current.current) * damping;

      const v = current.current;

      // One property write per frame, and only when it actually moved.
      if (Math.abs(v - lastWritten) > 0.002) {
        lastWritten = v;
        el.style.setProperty("--p", v.toFixed(4));
        setP(v);
      }

      if (heatMarks?.length) {
        let hottest = 0;
        for (const m of heatMarks) {
          const d = Math.abs(v - m) / heatWidth;
          if (d < 1) hottest = Math.max(hottest, 1 - smooth(d));
        }
        const h = Math.round(hottest * 100) / 100;
        if (h !== lastHeat) {
          lastHeat = h;
          el.style.setProperty("--heat", String(h));
        }
      }
    };

    raf.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf.current);
      io.disconnect();
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [damping, heatWidth]);

  return { ref, p };
}

/**
 * The hero's clip-path wipe, unchanged. Lines open from their bottom edge and
 * are eaten from the same edge, so type reads as film passing a gate instead of
 * an element with an opacity.
 */
export function wipe(enter: number, exit = 1): string {
  const top = (1 - clamp01(enter)) * 104;
  const bottom = (1 - clamp01(exit)) * 104;
  return `inset(${top.toFixed(2)}% -6% ${bottom.toFixed(2)}% -2%)`;
}

/**
 * Per-item stagger against a shared envelope.
 *
 * ⚠️ The `count` argument matters more than it looks. Without it the
 * denominator is `1 - step`, which only lets the FIRST item reach 1.0 — every
 * later item saturates lower, and the last one lands around 0.6–0.8. For an
 * opacity that means permanently faded; for a clip-path wipe it means text
 * that is permanently CUT OFF at the bottom. Both shipped, and the faded news
 * cards were mistaken for a blur.
 *
 * Pass `count` and the denominator becomes the window left after the whole
 * stagger has played out, so the last item reaches exactly 1.0.
 */
export const stagger = (e: number, index: number, step = 0.14, count?: number) => {
  const spread = count && count > 1 ? (count - 1) * step : step;
  const denom = Math.max(0.05, 1 - spread);
  return clamp01((e - index * step) / denom);
};

/** Sub-band: carve a slice out of a section's progress for one element. */
export const slice = (p: number, from: number, to: number) =>
  clamp01((p - from) / (to - from));

/** Count a figure up as the band fills. Format is caller's business. */
export const countTo = (p: number, value: number, from = 0.1, to = 0.65) =>
  value * outExpo(slice(p, from, to));

/**
 * Deterministic jitter — the scatter layouts need offsets that look random but
 * are identical on server and client, or React hydration screams.
 */
export function jitter(seed: string, spread = 1): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (((h >>> 0) % 2000) / 1000 - 1) * spread;
}
