import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import PageTransition from "@/components/page-transition";

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
      <body className="min-h-screen bg-background text-foreground antialiased transition-colors duration-500 ease-in-out">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="max-w-2xl mx-auto px-4">
          <Navbar />
          <main>
            <PageTransition>
              {children}
            </PageTransition>
          </main>
          <footer 
            className="py-12 mt-8 text-xs text-muted-foreground"
            suppressHydrationWarning
          >
            <div className="flex gap-4 text-sm lowercase mb-4">
              <a
                href="https://swapnoneel.hashnode.dev/rss.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <span>↗</span> rss
              </a>
              <a
                href="https://github.com/Swpn0neel/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <span>↗</span> github
              </a>
            </div>
            <p>© {new Date().getFullYear()} Swapnoneel Saha. All rights reserved.</p>
          </footer>
        </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
