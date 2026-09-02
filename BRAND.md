# Brand

## Palette — institutional neutral

| Role | Hex | Token |
|---|---|---|
| Page background | `#080808` | `--ink` / `bg-ink-50` |
| Sidebar / chrome | `#0c0c0c` | `--ink-2` / `bg-night-900` |
| Cards / panels | `#141414` | `--panel` |
| Elevated / hover | `#1c1c1c` | `--panel-2` |
| Border | `#2a2a2a` | `--line` / `border-ink-200` |
| Primary text | `#eeeeee` | `--paper` / `text-ink-900` |
| Secondary text | `#9a9a9a` | `--paper-2` / `text-ink-500` |
| Muted text | `#666666` | `--faint` / `text-ink-400` |
| Accent | `#8a9bab` | `--steel` |
| Accent hover | `#a0b0c0` | `--steel-lt` |
| Positive | `#3d9b6e` | `--up` |
| Negative | `#c45c5c` | `--down` |
| Warning | `#b87a4a` | `--warn` |

Green, red and amber appear on **data only** — never on a button, never as
decoration. A colour in this interface always means something.

Existing Tailwind class names (`gold-500`, `sienna`) still resolve — they now
point at steel values, so nothing broke during the swap. New work should use
`steel` / `--steel`.

## The mark

`src/components/brand/Logo.tsx` — built as SVG, not photographed. Crisp at 18px
in a sidebar and at 400px on the splash, and it inherits `currentColor`.

Three stacked bars narrowing upward on a heavier steel base: strata cut by a
ford, and a foundation. The weight sits at the bottom deliberately — the
tagline is *the foundation of European wealth*, so the mark should be
bottom-heavy.

Flat, monoline-thick, no gradient or bevel. The gold raster lockup is deleted,
along with `logo-full.png`, `logo-full-navy.png` and `logo-mark.png`.
`components/landing/Logo.tsx` is now a re-export shim so every old import path
keeps working.

```tsx
<Logo size="sm" />                      // sidebar
<Logo size="lg" showTagline />          // footer
<Logo size="xl" stacked showTagline />  // splash
<LogoMark className="h-6 w-6" />        // mark alone
```

Favicons at every size are regenerated from the same geometry.

## Splash

`src/components/brand/BrandSplash.tsx`, mounted on the landing page.

Blank `#080808` field → mark → tagline beneath → a hairline draws itself → the
whole overlay lifts with a 2 % scale so the page rises to meet you. About 1.5s.

Three rules keep it from being annoying: it shows **once per session**
(sessionStorage, so a fresh visit still gets the moment); it **never blocks** —
the landing is rendered underneath and an overlay lifts off it, so a JS failure
means you just see the site; and `prefers-reduced-motion` skips it entirely.

## Card

Rebuilt. The plate is a fine diagonal brushed-metal grain over near-black with
a real chip, not a purple gradient. Says RIDGEFORD. The old one still said
CREST CAPITAL, as did `CardsShowcase` and `ScreenCard` — all three fixed.
