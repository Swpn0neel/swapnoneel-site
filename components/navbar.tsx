import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";

export default function Navbar() {
  return (
    <nav className="relative flex items-center justify-between py-6 mb-4">
      <Link
        href="/"
        className="text-sm font-medium text-foreground hover:opacity-60 transition-opacity border-b border-transparent hover:border-border duration-300"
      >
        Swapnoneel Saha
      </Link>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-5">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            home.
          </Link>
          <Link
            href="/blog"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            blog.
          </Link>
          <Link
            href="/work"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            work.
          </Link>
          <Link
            href="/contact"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            contact.
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}
