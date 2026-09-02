"use client";

import {
  RAIL_STAGES,
  RAIL_FACTS,
  TAPE,
  AS_OF,
  type TapeItem,
} from "@/lib/euro-facts";
import {
  useBandProgress,
  slice,
  stagger,
  wipe,
  countTo,
  jitter,
  clamp01,
} from "@/lib/band-motion";

/* ══════════════════════════════════════════════════════════════════════════
   ZONE 01 — THE RAIL
   A settlement clock. The band's progress *is* the ten seconds: as you scroll,
   a hairline runs the length of the section and each stage lights as the clock
   passes it. The counter reads real elapsed seconds, so the motion is not
   decoration — it's the claim being made, drawn to scale.
   ═════════════════════════════════════════════════════════════════════════ */

export function ZoneRail() {
  const { ref, p } = useBandProgress({ window: [0.05, 0.72], damping: 0.1 });
  const clock = slice(p, 0.12, 0.82);
  const seconds = countTo(clock, 10, 0, 1);

  return (
    <section
      ref={ref as any}
      id="rails"
      className="zn zn--rail"
      style={{ ["--clock" as any]: clock.toFixed(4) }}
    >
      <div className="zn__in">
        <header className="zn__head zn__head--split">
          <div>
            <p className="eyebrow mono">01 — Rails</p>
            <h2 className="zn__h" style={{ clipPath: wipe(slice(p, 0.02, 0.3)) }}>
              Ten seconds is
              <br />
              <em>the law</em>, not our
              <br />
              marketing.
            </h2>
          </div>
          <p className="zn__lede" style={{ clipPath: wipe(slice(p, 0.08, 0.36)) }}>
            Since 9 October 2025 every euro-area bank has been obliged to send
            instant euro transfers, price them no higher than a normal transfer,
            and check the payee's name against the IBAN before you authorise.
            Regulation (EU) 2024/886 wrote all three into statute. What follows
            is what actually happens between your thumb and their account.
          </p>
        </header>

        {/* ── the clock ─────────────────────────────────────────────── */}
        <div className="rail">
          <div className="rail__gauge" aria-hidden="true">
            <i className="rail__fill" />
            <span className="rail__read mono">
              {seconds.toFixed(1).replace(".", ",")} s
            </span>
          </div>

          <ol className="rail__stages">
            {RAIL_STAGES.map((s, i) => {
              const at = (i + 0.5) / RAIL_STAGES.length;
              const on = clock >= at - 0.06;
              return (
                <li
                  key={s.k}
                  className={on ? "rail__stage is-on" : "rail__stage"}
                  style={{
                    opacity: 0.25 + 0.75 * clamp01((clock - (at - 0.22)) / 0.22),
                    transform: `translate3d(0, ${(1 - stagger(slice(p, 0.15, 0.8), i, 0.1)) * 18}px, 0)`,
                  }}
                >
                  <span className="rail__t mono">{s.t}</span>
                  <span className="rail__dot" aria-hidden="true" />
                  <h3 className="rail__k">{s.k}</h3>
                  <p className="rail__v">{s.v}</p>
                </li>
              );
            })}
          </ol>
        </div>

        {/* ── the facts grid — hairlines are grid gaps over a line-colour bg ─ */}
        <ul className="facts">
          {RAIL_FACTS.map((f, i) => (
            <li
              key={f.k}
              className="fact"
              style={{
                clipPath: wipe(stagger(slice(p, 0.4, 0.95), i, 0.07)),
              }}
            >
              <p className="fact__k mono">{f.k}</p>
              <p className="fact__v">{f.v}</p>
              <p className="fact__note">{f.note}</p>
            </li>
          ))}
        </ul>

        <p className="note mono">
          Instant transfers settle over TIPS or RT1 in central bank money.
          Electronic money institutions and payment institutions come into scope
          on 9 April 2027; non-euro-area providers on 9 July 2027.
        </p>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ZONE 02 — THE TAPE
   European finance, scattered. Cards claim 1–2 columns and 1–2 rows on a
   twelve-track grid, and each one carries its own parallax coefficient derived
   from a deterministic hash of its id — so the field drifts at eight different
   speeds without a single hand-tuned constant.
   ═════════════════════════════════════════════════════════════════════════ */

export function ZoneTape() {
  const { ref, p } = useBandProgress({
    window: [0.02, 0.8],
    heatMarks: [0.34, 0.68],
    heatWidth: 0.07,
  });

  return (
    <section ref={ref as any} id="tape" className="zn zn--tape">
      {/* running head — a real tape, moving on its own clock */}
      <div className="tape__rule" aria-hidden="true">
        <div className="tape__run marquee-slow">
          {[...Array(2)].map((_, dup) => (
            <span key={dup} className="tape__runIn">
              {TAPE.map((t) => (
                <span key={t.id + dup} className="tape__tick mono">
                  <b>{t.tag}</b>
                  {t.figure ? <em>{t.figure}</em> : null}
                  {t.head}
                  <i>·</i>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <div className="zn__in">
        <header className="zn__head">
          <p className="eyebrow mono">02 — The wire</p>
          <h2 className="zn__h" style={{ clipPath: wipe(slice(p, 0.02, 0.26)) }}>
            What moved in <em>Europe</em>
          </h2>
          <p className="zn__lede">
            Dated, sourced, and linked out. We publish what the euro area's
            institutions published, not a summary of it — because a bank that
            paraphrases the ECB at you is a bank hoping you won't check.
            Positions as of {AS_OF}.
          </p>
        </header>

        <div className="scat">
          {TAPE.map((item, i) => (
            <TapeCard key={item.id} item={item} p={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TapeCard({ item, p, index }: { item: TapeItem; p: number; index: number }) {
  // Deterministic per-card drift: same on server and client, no hydration noise.
  const drift = jitter(item.id, 1) * 26;
  const enter = stagger(slice(p, 0.08, 0.92), index, 0.055);

  return (
    <article
      className={`sc sc--${item.size}`}
      style={{
        transform: `translate3d(0, ${(1 - enter) * (34 + drift) + drift * (0.5 - p) * 0.9}px, 0)`,
        opacity: 0.15 + 0.85 * enter,
      }}
    >
      <div className="sc__top">
        <span className={`sc__tag mono sc__tag--${item.tag.toLowerCase()}`}>
          {item.tag}
        </span>
        <time className="sc__date mono">{item.date}</time>
      </div>

      {item.figure && (
        <p className="sc__fig">
          {item.figure}
          <span className="sc__figNote">{item.figureNote}</span>
        </p>
      )}

      <h3 className="sc__h">{item.head}</h3>
      <p className="sc__b">{item.body}</p>

      <a className="sc__src mono" href={item.href} target="_blank" rel="noreferrer">
        {item.source} ↗
      </a>
    </article>
  );
}
