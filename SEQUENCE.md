# Hero frame sequences

The hero expects exactly what you described:

```
public/seq/     frame_001.webp  …  frame_241.webp     (desktop, 241 frames)
public/seq-m/   frame_001.webp  …  frame_237.webp     (mobile,  237 frames)
```

Wired in `src/components/hero/Hero.tsx`:

```ts
const SEQ_DESKTOP = { dir: "seq",   stem: "frame_", ext: "webp", pad: 3, first: 1, frameCount: 241 };
const SEQ_MOBILE  = { dir: "seq-m", stem: "frame_", ext: "webp", pad: 3, first: 1, frameCount: 237 };
```

`pad: 3` + `first: 1` produces `frame_001`. The breakpoint between the two is
820px.

**If your files are .jpg or .png**, change `ext` in those two objects and
nowhere else.

## One change from the InveXt original

`frameCount` is now set explicitly, so `probeCount()` returns immediately and
the component issues **zero HEAD requests**. The original discovered the length
with a doubling-then-binary search — roughly sixteen round trips before the
first pixel could be drawn. The probe is still there for sequences of unknown
length; it just no longer runs when you already know the answer.

Everything else is untouched: the `subdivide()` progressive load order, the
`nearest()` search over ready frames, `createImageBitmap` with decode-time
resizing, the `sig` redundant-draw guard, DPR capped at 2, and the
IntersectionObserver that halts the loop off-screen.

## Motion model

`src/lib/hero-motion.ts` is the InveXt file as-is — TRAVEL (per-plate crop
anchors lerped with smoothstep, plus the sine breath), HEAT (spikes only at
plate boundaries, written to `--heat`, consumed entirely in CSS), and WIPE
(separate enter/exit clip-path, so a line can be fully open and half-eaten at
once). Three plates, matching `PLATES = 3`.

The hero CSS lives at the end of `src/app/globals.css` under the `HERO` banner.
