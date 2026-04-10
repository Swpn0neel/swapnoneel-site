import Navbar from "@/components/navbar";
import PageTransition from "@/components/page-transition";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swapnoneel Saha",
  description:
    "CS undergrad, Technical Writer, and DevRel Engineer based in West Bengal, India.",
  openGraph: {
    title: "Swapnoneel Saha",
    description:
      "CS undergrad, Technical Writer, and DevRel Engineer based in West Bengal, India.",
    type: "website",
  },
  icons: {
    icon: "/img/pfp-circle.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen antialiased transition-colors duration-500 ease-in-out">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <a href="#main-content" className="skip-to-content">
            Skip to main content
          </a>
          <div className="mx-auto max-w-2xl px-4">
            <Navbar />
            <main id="main-content" tabIndex={-1}>
              <PageTransition>{children}</PageTransition>
            </main>
            <footer
              className="text-muted-foreground mt-8 py-12 text-xs"
              suppressHydrationWarning
            >
              <div className="mb-4 flex gap-4 text-sm lowercase">
                <a
                  href="https://swapnoneel.hashnode.dev/rss.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <span>↗</span> rss
                </a>
                <a
                  href="https://github.com/Swpn0neel/swapnoneel-site"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <span>↗</span> github
                </a>
              </div>
              <p>
                © {new Date().getFullYear()} Swapnoneel Saha. All rights
                reserved.
              </p>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
