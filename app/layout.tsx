import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";

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
          <main>{children}</main>
          <footer className="py-12 mt-8 text-xs text-muted-foreground">
            © {new Date().getFullYear()} Swapnoneel Saha. All rights reserved.
          </footer>
        </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
