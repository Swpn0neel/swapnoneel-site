import { i18n } from "@/lib/i18n";
import Link from "next/link";

const LINK_CLASS =
  "text-muted-foreground hover:text-foreground text-xs transition-colors";

// Both destinations are static markup. Home-origin links include #from-home,
// so the native :target state selects that return path without making every
// local-markdown detail page depend on request-time searchParams.
export function WorkBackLink() {
  return (
    <div className="work-back-links">
      <Link
        id="from-home"
        href="/"
        className={`work-back-link--home ${LINK_CLASS}`}
      >
        ← home
      </Link>
      <Link href="/work" className={`work-back-link--work ${LINK_CLASS}`}>
        ← {i18n.work.otherExperience.backLink}
      </Link>
    </div>
  );
}
