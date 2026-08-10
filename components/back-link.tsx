import Link from "next/link";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-muted-foreground hover:text-foreground text-xs transition-colors"
    >
      ← {label}
    </Link>
  );
}
