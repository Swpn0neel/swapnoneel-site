import { BackToTop } from "@/components/back-to-top";
import { Navbar } from "@/components/navbar";
import { PageTransition } from "@/components/page-transition";
import { ThemeProvider } from "@/components/theme-provider";
import { footerLinks, siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { buildPersonSchema } from "@/lib/structured-data";
import { safeJsonLd } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.person.fullName,
    template: `%s — ${siteConfig.person.fullName}`,
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
    images: [
      {
        url: siteConfig.images.avatar,
        width: 140,
        height: 140,
        alt: siteConfig.person.fullName,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: siteConfig.person.fullName,
    description: siteConfig.metadata.description,
    images: [siteConfig.images.avatar],
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
      <body
        className={`${inter.variable} bg-background text-foreground min-h-screen font-sans antialiased transition-colors duration-500 ease-in-out`}
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var e=localStorage.getItem("theme");if(e==="dark")document.documentElement.classList.add("dark")}catch(e){}})();`,
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
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
              <div className="mb-4 flex flex-col gap-2 text-sm lowercase min-[400px]:flex-row min-[400px]:gap-4">
                {footerLinks.map((link) => {
                  const isInternal = link.href.startsWith("/");
                  const LinkComponent = isInternal ? Link : "a";

                  return (
                    <LinkComponent
                      key={link.key}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground flex items-center gap-1.5 transition-colors"
                    >
                      <span>↗</span> {i18n.footer[link.key]}
                    </LinkComponent>
                  );
                })}
              </div>
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
