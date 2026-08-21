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
import { Inter } from "next/font/google";
import "./globals.css";

// No `weight` list on purpose. Inter is a variable font, and naming weights
// made next/font emit the same variable files three times over — 21 @font-face
// rules where 7 do, and every extra rule is another unicode-range subset the
// build ships. `variable` covers the whole axis in one face.
//
// display:"optional" means a face that loses the race to first paint is simply
// not used for that pageview rather than repainting the article under the
// reader, which is why the preloaded file's size matters more here than usual.
const inter = Inter({
  subsets: ["latin"],
  display: "optional",
  variable: "--font-inter",
});

// Writes the *resolved* theme to data-theme before <body> exists, whether the
// visitor has a saved choice or is on "system". Resolving here rather than
// leaving the attribute off and letting the prefers-color-scheme block in
// globals.css handle "system" is what keeps the page internally consistent: the
// media query can only restate the palette, so in the gap before next-themes
// hydrates, every `dark:` utility and every rule keyed on the attribute would
// still render its light form over an already-dark background — company logos
// un-inverted on black, the profile card resting on the wrong face.
//
// This does not pin the theme. next-themes still owns the preference and still
// rewrites data-theme when the OS flips while "system" is selected; the
// attribute being present up front changes nothing about that.
//
// The storage read is guarded because some privacy modes and embedded browsers
// make localStorage throw, and colorScheme is set alongside so form controls,
// scrollbars and the document canvas agree from the first frame — the CSS says
// the same thing, but only once the stylesheet has parsed.
const THEME_INIT = `(function(){var e=document.documentElement,t=null;try{t=localStorage.getItem("theme")}catch(_){}var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);e.dataset.theme=d?"dark":"light";e.style.colorScheme=d?"dark":"light"})();`;

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
  modal,
}: {
  children: React.ReactNode;
  // Intercepted /work/[slug] project dialog. The slot lives at the root, not
  // under app/work, because the project cards on the home page link here too —
  // an interceptor inside app/work can only catch navigations that already
  // start inside that segment, so from "/" it never fired and the card
  // navigated away from the page instead of opening over it.
  modal: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={inter.variable}
    >
      <head>
        {/* Gives native controls and the browser canvas both supported schemes;
            CSS narrows this to the active scheme from the first rendered frame. */}
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        {/* Native Speculation Rules for instantaneous background prefetching in modern Chromium */}
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prefetch: [
                {
                  source: "list",
                  urls: ["/blog", "/work", "/contact", "/resume"],
                  eagerness: "moderate",
                },
                {
                  source: "document",
                  where: {
                    and: [
                      { href_matches: "/*" },
                      { not: { href_matches: "/api/*" } },
                      { not: { href_matches: "/feed.xml" } },
                      { not: { href_matches: "/*.txt" } },
                    ],
                  },
                  eagerness: "conservative",
                },
              ],
            }),
          }}
        />
      </head>
      <body
        className="bg-background text-foreground min-h-screen font-sans antialiased"
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
        {/* next-themes remains the application state and live system-preference
            owner; the toggle mirrors its resolved value to data-theme inside
            the same synchronous mutation used by the visual transition. */}
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="system"
          enableSystem
          enableColorScheme
        >
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
            {modal}
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
