/**
 * Whether a nav item should be marked as the current page.
 *
 * Astro builds directory-format URLs, so `Astro.url.pathname` arrives as
 * `/blog/` where the configured href is `/blog`. Normalising here rather than
 * at each call site keeps the desktop nav and the mobile panel from drifting
 * apart — the Next version compared raw strings and only worked because
 * usePathname() never produced a trailing slash.
 */
export function isActivePath(pathname: string, href: string): boolean {
  const current = pathname !== "/" ? pathname.replace(/\/+$/, "") : "/";
  const target = href !== "/" ? href.replace(/\/+$/, "") : "/";
  return current === target || (target !== "/" && current.startsWith(`${target}/`));
}
