import { footerLinks } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import Link from "next/link";

export function SiteFooterLinks() {
  return (
    <div className="mb-4 flex flex-col gap-2 text-sm lowercase min-[400px]:flex-row min-[400px]:flex-wrap min-[400px]:gap-4">
      {footerLinks.map((link) => {
        const linkProps = {
          target: "_blank",
          rel: "noopener noreferrer",
          className:
            "hover:text-foreground flex items-center gap-1.5 transition-colors",
        };

        return (
          <Link key={link.key} href={link.href} {...linkProps}>
            <span>↗</span> {i18n.footer[link.key]}
          </Link>
        );
      })}
    </div>
  );
}
