import { i18n } from "@/lib/i18n";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface ViewMoreProps {
  href: string;
  label?: string;
}

export function ViewMore({ href, label }: ViewMoreProps) {
  return (
    <div className="flex justify-end py-6">
      <Link
        href={href}
        className="text-muted-foreground hover:text-foreground group/more flex items-center gap-1 text-xs transition-colors"
      >
        <span className="group-hover/more:underline">
          {label || i18n.common.viewMore}
        </span>
        <ArrowUpRight className="h-3 w-3 transition-transform group-hover/more:-translate-y-0.5 group-hover/more:translate-x-0.5" />
      </Link>
    </div>
  );
}
