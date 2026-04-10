"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/", label: "home." },
  { href: "/blog", label: "blog." },
  { href: "/work", label: "work." },
  { href: "/contact", label: "contact." },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="relative mb-4 flex items-center justify-between py-6"
      aria-label="Main navigation"
    >
      <Link
        href="/"
        className="text-foreground hover:border-border border-b border-transparent text-sm font-medium transition-opacity duration-300 hover:opacity-60"
      >
        Swapnoneel Saha
      </Link>
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-sm text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}
