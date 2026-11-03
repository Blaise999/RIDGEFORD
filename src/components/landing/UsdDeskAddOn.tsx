import Link from "next/link";

/**
 * Editorial U.S. extension to the established European landing page.
 * Design ratio: a 7/3 EUR-first split, not a second U.S.-first homepage.
 * Headlines are dated and link directly to original publishers.
 * Update the dated stories regularly, or replace them with a reviewed feed.
 */
const euroNews = [
  {
    date: "03 NOV 2026",
    source: "EUROPEAN CENTRAL BANK",
    title: "SEPA: Europe's unsung hero",
    summary: "The ECB examines how cross-border euro payments are changing and why awareness still matters.",
    href: "https://www.ecb.europa.eu/home/html/index.en.html",
  },
  {
    date: "02 NOV 2026",
    source: "EUROPEAN CENTRAL BANK",
    title: "The euro area's latest bank interest-rate statistics",
    summary: "Official ECB reporting on September 2026 lending and deposit rates.",
    href: "https://www.ecb.europa.eu/stats/financial_markets_and_interest_rates/bank_interest_rates/html/index.en.html",
  },
  {
    date: "29 OCT 2026",
    source: "EUROPEAN CENTRAL BANK",
    title: "The ECB's latest monetary-policy decision",
    summary: "Read the official decision and the context behind it.",
    href: "https://www.ecb.europa.eu/press/pr/date/2026/html/index.en.html",
  },
];

const dollarNews = [
  {
    date: "02 NOV 2026",
    source: "U.S. FEDERAL RESERVE",
    title: "October survey of U.S. bank lending practices",
    summary: "The Fed publishes its latest Senior Loan Officer Opinion Survey.",
    href: "https://www.federalreserve.gov/recentpostings.htm",
  },
  {
    date: "03 NOV 2026",
    source: "REUTERS · USD MARKETS",
    title: "The dollar's latest test as U.S. markets weigh economic risks",
    summary: "A closer look at the dollar index, yields and shifts in global currency sentiment.",
    href: "https://www.reuters.com/markets/currencies/global-markets-technicals-graphic-2026-11-03/",
  },
  {
    date: "28 OCT 2026",
    source: "U.S. FEDERAL RESERVE",
    title: "Federal Reserve issues October FOMC statement",
    summary: "The official U.S. monetary-policy announcement and related materials.",
    href: "https://www.federalreserve.gov/newsevents/pressreleases/2026-press-fomc.htm",
  },
];

export default function UsdDeskAddOn() {
  return (
    <section id="usd-desk" className="atlantic" aria-labelledby="atlantic-title" data-nav-tint="dark">
      <div className="atlantic__in">
        <header className="atlantic__header">
          <span className="atlantic__kicker">03 / THE TRANSATLANTIC DESK</span>
          <span className="atlantic__region">FRANKFURT AM MAIN <span aria-hidden="true">/</span> STAMFORD, CONNECTICUT</span>
        </header>

        <div className="atlantic__lead">
          <div className="atlantic__primary">
            <span className="atlantic__eyebrow">EUROPE FIRST. BEYOND EUROPE, TOO.</span>
            <h2 id="atlantic-title">At home in Europe. <em>Ready for more.</em></h2>
            <p>Ridgeford is built around the euro and headquartered in Frankfurt. When your financial life extends to the United States, our optional dollar account adds another way to organise your money, with a presence in Stamford, Connecticut.</p>
            <div className="atlantic__actions">
              <Link href="/signup" className="atlantic__button">Explore account options <span aria-hidden="true">↗</span></Link>
              <a href="#tape" className="atlantic__underlink">Explore European markets <span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <aside className="atlantic__secondary" aria-label="Currencies and transfer details">
            <div className="atlantic__currency atlantic__currency--eur">
              <div className="atlantic__currency-top"><span>01 / EURO ACCOUNT</span><strong>CORE</strong></div>
              <div className="atlantic__symbol" aria-hidden="true">€</div>
              <h3>European banking</h3>
              <p>EUR account · IBAN · SEPA transfers</p>
            </div>
            <div className="atlantic__currency atlantic__currency--usd">
              <div className="atlantic__currency-top"><span>02 / DOLLAR ACCOUNT</span><strong>OPTIONAL</strong></div>
              <div className="atlantic__symbol" aria-hidden="true">$</div>
              <h3>U.S. dollar banking</h3>
              <p>USD account · U.S. routing details when issued by a banking partner · SWIFT/BIC for international wires</p>
            </div>
          </aside>
        </div>

        <div className="atlantic__editorial" aria-label="European and American financial news">
          <div className="atlantic__editorial-header">
            <div>
              <span className="atlantic__kicker">THE BRIEFING / 03 NOV 2026</span>
              <h3>Two markets. <em>One perspective.</em></h3>
            </div>
            <span className="atlantic__editorial-disclosure">Independent source links · Dated articles · Not live prices</span>
          </div>
          <div className="atlantic__news-grid">
            <div className="atlantic__news-euro">
              <div className="atlantic__column-label"><span>EUROPE / EUR</span><span>EUROPEAN CENTRAL BANK</span></div>
              {euroNews.map((item, index) => (
                <a className="atlantic__story" href={item.href} target="_blank" rel="noopener noreferrer" key={item.title}>
                  <span className="atlantic__story-index">0{index + 1}</span>
                  <div><span className="atlantic__story-meta">{item.source} · {item.date}</span><h4>{item.title}</h4><p>{item.summary}</p></div>
                  <span className="atlantic__story-arrow" aria-hidden="true">↗</span>
                </a>
              ))}
              <a className="atlantic__source" href="https://www.ecb.europa.eu/press/html/index.en.html" target="_blank" rel="noopener noreferrer">More from the ECB ↗</a>
            </div>
            <div className="atlantic__news-dollar">
              <div className="atlantic__column-label"><span>UNITED STATES / USD</span><span>FEDERAL RESERVE</span></div>
              {dollarNews.map((item, index) => (
                <a className="atlantic__story" href={item.href} target="_blank" rel="noopener noreferrer" key={item.title}>
                  <span className="atlantic__story-index">0{index + 1}</span>
                  <div><span className="atlantic__story-meta">{item.source} · {item.date}</span><h4>{item.title}</h4><p>{item.summary}</p></div>
                  <span className="atlantic__story-arrow" aria-hidden="true">↗</span>
                </a>
              ))}
              <a className="atlantic__source" href="https://www.federalreserve.gov/newsevents.htm" target="_blank" rel="noopener noreferrer">More from the Federal Reserve ↗</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
