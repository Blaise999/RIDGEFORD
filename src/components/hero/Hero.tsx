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
    eyebrow: "The euro",
    head: [{ text: "One currency." }, { text: "Twenty-one" }, { text: "countries", em: true }],
    lede:
      "Ridgeford holds euro accounts across the whole single-currency area — twenty-one members since Bulgaria joined on 1 January 2026. One IBAN, one supervisor, one deposit-protection scheme, and the same price whether the money goes to the next street or to Nicosia.",
    ledeShort:
      "Euro accounts across all twenty-one members of the single-currency area. One IBAN, one price, wherever it goes.",
    actions: [
      { label: "Open an account", href: "/signup", solid: true },
      { label: "See the rails", href: "#rails" },
    ],
    readout: [
      ["Euro area", "21 countries · EA21"],
      ["Licence", "Germany · BaFin supervised"],
      ["Protection", "100.000 € per depositor"],
    ],
  },
  {
    index: "02",
    eyebrow: "Rails",
    head: [{ text: "Ten seconds." }, { text: "Any hour." }, { text: "No surcharge", em: true }],
    lede:
      "Regulation (EU) 2024/886 has obliged every euro-area bank to send instant transfers since 9 October 2025, to price them no higher than a standard transfer, and to check the payee's name against the IBAN before you authorise. We do all three because it is the law, not because it is a feature.",
    ledeShort:
      "Instant euro transfers in under ten seconds, 24/7, at no extra cost — and a free name check before every one.",
    actions: [
      { label: "How a transfer works", href: "#rails", solid: true },
      { label: "What it costs", href: "#ledger" },
    ],
    readout: [
      ["Settlement", "Under 10 s · TIPS"],
      ["Availability", "24 / 7 / 365"],
      ["Name check", "Free · every transfer"],
    ],
  },
  {
    index: "03",
    eyebrow: "Frankfurt",
    head: [{ text: "Kaiserstraße 16." }, { text: "Six hundred metres" }, { text: "from the ECB", em: true }],
    lede:
      "We sit in the Bahnhofsviertel, on the street that runs from the Hauptbahnhof into the Innenstadt — a short walk from the Eurotower, where the European Central Bank supervises banks like this one, and from the Börsenplatz. Proximity to the supervisor is not a boast. It is simply where this business is done.",
    ledeShort:
      "Kaiserstraße 16, Bahnhofsviertel — a short walk from the Eurotower and the Börsenplatz.",
    actions: [
      { label: "Open an account", href: "/signup", solid: true },
      { label: "Find the house", href: "#house" },
    ],
    readout: [
      ["Registered", "Frankfurt am Main"],
      ["BIC", "RDGFDEFFXXX"],
      ["Supervisor", "BaFin · Bundesbank"],
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
            <a href="#tape">Europe</a>
            <a href="#coverage">Coverage</a>
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
