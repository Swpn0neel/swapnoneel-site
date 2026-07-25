"use client";

import { footerLinks, type FooterLink } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import Link from "next/link";
import { usePathname } from "next/navigation";

const mainSiteLink: FooterLink = {
  href: "https://swapnoneel.site",
  key: "site",
};

export function SiteFooterLinks() {
  const pathname = usePathname();
  const links =
    pathname === "/resume"
      ? [mainSiteLink, ...footerLinks.filter((link) => link.key !== "resume")]
      : footerLinks;

  return (
    <div className="mb-4 flex flex-col gap-2 text-sm lowercase min-[400px]:flex-row min-[400px]:gap-4">
      {links.map((link) => {
        const isInternal = link.href.startsWith("/");
        const isStaticText = link.href.endsWith(".txt");
        const linkProps = {
          target: "_blank",
          rel: "noopener noreferrer",
          className:
            "hover:text-foreground flex items-center gap-1.5 transition-colors",
        };

        if (isInternal && !isStaticText) {
          return (
            <Link key={link.key} href={link.href} {...linkProps}>
              <span>↗</span> {i18n.footer[link.key]}
            </Link>
          );
        }

        return (
          <a key={link.key} href={link.href} {...linkProps}>
            <span>↗</span> {i18n.footer[link.key]}
          </a>
        );
      })}
    </div>
  );
}
