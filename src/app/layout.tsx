import type { Metadata, Viewport } from "next";
import "./globals.css";

/**
 * TYPE
 *
 * Deliberately not Inter + Georgia — that pairing is the default of every
 * template on the internet.
 *
 *   Bodoni Moda — a didone. The extreme thick/thin contrast is what financial
 *                 newspapers have used for two centuries; it gives headlines a
 *                 voice at large sizes instead of just being big.
 *   Archivo     — a grotesque with a newsroom feel that holds together in
 *                 small UI text, where a geometric sans goes limp.
 *   Space Mono  — carries figures and labels, and has actual character rather
 *                 than being one more neutral coding face.
 *
 * They are loaded by @import at the top of globals.css rather than through
 * next/font, so the build never depends on reaching Google at compile time.
 * To switch to next/font (better: no runtime request, no layout shift), delete
 * that @import line and restore the loaders here — the CSS variable names
 * --font-display / --font-sans / --font-mono are already what Tailwind reads.
 */

export const metadata: Metadata = {
  title: {
    default: "Ridgeford Capital Bank — finance at its peak",
    template: "%s · Ridgeford Capital Bank",
  },
  description:
    "Ridgeford Capital Bank is the mobile bank built for Europe — real-time SEPA transfers, worldwide SWIFT, Spaces savings with 2,26% interest, and a metal card that works everywhere.",
  metadataBase: new URL("https://ridgefordbank.eu"),
  applicationName: "Ridgeford Capital Bank",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Ridgeford Capital Bank — finance at its peak",
    description:
      "The mobile bank built for Europe. Real-time SEPA, worldwide SWIFT, Spaces savings.",
    type: "website",
    siteName: "Ridgeford Capital Bank",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ridgeford Capital Bank — finance at its peak",
    description:
      "The mobile bank built for Europe. Real-time SEPA, worldwide SWIFT, Spaces savings.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0e13",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-ink-50 text-ink-900 antialiased">{children}</body>
    </html>
  );
}
