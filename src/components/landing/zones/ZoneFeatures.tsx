"use client";

import Link from "next/link";
import { FEATURES, HOUSE, AS_OF } from "@/lib/euro-facts";
import { useBandProgress, slice, stagger, wipe, jitter, clamp01, lerp } from "@/lib/band-motion";
import { ArrowRight, Check } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   ZONE 06 — THE INSTRUMENT
   Two columns that travel in opposite directions as the band fills — the left
   rail rises, the right sinks — so scrolling shears the layout instead of
   sliding it. The centre hairline stays fixed, which is what makes the shear
   legible rather than just wobbly. Killed under 900px, where opposing motion
   is nausea rather than interest.
   ═════════════════════════════════════════════════════════════════════════ */

export function ZoneFeatures() {
  const { ref, p } = useBandProgress({ window: [0.02, 0.82], damping: 0.11 });
  const shear = (p - 0.5) * 2; // −1 → +1

  const left = FEATURES.filter((_, i) => i % 2 === 0);
  const right = FEATURES.filter((_, i) => i % 2 === 1);

  return (
    <section ref={ref as any} id="instrument" className="zn zn--feat">
      <div className="zn__in">
        <header className="zn__head zn__head--split">
          <div>
            <p className="eyebrow mono">06 — The instrument</p>
            <h2 className="zn__h" style={{ clipPath: wipe(slice(p, 0.02, 0.26)) }}>
              What the account
              <br />
              actually <em>does</em>
            </h2>
          </div>
          <p className="zn__lede">
            Every capability below is printed with the constraint that comes with
            it. A feature list with no constraints in it is an advert, and you
            can read one of those anywhere.
          </p>
        </header>

        <p className="swipe-hint mono" aria-hidden="true">
          Swipe <i />
          {FEATURES.length} capabilities
        </p>

        <div className="feat">
          <div className="feat__col" style={{ transform: `translate3d(0, ${(-shear * 26).toFixed(1)}px, 0)` }}>
            {left.map((f, i) => (
              <FeatureCard key={f.k} f={f} p={p} i={i * 2} />
            ))}
          </div>

          <i className="feat__spine" aria-hidden="true" style={{ transform: `scaleY(${clamp01(p * 1.4)})` }} />

          <div className="feat__col" style={{ transform: `translate3d(0, ${(shear * 26).toFixed(1)}px, 0)` }}>
            {right.map((f, i) => (
              <FeatureCard key={f.k} f={f} p={p} i={i * 2 + 1} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  f,
  p,
  i,
}: {
  f: (typeof FEATURES)[number];
  p: number;
  i: number;
}) {
  const enter = stagger(slice(p, 0.06, 0.94), i, 0.06, FEATURES.length);
  const drift = jitter(f.k, 1) * 8;

  return (
    <article
      className="ft"
      style={{
        opacity: 0.12 + 0.88 * enter,
        transform: `translate3d(${(drift * (1 - enter)).toFixed(1)}px, ${((1 - enter) * 30).toFixed(1)}px, 0)`,
      }}
    >
      <h3 className="ft__h" style={{ clipPath: wipe(enter) }}>
        {f.head}
      </h3>
      <p className="ft__b">{f.body}</p>
      <dl className="ft__spec">
        {f.spec.map(([k, v], n) => (
          <div key={k} style={{ opacity: 0.3 + 0.7 * stagger(enter, n, 0.12, f.spec.length) }}>
            <dt className="mono">{k}</dt>
            <dd className="mono">{v}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ZONE 07 — THE CLOSE
   The only zone that pushes rather than reports. Letter-spacing on the
   headline contracts as the band fills — the type tightens up as you arrive,
   which reads as the page settling. Nothing else moves.
   ═════════════════════════════════════════════════════════════════════════ */

export function ZoneClose() {
  const { ref, p } = useBandProgress({ window: [0.1, 0.7] });
  const tighten = lerp(0.02, -0.045, clamp01(p));

  return (
    <section ref={ref as any} id="access" className="zn zn--close">
      <div className="zn__in">
        <p className="eyebrow mono">07 — Open an account</p>

        <h2
          className="close__h"
          style={{ letterSpacing: `${tighten.toFixed(4)}em`, clipPath: wipe(slice(p, 0.05, 0.4)) }}
        >
          Banking in euros,
          <br />
          <em>from Frankfurt</em>
        </h2>

        <ul className="close__list">
          {[
            "Verification takes about ten minutes and needs a photo ID and proof of address.",
            "Compliance decides most files within one business day.",
            "Your IBAN is issued on approval. Nothing is charged before then.",
          ].map((l, i) => (
            <li key={l} style={{ clipPath: wipe(stagger(slice(p, 0.2, 0.75), i, 0.14, 3)) }}>
              <Check className="close__tick" strokeWidth={3} />
              {l}
            </li>
          ))}
        </ul>

        <div className="close__act">
          <Link href="/signup" className="hbtn hbtn--solid">
            Open an account <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="hbtn">
            I already bank here
          </Link>
        </div>

        <footer className="close__foot">
          <div>
            <p className="mono">{HOUSE.legal}</p>
            <p>
              {HOUSE.street} · {HOUSE.postal} {HOUSE.city} · {HOUSE.country}
            </p>
          </div>
          <div>
            <p className="mono">Supervision</p>
            <p>{HOUSE.regulator}</p>
          </div>
          <div>
            <p className="mono">Deposit protection</p>
            <p>
              {HOUSE.protection} · {HOUSE.scheme}
            </p>
          </div>
          <div>
            <p className="mono">Figures on this page</p>
            <p>Sourced and dated. Positions as of {AS_OF}.</p>
          </div>
        </footer>
      </div>
    </section>
  );
}
