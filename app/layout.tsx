import { BackToTop } from "@/components/back-to-top";
import Navbar from "@/components/navbar";
import PageTransition from "@/components/page-transition";
import { ThemeProvider } from "@/components/theme-provider";
import { footerLinks, siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.person.fullName,
    template: `%s — ${siteConfig.person.fullName}`,
  },
  description: siteConfig.metadata.description,
  metadataBase: new URL("https://swapnoneel.com"),
  openGraph: {
    title: siteConfig.person.fullName,
    description: siteConfig.metadata.description,
    url: "https://swapnoneel.com",
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} bg-background text-foreground min-h-screen font-sans antialiased transition-colors duration-500 ease-in-out`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <a href="#main-content" className="skip-to-content">
            {i18n.common.skipToContent}
          </a>
          <div className="mx-auto max-w-2xl px-4">
            <Navbar />
            <main id="main-content" tabIndex={-1}>
              <PageTransition>{children}</PageTransition>
            </main>
            <BackToTop />
            <footer
              className="text-muted-foreground mt-8 py-12 text-xs"
              suppressHydrationWarning
            >
              <div className="mb-4 flex gap-4 text-sm lowercase">
                {footerLinks.map((link) => (
                  <a
                    key={link.key}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground flex items-center gap-1.5 transition-colors"
                  >
                    <span>↗</span> {i18n.footer[link.key]}
                  </a>
                ))}
              </div>
              <p>
                © {new Date().getFullYear()} {siteConfig.person.fullName}.{" "}
                {i18n.footer.rightsReserved}
              </p>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
