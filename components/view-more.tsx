import { i18n } from "@/lib/i18n";
import Link from "next/link";

interface ViewMoreProps {
  href: string;
  label?: string;
}

export function ViewMore({ href, label }: ViewMoreProps) {
  return (
    <div className="flex justify-end py-5">
      <Link
        href={href}
        className="text-muted-foreground hover:text-foreground group/more flex items-center gap-1 text-xs transition-colors"
      >
        <span className="group-hover/more:underline">
          {label || i18n.common.viewMore}
        </span>
        <span className="text-[10px]">→</span>
      </Link>
    </div>
  );
}
