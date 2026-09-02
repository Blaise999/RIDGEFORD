"use client";

import { useMemo, useState } from "react";

/** Tiny inline trend line used in market rows and the crypto bar. */
export function Sparkline({
  data,
  up,
  width = 96,
  height = 28,
  strokeWidth = 1.6,
}: {
  data: number[];
  up: boolean;
  width?: number;
  height?: number;
  strokeWidth?: number;
}) {
  const path = useMemo(() => {
    const pts = (data || []).filter((n) => Number.isFinite(n));
    if (pts.length < 2) return null;
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const span = max - min || 1;
    const step = width / (pts.length - 1);
    return pts
      .map((p, i) => {
        const x = i * step;
        const y = height - ((p - min) / span) * (height - 2) - 1;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [data, width, height]);

  const colour = up ? "#16c784" : "#ea3943";

  if (!path) {
    return <div className="skeleton" style={{ width, height }} aria-hidden />;
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="overflow-visible">
      <path d={path} fill="none" stroke={colour} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type Point = { t: number; p: number };

/**
 * The detail-page chart. Hand-rolled SVG — no chart library, so it stays
 * fast and matches the desk's typography exactly. Hover / drag scrubs the
 * series and reports the price at that moment.
 */
export function PriceChart({
  series,
  height = 280,
  onScrub,
}: {
  series: Point[];
  height?: number;
  onScrub?: (p: Point | null) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 1000;
  const H = height;
  const PAD = 8;

  const { path, area, min, max, first, last, up } = useMemo(() => {
    const pts = (series || []).filter((s) => Number.isFinite(s?.p));
    if (pts.length < 2) {
      return { path: "", area: "", min: 0, max: 0, first: 0, last: 0, up: true };
    }
    const ps = pts.map((s) => s.p);
    const mn = Math.min(...ps);
    const mx = Math.max(...ps);
    const span = mx - mn || 1;
    const step = W / (pts.length - 1);
    const xy = pts.map((s, i) => {
      const x = i * step;
      const y = PAD + (1 - (s.p - mn) / span) * (H - PAD * 2);
      return [x, y] as const;
    });
    const p = xy.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    return {
      path: p,
      area: `${p} L${W},${H} L0,${H} Z`,
      min: mn,
      max: mx,
      first: ps[0],
      last: ps[ps.length - 1],
      up: ps[ps.length - 1] >= ps[0],
    };
  }, [series, H]);

  const colour = up ? "#16c784" : "#ea3943";

  function move(clientX: number, rect: DOMRect) {
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const idx = Math.round(ratio * (series.length - 1));
    setHover(idx);
    onScrub?.(series[idx] || null);
  }

  if (!path) {
    return <div className="skeleton w-full" style={{ height }} aria-hidden />;
  }

  const hoverPt = hover != null ? series[hover] : null;
  const hoverX = hover != null ? (hover / (series.length - 1)) * W : 0;
  const hoverY =
    hoverPt != null
      ? PAD + (1 - (hoverPt.p - min) / (max - min || 1)) * (H - PAD * 2)
      : 0;

  return (
    <div className="relative select-none">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        preserveAspectRatio="none"
        className="touch-none"
        onMouseMove={(e) => move(e.clientX, e.currentTarget.getBoundingClientRect())}
        onMouseLeave={() => {
          setHover(null);
          onScrub?.(null);
        }}
        onTouchStart={(e) => move(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
        onTouchMove={(e) => move(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
        onTouchEnd={() => {
          setHover(null);
          onScrub?.(null);
        }}
      >
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colour} stopOpacity="0.22" />
            <stop offset="100%" stopColor={colour} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1="0"
            x2={W}
            y1={PAD + f * (H - PAD * 2)}
            y2={PAD + f * (H - PAD * 2)}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path d={area} fill="url(#chartFill)" />
        <path
          d={path}
          fill="none"
          stroke={colour}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {hoverPt && (
          <>
            <line
              x1={hoverX}
              x2={hoverX}
              y1="0"
              y2={H}
              stroke="rgba(201,162,39,0.55)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={hoverX} cy={hoverY} r="4" fill={colour} stroke="#0b0e13" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>

      <div className="pointer-events-none absolute inset-y-0 right-0 flex flex-col justify-between py-1 text-[10.5px] text-ink-400 tnum">
        <span className="bg-ink-50/70 px-1 rounded">{fmtAxis(max)}</span>
        <span className="bg-ink-50/70 px-1 rounded">{fmtAxis(min)}</span>
      </div>
    </div>
  );
}

function fmtAxis(v: number) {
  const abs = Math.abs(v);
  const dp = abs < 1 ? 4 : abs < 100 ? 2 : 0;
  return `${v.toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp })} €`;
}
