"use client";

import { navItems, siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileNav } from "./mobile-nav";
import { useLikelyRoutePrefetch, useRoutePrefetch } from "./route-prefetch";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  const pathname = usePathname();
  const prefetchRoute = useRoutePrefetch();
  useLikelyRoutePrefetch("/work", pathname === "/");

  return (
    <nav
      className="relative mb-4 flex items-center justify-between py-6"
      aria-label={i18n.common.mainNavigation}
    >
      <Link
        href="/"
        // Route data is warmed by explicit intent. This avoids automatic work
        // for the current route while pointer/focus/down still keeps clicks fast.
        prefetch={false}
        onPointerEnter={() => prefetchRoute("/")}
        onFocus={() => prefetchRoute("/")}
        onPointerDown={() => prefetchRoute("/")}
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
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onPointerEnter={() => prefetchRoute(item.href)}
                onFocus={() => prefetchRoute(item.href)}
                onPointerDown={() => prefetchRoute(item.href)}
                className={`hover:text-foreground focus-visible:ring-ring rounded-sm text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${isActive ? "text-foreground/90" : "text-muted-foreground"}`}
                aria-current={isActive ? "page" : undefined}
              >
                {i18n.nav[item.key]}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <MobileNav onPrefetch={prefetchRoute} />
        </div>
      </div>
    </nav>
  );
}
