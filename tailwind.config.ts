import type { Config } from "tailwindcss";

/**
 * Ridgeford Capital Bank — dark "trading floor" theme.
 *
 * The `ink` scale is TEXT-FIRST and inverted for dark mode:
 *   ink-900 = brightest text, ink-500 = muted copy, ink-100/200 = hairlines,
 *   ink-50  = the page background.
 * Dark *surfaces* live on the `night` scale, cards on `panel`,
 * and the premium accent is `gold`, taken straight from the logo.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "Archivo", "Helvetica Neue", "Arial", "sans-serif"],
        display: ["var(--font-display)", "Bodoni Moda", "Didot", "Georgia", "serif"],
        mono: ["var(--font-mono)", "Space Mono", "ui-monospace", "Menlo", "monospace"],
      },
      colors: {
        ink: {
          50:  "#080808",   /* warm black ground */
          100: "#1c1c1c",
          200: "#2a2a2a",
          300: "#4a4a4a",
          400: "#666666",
          500: "#9a9a9a",
          600: "#b0b0b0",
          700: "#c4c4c4",
          800: "#d9d9d9",
          900: "#eeeeee",   /* bone — primary text */
        },
        night: {
          950: "#050505",
          900: "#0c0c0c",
          800: "#141414",
          700: "#1c1c1c",
          600: "#232323",
        },
        panel: {
          DEFAULT: "#141414",
          2: "#1c1c1c",
          3: "#232323",
        },
        /* Legacy token name, new values. The accent is burnt sienna now —
           gold survives only inside the logo artwork. */
        gold: {
          50:  "#f2f5f7",
          100: "#e3e9ee",
          200: "#c8d2da",
          300: "#b4c2ce",
          400: "#a0b0c0",
          500: "#8a9bab",
          600: "#74838f",
          700: "#5f6d7a",
          800: "#3d454d",
          900: "#252a2f",
        },
        steel: {
          300: "#b4c2ce", 400: "#a0b0c0", 500: "#8a9bab", 600: "#74838f", 700: "#5f6d7a",
        },
        petrol: {
          300: "#8fd6cb", 400: "#6fc4b8", 500: "#3f9d92", 600: "#2f7d74", 700: "#26635c",
        },
        bone: {
          DEFAULT: "#eeeeee", 2: "#9a9a9a",
        },
        /* No blue anywhere. `brand-*` survives as a name so the hundreds of
           existing usages keep compiling, but every stop is neutral or steel:
           low numbers are surfaces, high numbers are text. */
        brand: {
          50:  "#141414",
          100: "#1c1c1c",
          200: "#2a2a2a",
          300: "#5f6d7a",
          400: "#74838f",
          500: "#8a9bab",
          600: "#eeeeee",
          700: "#eeeeee",
          800: "#f4f4f4",
          900: "#ffffff",
        },
        azure: { 400: "#a0b0c0", 500: "#8a9bab", 600: "#74838f" },
        up:   { DEFAULT: "#3d9b6e" },   /* sage, not neon */
        down: { DEFAULT: "#c45c5c" },   /* rust, not fire-engine */
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.9)",
        pop:  "0 24px 60px -24px rgba(0,0,0,0.95), 0 8px 24px rgba(0,0,0,0.55)",
        glow: "0 20px 60px -20px rgba(138,155,171,0.45), 0 8px 24px rgba(138,155,171,0.16)",
        blue: "0 0 0 0 transparent",
      },
      borderRadius: { xl: "14px", "2xl": "20px", "3xl": "28px" },
      keyframes: {
        shimmer: { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(100%)" } },
        floaty:  { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        flashUp:   { "0%": { backgroundColor: "rgba(22,199,132,0.28)" }, "100%": { backgroundColor: "transparent" } },
        flashDown: { "0%": { backgroundColor: "rgba(234,57,67,0.28)" }, "100%": { backgroundColor: "transparent" } },
        pulseRing: { "0%": { boxShadow: "0 0 0 0 rgba(138,155,171,0.35)" }, "100%": { boxShadow: "0 0 0 12px rgba(138,155,171,0)" } },
      },
      animation: {
        shimmer: "shimmer 2.4s linear infinite",
        floaty: "floaty 4.2s ease-in-out infinite",
        flashUp: "flashUp .9s ease-out",
        flashDown: "flashDown .9s ease-out",
        pulseRing: "pulseRing 1.8s ease-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
