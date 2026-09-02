import { Geist_Mono } from "next/font/google";

// Geist Mono lives here, not in app/layout.tsx, on purpose. next/font emits a
// <link rel="preload"> for every face declared in the root layout on every
// route, and with display:"optional" a face that is not preloaded never shows
// on a first visit — so the root-layout declaration was shipping 23 KB of
// monospace to the home, work and contact pages, none of which render a single
// monospace glyph. Declaring it once here and importing it from the layouts
// that set code (app/blog/layout.tsx) keeps the preload exactly where the font
// is used. Everywhere else, --font-mono falls back to the system stack — see
// the mono-scope note in app/styles/base.css.
export const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "optional",
  variable: "--font-geist-mono",
});
