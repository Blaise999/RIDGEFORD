import Hero from "@/components/hero/Hero";
import BrandSplash from "@/components/brand/BrandSplash";
import { ZoneRail, ZoneTape } from "@/components/landing/zones/ZoneRail";
import {
  ZoneCoverage,
  ZoneHouse,
  ZoneLedger,
} from "@/components/landing/zones/ZoneCoverage";
import {
  ZoneFeatures,
  ZoneClose,
} from "@/components/landing/zones/ZoneFeatures";

export const metadata = {
  title: "Ridgeford Capital Bank — euro banking from Frankfurt",
  description:
    "Euro current and savings accounts across all twenty-one members of the euro area. Instant transfers in under ten seconds, a free name check on every payment, and a digital-asset desk priced on the ticket. Kaiserstraße 16, Frankfurt am Main.",
};

/**
 * THE LANDING PAGE
 *
 * The pinned scroll sequence runs first and owns one long timeline — /public/seq
 * on desktop (241 frames), /public/seq-m on mobile (237). It releases straight
 * into the rail, which is the only zone below with a clock of its own, so the
 * page never has two timed things competing.
 *
 * Everything after that is a band: each section derives its own damped 0 → 1
 * progress from its position in the viewport and writes it to `--p` on itself.
 * JS owns one number per section, CSS owns every consequence — the same
 * contract the hero runs on, which is what makes the whole page read as one
 * instrument rather than a stack of effects.
 *
 * The old marketing sections are preserved in page.old.tsx.bak if you want any
 * of them back.
 */
export default function LandingPage() {
  return (
    <main>
      {/* Blank field → mark → tagline → lift. Once per session. */}
      <BrandSplash />

      {/* Pinned sequence — one clock, three plates */}
      <Hero />

      {/* 01 — what a euro transfer does, drawn to scale */}
      <ZoneRail />

      {/* 02 — European finance, scattered and sourced */}
      <ZoneTape />

      {/* 03 — twenty-one countries */}
      <ZoneCoverage />

      {/* 04 — Kaiserstraße 16, Bahnhofsviertel */}
      <ZoneHouse />

      {/* 06 — the account itself, on a counter-scrolling shear */}
      <ZoneFeatures />

      {/* 05 — every charge on one page */}
      <ZoneLedger />

      {/* 07 — the close */}
      <ZoneClose />
    </main>
  );
}
