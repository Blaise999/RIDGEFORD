"use client";

import { useState } from "react";
import Link from "next/link";
import ScrollSequence, { type SeqConfig } from "./ScrollSequence";
import { Logo } from "@/components/landing/Logo";
import {
  PLATES,
  SEG,
  clamp01,
  cropAt,
  envelopeAt,
  heatAt,
  localOf,
  plateOf,
  stagger,
  wipe,
} from "@/lib/hero-motion";

/* ---------------------------------------------------------------- frames --
 * Exactly as supplied:
 *   /public/seq    frame_001 … frame_241   (desktop)
 *   /public/seq-m  frame_001 … frame_237   (mobile)
 *
 * `frameCount` is set explicitly, so the component issues ZERO HEAD requests
 * discovering the length — the old binary probe cost ~16 round trips before the
 * first pixel could be drawn. `pad: 3` and `first: 1` produce frame_001.
 *
 * If your files are .jpg rather than .webp, change `ext` here and nowhere else.
 * ------------------------------------------------------------------------- */

const SEQ_DESKTOP: SeqConfig = {
  dir: "seq",
  stem: "frame_",
  ext: "webp",
  pad: 3,
  first: 1,
  frameCount: 241,
};

const SEQ_MOBILE: SeqConfig = {
  dir: "seq-m",
  stem: "frame_",
  ext: "webp",
  pad: 3,
  first: 1,
  frameCount: 237,
};

/* ------------------------------------------------------------------ copy -- */

interface Plate {
  index: string;
  eyebrow: string;
  head: { text: string; em?: boolean }[];
  lede: string;
  ledeShort: string;
  actions: { label: string; href: string; solid?: boolean }[];
  readout: [string, string][];
}

const DECK: Plate[] = [
  {
    index: "01",
    eyebrow: "Frankfurt · European banking",
    head: [
      { text: "Built in Frankfurt." },
      { text: "Made for how" },
      { text: "money moves.", em: true },
    ],
    lede:
      "Your financial world should feel considered, not complicated. Ridgeford puts euro banking first, with a dedicated U.S. dollar option for people whose money moves across borders.",
    ledeShort:
      "Euro-first banking from Frankfurt, with a dedicated U.S. dollar account option when you need it.",
    actions: [
      { label: "Explore accounts", href: "/signup", solid: true },
      { label: "Our approach", href: "#rails" },
    ],
    readout: [
      ["Head office", "Frankfurt am Main"],
      ["Primary currency", "EUR · €"],
      ["Also available", "USD · $"],
    ],
  },
  {
    index: "02",
    eyebrow: "01 / The euro experience",
    head: [
      { text: "Europe, without" },
      { text: "the friction.", em: true },
    ],
    lede:
      "Move euros across the SEPA area, keep your spending organised and find the details that matter in one clear place. A European banking experience designed around your day, not the other way round.",
    ledeShort:
      "SEPA payments, clear account details and a focused euro banking experience — without the noise.",
    actions: [
      { label: "Explore euro banking", href: "#rails", solid: true },
      { label: "European markets", href: "#tape" },
    ],
    readout: [
      ["Currency", "EUR"],
      ["Payment network", "SEPA"],
      ["Banking perspective", "Europe first"],
    ],
  },
  {
    index: "03",
    eyebrow: "02 / The U.S. connection",
    head: [
      { text: "Frankfurt at heart." },
      { text: "Connected across" },
      { text: "the Atlantic.", em: true },
    ],
    lede:
      "Our European home remains the centre of Ridgeford. For dollar-led finances, there is an additional USD account option and a U.S. presence in Stamford, Connecticut. One brand, with room to move.",
    ledeShort:
      "Frankfurt is home. USD accounts add a U.S. dimension, with a Connecticut office presence.",
    actions: [
      { label: "Explore USD accounts", href: "#usd-desk", solid: true },
      { label: "Open an account", href: "/signup" },
    ],
    readout: [
      ["Headquarters", "Frankfurt, Germany"],
      ["U.S. office", "Stamford, Connecticut"],
      ["Account options", "EUR · USD"],
    ],
  },
];

/* ------------------------------------------------------------- component -- */

if (process.env.NODE_ENV !== "production" && DECK.length !== PLATES) {
  console.warn(
    `hero: DECK has ${DECK.length} plates, motion model expects ${PLATES} (SEG=${SEG})`
  );
}

export default function Hero() {
  const [p, setProgress] = useState(0);
  const [frame, setFrame] = useState({ i: 0, n: 0 });

  const active = plateOf(p);

  return (
    <ScrollSequence
      desktop={SEQ_DESKTOP}
      mobile={SEQ_MOBILE}
      scrollLength={4.8}
      mobileScrollLength={3.2}
      damping={0.12}
      crop={cropAt}
      heat={heatAt}
      onProgress={setProgress}
      onFrame={(i, n) => setFrame({ i, n })}
    >
      <div className="hero">
        {/* ---------------- masthead ---------------- */}
        <header className="hero__nav">
          <Logo size="sm" />

          <nav aria-label="Primary">
            <a href="#rails">Rails</a>
            <a href="#tape">European markets</a>
            <a href="#usd-desk">USD desk</a>
            <a href="#house">Frankfurt</a>
            <a href="#ledger">Pricing</a>
          </nav>

          <div className="hero__auth">
            <Link href="/login" className="hbtn">
              Log in
            </Link>
            <Link href="/signup" className="hbtn hbtn--solid">
              Open account
            </Link>
          </div>
        </header>

        <div className="hero__position mono" aria-label="Ridgeford offices and currency options">
          <span className="hero__position-office">FRANKFURT <i aria-hidden="true" /> STAMFORD, CT</span>
          <span className="hero__position-currencies"><b>EUR</b> PRIMARY <i aria-hidden="true" /> <b>USD</b> AVAILABLE</span>
        </div>

        {/* ---------------- aperture blades ---------------- */}
        <div className="ap" aria-hidden="true">
          <i className="ap__blade ap__blade--t" />
          <i className="ap__blade ap__blade--b" />
          <i className="ap__cut" />
        </div>

        {/* ---------------- plates ---------------- */}
        <div className="hero__deck">
          {DECK.map((plate, i) => {
            const local = localOf(p, i);
            const first = i === 0;
            const last = i === PLATES - 1;
            const { enter, exit, presence } = envelopeAt(local, first, last);

            const live = presence > 0.72;
            const off = presence < 0.08;
            const visualOpacity =
              i === active ? presence : Math.max(0, (presence - 0.35) / 0.65);

            return (
              <article
                key={plate.index}
                className={`plate plate--${plate.index}`}
                data-on={live ? "true" : undefined}
                data-off={off ? "true" : undefined}
                style={{
                  opacity: visualOpacity,
                  zIndex: i === active ? 4 : live ? 2 : 1,
                  transform: `translate3d(0, ${(1 - enter) * 14 + (1 - exit) * -14}px, 0)`,
                  pointerEvents: live ? "auto" : "none",
                  visibility: off ? "hidden" : "visible",
                }}
                aria-hidden={!live}
              >
                <p className="plate__eyebrow mono" style={{ clipPath: wipe(enter, exit) }}>
                  <span className="plate__no">{plate.index}</span>
                  {plate.eyebrow}
                  <i
                    className="plate__rule"
                    style={{ transform: `scaleX(${clamp01(local)})` }}
                    aria-hidden="true"
                  />
                </p>

                <h1 className="plate__h">
                  {plate.head.map((line, k) => (
                    <span
                      key={k}
                      className="plate__line"
                      style={{ clipPath: wipe(stagger(enter, k), exit) }}
                    >
                      <span className={line.em ? "plate__em" : undefined}>{line.text}</span>
                    </span>
                  ))}
                </h1>

                <p className="plate__lede">
                  <span className="only-wide">{plate.lede}</span>
                  <span className="only-narrow">{plate.ledeShort}</span>
                </p>

                <div className="plate__actions">
                  {plate.actions.map((a) => (
                    <a
                      key={a.label}
                      href={a.href}
                      className={a.solid ? "hbtn hbtn--solid" : "hbtn"}
                      tabIndex={live ? 0 : -1}
                    >
                      {a.label}
                    </a>
                  ))}
                </div>

                <dl className="plate__readout">
                  {plate.readout.map(([k, v]) => (
                    <div key={k}>
                      <dt className="mono">{k}</dt>
                      <dd className="mono">{v}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            );
          })}
        </div>

        {/* ---------------- transport ---------------- */}
        <div className="tp" aria-hidden="true">
          <ol className="tp__segs">
            {DECK.map((plate, i) => (
              <li key={plate.index} className={i === active ? "tp__seg is-on" : "tp__seg"}>
                <i style={{ transform: `scaleX(${clamp01(localOf(p, i))})` }} />
                <span className="mono">{plate.eyebrow}</span>
              </li>
            ))}
          </ol>
          <p className="mono tp__frame">
            {frame.n > 0
              ? `FRAME ${String(frame.i + 1).padStart(4, "0")} / ${String(frame.n).padStart(4, "0")}`
              : "FRAME ---- / ----"}
          </p>
        </div>

        {/* ---------------- scroll cue ---------------- */}
        <div className="hero__cue mono" style={{ opacity: clamp01(1 - p * 16) }} aria-hidden="true">
          <span>Scroll</span>
          <i />
        </div>
      </div>
    </ScrollSequence>
  );
}
