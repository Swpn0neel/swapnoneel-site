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
import "./globals.css";

// Inter is no longer loaded via next/font — it is inlined as a data URI by
// scripts/generate-font-subset.mjs and declared in inter-subset.generated.css.
// A linked font arrives after first paint, repaints the LCP paragraph and
// stamps a second, much later LCP candidate; inlining removes that entirely.

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
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
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
            <div className="print:hidden">
              <Navbar />
            </div>
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
