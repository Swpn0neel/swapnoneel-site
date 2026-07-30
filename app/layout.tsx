import { BackToTop } from "@/components/back-to-top";
import { Navbar } from "@/components/navbar";
import { PageTransition } from "@/components/page-transition";
import { SiteFooterLinks } from "@/components/site-footer-links";
import { ThemeProvider } from "@/components/theme-provider";
import { siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { buildPersonSchema } from "@/lib/structured-data";
import { safeJsonLd } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { preload } from "react-dom";
import "./globals.css";

// Inter is not loaded via next/font — it is subset by
// scripts/generate-font-subset.mjs and declared in inter-subset.generated.css.
// It is preloaded in <head> below so the fetch starts at HTML parse instead of
// waiting for the stylesheet to resolve, and font-display: optional means a
// face that loses that race is simply not used for that pageview rather than
// repainting the LCP paragraph.

// Applies the theme class in <head>, before <body> exists. next-themes ships an
// equivalent script, but renders it inside the provider — i.e. ~700 bytes into
// <body>, behind 98KB of inlined head CSS (the data-URI Inter face). At that
// point the browser has a parsed stylesheet and a <body> carrying
// `bg-background`, which resolves to white until `.dark` lands on <html>; a
// chunk boundary anywhere in that gap paints one white frame before the script
// runs. Nothing can paint before <body> is parsed, so running here closes the
// gap outright. next-themes' own script re-applies the same values afterwards.
//
// Deliberately read-only on localStorage: writing here is what used to fire a
// storage event on every load and yank other tabs back to light.
// colorScheme is set alongside the class so form controls, scrollbars and the
// document canvas agree from the first frame rather than after hydration.
const THEME_INIT = `(function(){var e=document.documentElement,t=null;try{t=localStorage.getItem("theme")}catch(_){}var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);e.classList.add(d?"dark":"light");e.style.colorScheme=d?"dark":"light"})();`;

export const metadata: Metadata = {
  title: {
    default: siteConfig.person.fullName,
    template: `%s | ${siteConfig.person.fullName}`,
  },
  description: siteConfig.metadata.description,
  metadataBase: new URL("https://www.swapnoneel.site"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteConfig.person.fullName,
    description: siteConfig.metadata.description,
    url: "https://www.swapnoneel.site",
    siteName: siteConfig.person.fullName,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.person.fullName,
    description: siteConfig.metadata.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: siteConfig.images.icon,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // React hoists font/style preloads into <head> itself and dedupes them by
  // href. Declaring this as a raw <link> in the tree below got it emitted
  // twice — once hoisted, once in place — so it goes through react-dom's
  // preload() instead, which is the API that hoisting is keyed on.
  //
  // React puts it ahead of the stylesheet, so the request is in flight before
  // anything else in <head> runs. crossOrigin is required even for a
  // same-origin font: without it the preload is fetched in a different mode
  // than the CSS request and the file is downloaded twice.
  preload("/font/inter-latin.woff2", {
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  });

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* Covers the frame before THEME_INIT runs: on a cold start the browser
            paints its own canvas before parsing anything, and defaults to white
            without this. Only helps visitors whose OS is dark — an explicit
            dark choice on a light OS is handled by THEME_INIT below. */}
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      {/* duration-150 matches Tailwind's default `transition-colors`, which is
          what the rest of the site uses. At the previous 500ms the background
          visibly lagged behind every link, border and card on a theme switch. */}
      <body
        className={`bg-background text-foreground min-h-screen font-sans antialiased transition-colors duration-150 ease-in-out`}
        suppressHydrationWarning
      >
        {/* Blog prose size (A-/A/A+). Unlike the theme this is a lasting
            accessibility preference, so it lives in localStorage — and it has
            to be applied before first paint or the article visibly resizes
            under the reader. Keep the scales in sync with font-size-toggle. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s={sm:0.9,md:1,lg:1.15}[localStorage.getItem("prose-scale")];if(s)document.documentElement.style.setProperty("--prose-scale",s)}catch(e){}})();`,
          }}
        />
        {/* next-themes owns persistence and the pre-hydration class entirely.
            An earlier version layered a sessionStorage-backed script on top to
            scope the choice to one browsing session; because that script also
            wrote localStorage on every load, and next-themes syncs across tabs
            from that same key, opening a second tab fired a storage event that
            yanked already-open tabs back to light. */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: safeJsonLd({
                "@context": "https://schema.org",
                ...buildPersonSchema(),
              }),
            }}
          />
          <a href="#main-content" className="skip-to-content">
            {i18n.common.skipToContent}
          </a>
          <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4">
            {/* <header>, not a plain div: the page had nav/main/contentinfo
                landmarks but no banner, so landmark-based navigation skipped
                straight past the masthead. Direct child of the layout wrapper
                (not of main/article/section), which is what makes it map to
                the banner role. */}
            <header className="print:hidden">
              <Navbar />
            </header>
            <main id="main-content" tabIndex={-1} className="flex-1">
              <PageTransition>{children}</PageTransition>
            </main>
            <div className="print:hidden">
              <BackToTop />
            </div>
            <footer
              className="text-muted-foreground mt-8 py-12 text-xs print:hidden"
              suppressHydrationWarning
            >
              <SiteFooterLinks />
              <p>
                © {new Date().getFullYear()} {siteConfig.person.fullName}.{" "}
                {i18n.footer.rightsReserved}
              </p>
            </footer>
          </div>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
