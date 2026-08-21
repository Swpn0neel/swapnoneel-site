"use client";

import { NavPendingLabel } from "@/components/nav-pending-label";
import { navItems, siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="relative mb-4 flex items-center justify-between py-6"
      aria-label={i18n.common.mainNavigation}
    >
      <Link
        href="/"
        // Not prefetched: this is the current route often enough that the
        // automatic fetch is wasted work, and the nav is always one tap away.
        prefetch={false}
        className="text-foreground hover:border-border border-b border-transparent text-sm font-medium transition-opacity duration-300 hover:opacity-60"
      >
        {siteConfig.person.shortName}
      </Link>
      <div className="flex items-center gap-6">
        <div className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(`${item.href}/`));

            return (
              // Default prefetch on purpose. Every route here is prerendered,
              // so the payload is a one-off ~9 KB fetch per link — and having
              // it cached is what makes a nav click swap instantly instead of
              // paying a full network round trip at click time (measured
              // 300–950ms against the CDN even on cache HITs). This container
              // is display:none below md, so none of it is fetched on phones.
              <Link
                key={item.href}
                href={item.href}
                className={`hover:text-foreground focus-visible:ring-ring rounded-sm text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${isActive ? "text-foreground/90" : "text-muted-foreground"}`}
                aria-current={isActive ? "page" : undefined}
              >
                <NavPendingLabel>{i18n.nav[item.key]}</NavPendingLabel>
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}
