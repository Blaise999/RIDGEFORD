"use client";

import { useEffect, useState } from "react";

import {
  RAIL_STAGES,
  RAIL_FACTS,
  TAPE,
  TAPE_MORE,
  TAPE_EXTRA,
  TAPE_MEDIA,
  FACE_BY_STORY,
  mediaUrl,
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
            A Friday-evening invoice used to mean the supplier waited until
            Monday. That is over. Since 9 October 2025 every euro-area bank has
            been legally required to move euros in under ten seconds at any hour,
            charge no more for it than for the slow version, and check the
            payee&apos;s name against the IBAN first. Below is what happens in
            those ten seconds, in order, with nothing left out.
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
                    transform: `translate3d(0, ${(1 - stagger(slice(p, 0.15, 0.8), i, 0.1, RAIL_STAGES.length)) * 18}px, 0)`,
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
                clipPath: wipe(stagger(slice(p, 0.4, 0.95), i, 0.07, RAIL_FACTS.length)),
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

/** Fourteen cards across the scatter field. */
const WIRE: TapeItem[] = [...TAPE, ...TAPE_MORE, ...TAPE_EXTRA];

/**
 * Portraits resolve once per mount from /api/faces. Until they land (or if
 * they never do) each card shows initials, so nothing shifts and nothing
 * breaks.
 */
function useFaces() {
  const [map, setMap] = useState<Record<string, { src: string; page: string }>>({});
  useEffect(() => {
    let on = true;
    fetch("/api/faces")
      .then((r) => r.json())
      .then((j) => {
        if (!on || !j?.ok) return;
        setMap(
          Object.fromEntries(
            (j.faces || []).map((f: any) => [f.title, { src: f.src, page: f.page }])
          )
        );
      })
      .catch(() => {});
    return () => {
      on = false;
    };
  }, []);
  return map;
}

export function ZoneTape() {
  const { ref, p } = useBandProgress({
    window: [0.02, 0.8],
    heatMarks: [0.34, 0.68],
    heatWidth: 0.07,
  });
  const faces = useFaces();

  return (
    <section ref={ref as any} id="tape" className="zn zn--tape">
      {/* running head — a real tape, moving on its own clock */}
      <div className="tape__rule" aria-hidden="true">
        <div className="tape__run marquee-slow">
          {[...Array(2)].map((_, dup) => (
            <span key={dup} className="tape__runIn">
              {WIRE.map((t) => (
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
            Every figure below links back to the ECB, Eurostat or the EPC
            document it came from. We are not going to summarise a central bank
            at you and hope you take our word for the number — the primary
            source is one tap away and you should use it. Positions as of {AS_OF}.
          </p>
        </header>

        <p className="swipe-hint mono" aria-hidden="true">
          Swipe <i />
          {WIRE.length} stories
        </p>

        <div className="scat">
          {WIRE.map((item, i) => (
            <TapeCard key={item.id} item={item} p={p} index={i} total={WIRE.length} faces={faces} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TapeCard({
  item,
  p,
  index,
  total,
  faces,
}: {
  item: TapeItem;
  p: number;
  index: number;
  total: number;
  faces: Record<string, { src: string; page: string }>;
}) {
  // Deterministic per-card drift: same on server and client, no hydration noise.
  const drift = jitter(item.id, 1) * 26;

  /*
    THE "BLURRY NEWS" BUG.
    There was never a blur. Cards faded in with `opacity: 0.15 + 0.85 * enter`,
    and `enter` came from a stagger with a FIXED 0,055 step per card. With 22
    cards that is 21 × 0,055 = 1,155 of offset against a band that only ever
    reaches 1.0 — so card 18 topped out at 16 % opacity and cards 19–21 sat at
    15 % forever. Everything past the first few looked washed out, which reads
    exactly like being out of focus.

    The step now scales to the number of cards and the whole sequence finishes
    at 55 % of the band, so every card is fully opaque well before you have
    scrolled past it.
  */
  const spread = 0.55;                                  // stagger occupies 55% of the band
  const step = spread / Math.max(1, total - 1);
  const offset = index * step;
  /*
    Note the denominator: the shared stagger() helper divides by (1 - step),
    which only reaches 1.0 for the FIRST item. Dividing by the remaining
    window (1 - spread) instead means the LAST card also reaches full opacity
    — which is the whole point.
  */
  const enter = clamp01((slice(p, 0.02, 0.72) - offset) / (1 - spread));
  const shot = TAPE_MEDIA[item.id];
  const person = FACE_BY_STORY[item.id];
  const portrait = person ? faces[person.title] : undefined;

  return (
    <article
      className={`sc sc--${item.size}`}
      style={{
        transform: `translate3d(0, ${(1 - enter) * (34 + drift) + drift * (0.5 - p) * 0.9}px, 0)`,
        // Floor raised too: 0.15 was unreadable even mid-transition.
        opacity: 0.4 + 0.6 * enter,
      }}
    >
      {shot && (
        <figure className="sc__shot">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {/*
            The lead card is ~780px wide on a 1400px container, so a 900px
            source is roughly half-resolution on any retina display — which
            is why these looked soft on desktop. srcSet lets the browser take
            a 2x render where the screen warrants it.
          */}
          <img
            src={mediaUrl(shot.file, 1200)}
            srcSet={`${mediaUrl(shot.file, 900)} 900w, ${mediaUrl(shot.file, 1600)} 1600w, ${mediaUrl(shot.file, 2200)} 2200w`}
            sizes="(max-width: 820px) 90vw, (max-width: 1200px) 50vw, 780px"
            alt={shot.alt}
            loading="lazy"
            decoding="async"
            style={{
              // Each frame drifts a little as the band fills, so a wall of
              // stills doesn't sit dead on the page.
              objectPosition: `${(46 + drift * 0.5).toFixed(0)}% 50%`,
            }}
          />
          <figcaption>
            <a href={shot.page} target="_blank" rel="noreferrer">
              {shot.author} · {shot.license}
            </a>
          </figcaption>
        </figure>
      )}

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

      {person && (
        // News context only — captioned with who they are and what they run,
        // never implying they are a customer or endorse anything.
        <a
          className="sc__face"
          href={portrait?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(person.title)}`}
          target="_blank"
          rel="noreferrer"
          title={`${person.name} — ${person.role}`}
        >
          <Portrait src={portrait?.src} name={person.name} />
          <span>
            <b>{person.name}</b>
            <i>{person.role}</i>
          </span>
        </a>
      )}

      <a className="sc__src mono" href={item.href} target="_blank" rel="noreferrer">
        {item.source} ↗
      </a>
    </article>
  );
}

/**
 * A portrait that cannot fail visibly.
 *
 * An <img> whose src 404s renders its alt text — which is why broken avatars
 * printed "Chri" and "Bori" inside the circles instead of showing a face.
 * onError swaps to initials, so however the upstream resolves, the card still
 * looks deliberate.
 */
function Portrait({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(false);

  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");

  if (!src || failed) {
    return (
      <span className="sc__initials" aria-hidden="true">
        {initials}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
