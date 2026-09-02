"use client";

import Link from "next/link";
import { cx } from "@/lib/utils";

/**
 * RIDGEFORD — the mark.
 *
 * Built, not photographed: an SVG that stays crisp at 18px in a sidebar and at
 * 400px on a splash screen, and inherits `currentColor` so it works on any
 * surface without shipping a second file.
 *
 * The idea is a ford — a crossing over water — cut into a ridge, drawn as
 * three stacked bars of decreasing width sitting on a heavier base. Read it
 * as strata, as a foundation, or as a bank's steps. The heavy base bar is the
 * whole point: the tagline is "the foundation of European wealth", so the
 * weight belongs at the bottom.
 *
 * Deliberately flat, deliberately monoline-thick. No gradient, no bevel, no
 * gold — those read as 2011 fintech, and this is meant to look like an
 * institution that predates all of us.
 */
export function LogoMark({
  className,
  style,
  title = "Ridgeford",
}: {
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label={title}
    >
      {/* the ridge — three strata, each narrower than the one below */}
      <rect x="8"  y="16" width="48" height="7" rx="1.5" fill="currentColor" opacity="0.42" />
      <rect x="14" y="27" width="36" height="7" rx="1.5" fill="currentColor" opacity="0.68" />
      <rect x="20" y="38" width="24" height="7" rx="1.5" fill="currentColor" />
      {/* the foundation */}
      <rect x="4"  y="50" width="56" height="9" rx="2"   fill="currentColor" />
    </svg>
  );
}

/**
 * The wordmark. Bodoni's thick/thin contrast does the work at display sizes;
 * the tracking is opened up because a didone set tight reads as cramped rather
 * than as authoritative.
 */
export function Wordmark({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={cx("font-display leading-none tracking-[0.04em]", className)}
      style={{ fontWeight: 600, ...style }}
    >
      RIDGEFORD
    </span>
  );
}

const SIZES = {
  sm: { mark: 20, word: 15, gap: "gap-2" },
  md: { mark: 26, word: 19, gap: "gap-2.5" },
  lg: { mark: 40, word: 29, gap: "gap-3.5" },
  xl: { mark: 72, word: 52, gap: "gap-5" },
} as const;

/**
 * Full lockup. `href={null}` renders a plain span — the splash screen and the
 * footer shouldn't be links to the page you're already on.
 */
export function Logo({
  className,
  size = "md",
  showTagline = false,
  stacked = false,
  href = "/",
}: {
  className?: string;
  size?: keyof typeof SIZES;
  showTagline?: boolean;
  stacked?: boolean;
  href?: string | null;
  /** Accepted and ignored — the mark is monochrome now and needs no variant. */
  onDark?: boolean;
  useChameleon?: boolean;
}) {
  const s = SIZES[size];

  const inner = (
    <>
      <span className={cx("inline-flex items-center", s.gap)}>
        <LogoMark className="shrink-0 text-[#eeeeee]" style={{ width: s.mark, height: s.mark }} />
        <Wordmark className="text-[#eeeeee]" style={{ fontSize: s.word }} />
      </span>
      {showTagline && (
        <span
          className="block text-[#8a9bab]"
          style={{
            fontSize: Math.max(9, s.word * 0.31),
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            marginTop: s.word * 0.42,
          }}
        >
          The foundation of European wealth
        </span>
      )}
    </>
  );

  const cls = cx(
    "inline-flex focus-ring",
    stacked ? "flex-col items-center text-center" : "flex-col items-start",
    className
  );

  if (href === null) return <span className={cls}>{inner}</span>;

  return (
    <Link href={href} className={cls} aria-label="Ridgeford home">
      {inner}
    </Link>
  );
}

export default Logo;
