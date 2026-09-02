"use client";

const LOGOS = [
  "Handelsblatt",
  "Financial Times",
  "Der Spiegel",
  "TechCrunch",
  "WirtschaftsWoche",
  "Süddeutsche Zeitung",
  "Bloomberg",
  "Euromoney",
  "Stiftung Warentest",
];

export function PressStrip() {
  const doubled = [...LOGOS, ...LOGOS];
  return (
    <section className="py-14 border-y border-ink-100 bg-panel">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="text-center text-[12.5px] font-semibold uppercase tracking-[0.2em] text-ink-400">
          As featured in
        </p>
      </div>

      <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="marquee flex min-w-[200%] items-center gap-12 px-8">
          {doubled.map((name, i) => (
            <span
              key={i}
              className="text-[22px] sm:text-[26px] font-serif italic tracking-tight text-ink-400 whitespace-nowrap"
              style={{ fontFamily: '"Times New Roman", Georgia, serif' }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
