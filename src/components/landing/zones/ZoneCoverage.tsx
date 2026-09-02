"use client";

import {
  EURO_AREA,
  SEPA_NON_EURO,
  HOUSE,
  MEDIA,
  mediaUrl,
  PRICE_ROWS,
  LEDGER_FIGURES,
} from "@/lib/euro-facts";
import {
  useBandProgress,
  slice,
  stagger,
  wipe,
  jitter,
  clamp01,
  lerp,
} from "@/lib/band-motion";

/* ══════════════════════════════════════════════════════════════════════════
   ZONE 03 — COVERAGE
   Twenty-one countries as a constellation rather than a list. Each tile is
   placed on a grid but nudged off it by a hash of its ISO code, so the field
   is irregular without being random on every render. Bulgaria is called out
   because it is genuinely new — EA21 dates from 1 January 2026.
   ═════════════════════════════════════════════════════════════════════════ */

export function ZoneCoverage() {
  const { ref, p } = useBandProgress({ window: [0.04, 0.76] });
  const enter = slice(p, 0.1, 0.85);

  return (
    <section ref={ref as any} id="coverage" className="zn zn--cover">
      <div className="zn__in">
        <header className="zn__head zn__head--split">
          <div>
            <p className="eyebrow mono">03 — Reach</p>
            <h2 className="zn__h" style={{ clipPath: wipe(slice(p, 0.02, 0.28)) }}>
              One currency.
              <br />
              <em>Twenty-one</em> sets
              <br />
              of rules.
            </h2>
          </div>
          <p className="zn__lede">
            July&apos;s inflation print ran from 2,0 % in Estonia to 3,8 % in
            Spain — one policy rate, twenty-one very different economies, which
            is the permanent difficulty of the euro. What it means for you is
            simpler: a salary paid from Dublin and a landlord in Ljubljana both
            work against the same account number, and neither of them needs to
            know where you bank.
          </p>
        </header>

        <div className="const">
          {EURO_AREA.map((c, i) => {
            const on = stagger(enter, i, 0.02, EURO_AREA.length);
            const dx = jitter(c.code + "x", 1) * 10;
            const dy = jitter(c.code + "y", 1) * 14;
            const isNew = c.since === 2026;
            return (
              <span
                key={c.code}
                className={isNew ? "const__c is-new" : "const__c"}
                style={{
                  transform: `translate3d(${dx * (1 - on * 0.6)}px, ${dy * (1 - on) + (1 - on) * 22}px, 0)`,
                  opacity: on,
                }}
              >
                <b className="mono">{c.code}</b>
                <span className="const__n">{c.name}</span>
                <i className="const__y mono">{c.since}</i>
              </span>
            );
          })}
        </div>

        <div className="cover__foot">
          <div>
            <p className="eyebrow mono">Reachable in euro, outside the bloc</p>
            <p className="cover__list">
              {SEPA_NON_EURO.map((n, i) => (
                <span
                  key={n}
                  style={{
                    opacity: 0.35 + 0.65 * stagger(slice(p, 0.55, 0.95), i, 0.03, SEPA_NON_EURO.length),
                  }}
                >
                  {n}
                  {i < SEPA_NON_EURO.length - 1 ? " · " : ""}
                </span>
              ))}
            </p>
          </div>
          <p className="note mono">
            Transfers to these countries settle in euro on SEPA rails. Local
            currency conversion, where you ask for it, is quoted against the ECB
            daily reference rate.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ZONE 04 — THE HOUSE
   Frankfurt, Kaiserstraße 16. The images do a miniature of the hero's TRAVEL:
   object-position drifts on scroll and the frame scales a fraction, so the
   photographs are never static plates. Editorial split, not a hero banner.
   ═════════════════════════════════════════════════════════════════════════ */

export function ZoneHouse() {
  const { ref, p } = useBandProgress({ window: [0.02, 0.8], damping: 0.1 });

  return (
    <section ref={ref as any} id="house" className="zn zn--house">
      <div className="zn__in">
        <header className="zn__head zn__head--split">
          <div>
            <p className="eyebrow mono">04 — The house</p>
            <h2 className="zn__h" style={{ clipPath: wipe(slice(p, 0.02, 0.26)) }}>
              Kaiserstraße 16,
              <br />
              <em>Bahnhofsviertel</em>
            </h2>
          </div>
          <p className="zn__lede">
            Kaiserstraße runs from the Hauptbahnhof straight into the
            Innenstadt, past kebab shops, a casino, three of the biggest banks in
            Europe and the odd cocktail bar that used to be a pawn shop. The
            Bahnhofsviertel has never been tidy and has always been where the
            money is. We are at number 16, six hundred metres from the Eurotower
            — close enough that our supervisor could walk here.
          </p>
        </header>

        <div className="house">
          <figure className="house__plate house__plate--lead">
            <Drift src={MEDIA.ecbDawn} p={p} from={0.38} to={0.62} />
            <figcaption>
              <span>{MEDIA.ecbDawn.caption}</span>
              <a className="mono" href={MEDIA.ecbDawn.page} target="_blank" rel="noreferrer">
                {MEDIA.ecbDawn.author} · {MEDIA.ecbDawn.license} ↗
              </a>
            </figcaption>
          </figure>

          <div className="house__card">
            <p className="eyebrow mono">Registered office</p>
            <address className="house__addr">
              {HOUSE.legal}
              <br />
              {HOUSE.street}
              <br />
              {HOUSE.postal} {HOUSE.city}
              <br />
              {HOUSE.country}
            </address>

            <dl className="house__meta">
              <div>
                <dt className="mono">BIC</dt>
                <dd className="mono">{HOUSE.bic}</dd>
              </div>
              <div>
                <dt className="mono">Supervisor</dt>
                <dd>{HOUSE.regulator}</dd>
              </div>
              <div>
                <dt className="mono">Deposit protection</dt>
                <dd>
                  {HOUSE.protection}
                  <br />
                  <span className="dim">{HOUSE.scheme}</span>
                </dd>
              </div>
            </dl>
          </div>

          <ul className="house__walk">
            {HOUSE.landmarks.map(([k, v], i) => (
              <li
                key={k}
                style={{ clipPath: wipe(stagger(slice(p, 0.35, 0.9), i, 0.09, HOUSE.landmarks.length)) }}
              >
                <span className="house__wk">{k}</span>
                <span className="house__wv mono">{v}</span>
              </li>
            ))}
          </ul>

          <figure className="house__plate house__plate--tall">
            <Drift src={MEDIA.towers2012} p={p} from={0.6} to={0.35} />
            <figcaption>
              <span>{MEDIA.towers2012.caption}</span>
              <a className="mono" href={MEDIA.towers2012.page} target="_blank" rel="noreferrer">
                {MEDIA.towers2012.author} · {MEDIA.towers2012.license} ↗
              </a>
            </figcaption>
          </figure>

          <figure className="house__plate house__plate--wide">
            <Drift src={MEDIA.riverbank} p={p} from={0.3} to={0.7} />
            <figcaption>
              <span>{MEDIA.riverbank.caption}</span>
              <a className="mono" href={MEDIA.riverbank.page} target="_blank" rel="noreferrer">
                {MEDIA.riverbank.author} · {MEDIA.riverbank.license} ↗
              </a>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

/** Miniature of the hero's TRAVEL — object-position pans, frame breathes. */
function Drift({
  src,
  p,
  from,
  to,
}: {
  src: { file: string; caption: string };
  p: number;
  from: number;
  to: number;
}) {
  const x = lerp(from, to, clamp01(p));
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl(src.file, 1600)}
      alt={src.caption}
      loading="lazy"
      decoding="async"
      style={{
        objectPosition: `${(x * 100).toFixed(1)}% 50%`,
        transform: `scale(${(1.04 + Math.sin(p * Math.PI) * 0.03).toFixed(4)})`,
      }}
    />
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ZONE 05 — THE LEDGER
   What it costs, stated as a ledger rather than as a pricing table with a
   recommended tier. Rows wipe in on a stagger; the figures above them count
   nothing and animate barely — this is the part of the page that should feel
   like it is standing still and telling the truth.
   ═════════════════════════════════════════════════════════════════════════ */

export function ZoneLedger() {
  const { ref, p } = useBandProgress({ window: [0.04, 0.78] });

  return (
    <section ref={ref as any} id="ledger" className="zn zn--ledger">
      <div className="zn__in">
        <header className="zn__head">
          <p className="eyebrow mono">05 — The ledger</p>
          <h2 className="zn__h" style={{ clipPath: wipe(slice(p, 0.02, 0.26)) }}>
            Every charge, <em>on one page</em>
          </h2>
          <p className="zn__lede">
            No tiers, no &ldquo;from&rdquo; prices, no asterisk leading to a PDF.
            Instant transfers cannot legally cost more than standard ones, so
            they don&apos;t. Where somebody else takes a cut — a correspondent
            bank in the chain, an ATM operator in Lisbon — you see the number
            before you press send, not afterwards on the statement.
          </p>
        </header>

        <ul className="figs">
          {LEDGER_FIGURES.map((f, i) => (
            <li
              key={f.k}
              className="fig"
              style={{ clipPath: wipe(stagger(slice(p, 0.06, 0.5), i, 0.1, LEDGER_FIGURES.length)) }}
            >
              <p className="fig__n">{f.n}</p>
              <p className="fig__k mono">{f.k}</p>
              <p className="fig__note">{f.note}</p>
            </li>
          ))}
        </ul>

        <table className="ldg">
          <tbody>
            {PRICE_ROWS.map((r, i) => (
              <tr
                key={r.k}
                className={r.emphasis ? "ldg__r is-key" : "ldg__r"}
                style={{
                  clipPath: wipe(stagger(slice(p, 0.3, 0.95), i, 0.055, PRICE_ROWS.length)),
                }}
              >
                <th scope="row" className="ldg__k">
                  {r.k}
                </th>
                <td className="ldg__v mono">{r.v}</td>
                <td className="ldg__n">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="warn">
          <p className="warn__k mono">What this page is not</p>
          <p>
            Nothing here is investment advice or an offer of credit. Deposit
            protection covers eligible deposits up to 100,000 € per depositor and
            does not extend to digital assets, which are not deposits and are not
            covered by any guarantee scheme. Interest rates quoted by the ECB are
            policy rates, not the rate on your account. Verification of Payee
            returns a warning, not a guarantee: a &ldquo;match&rdquo; result does
            not make a payment safe, and you remain responsible for who you pay.
          </p>
        </div>
      </div>
    </section>
  );
}
