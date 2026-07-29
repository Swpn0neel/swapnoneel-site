import { ExperienceLogo } from "@/components/experience-logo";
import { ViewMore } from "@/components/view-more";
import { i18n } from "@/lib/i18n";
import type { PostMeta } from "@/lib/md";
import { firstLink } from "@/lib/utils";
import Link from "next/link";
import type { CSSProperties } from "react";

interface ExperienceSectionProps {
  items: { meta: PostMeta }[];
  /** Renders a "See all" link beside the heading — home page only. */
  seeAllHref?: string;
  /**
   * Appended as `?from=` to the internal links so the detail pages know which
   * page to send the reader back to.
   */
  from?: string;
  /**
   * `compact` is the home page's teaser: small logos in a tight stack, sitting
   * among several other blocks. `prominent` is for /work, where this section is
   * the page's subject rather than a preview — bigger logos and the breathing
   * room the old rows got from their `py-4`. Layout is otherwise identical.
   */
  variant?: "compact" | "prominent";
  className?: string;
}

export function ExperienceSection({
  items,
  seeAllHref,
  from,
  variant = "compact",
  className,
}: ExperienceSectionProps) {
  const query = from ? `?from=${from}` : "";
  const prominent = variant === "prominent";
  const logoSize = prominent ? 60 : 40;
  // Prominent rows are multi-line, so the logo tracks the title rather than
  // sitting beside the middle of the block. On narrow screens they drop out of
  // flex entirely and float the logo, letting the blurb use the full width once
  // it clears the logo's height instead of staying in a squeezed column.
  // `flow-root` keeps the float contained within the row.
  const rowClass = prominent
    ? "group flow-root sm:flex sm:items-start sm:gap-3"
    : "group flex items-center gap-4 sm:gap-3";

  return (
    <section className={className}>
      <div
        className={`flex items-center justify-between ${
          prominent ? "mb-9" : "mb-5"
        }`}
      >
        <h2 className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
          {i18n.home.sections.experience}
        </h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="text-muted-foreground hover:text-foreground text-xs underline transition-colors"
          >
            {i18n.common.seeAll}
          </Link>
        )}
      </div>
      <div className={prominent ? "space-y-4" : "space-y-4 sm:space-y-3"}>
        {items.map((item, i) => (
          <div key={item.meta.slug}>
            {item.meta.link ? (
              <a
                href={firstLink(item.meta.link)}
                target="_blank"
                rel="noopener noreferrer"
                className={rowClass}
              >
                <ExperienceRow
                  item={item}
                  logoSize={logoSize}
                  logoLowPriority={!prominent}
                  detailed={prominent}
                />
              </a>
            ) : (
              <Link
                href={`/work/${item.meta.slug}${query}`}
                prefetch={false}
                className={rowClass}
              >
                <ExperienceRow
                  item={item}
                  logoSize={logoSize}
                  logoLowPriority={!prominent}
                  detailed={prominent}
                />
              </Link>
            )}
            {i < items.length - 1 && (
              <hr
                className={`border-border ${prominent ? "mt-4" : "mt-4 sm:mt-3"}`}
              />
            )}
          </div>
        ))}
      </div>
      <div className={prominent ? "mt-6" : "mt-4 sm:mt-3"}>
        <hr className="border-border" />
        <ViewMore href={`/work/others${query}`} />
        <hr className="border-border" />
      </div>
    </section>
  );
}

// Sits inline at the end of a muted blurb, so it stays at full strength rather
// than lighting up on hover — it has to read as the affordance on its own.
function ReadMore() {
  return (
    <span className="text-foreground cursor-pointer font-medium whitespace-nowrap">
      {i18n.common.readMore}.
    </span>
  );
}

function ExperienceRow({
  item,
  logoSize,
  logoLowPriority,
  detailed,
}: {
  item: { meta: PostMeta };
  logoSize: number;
  logoLowPriority: boolean;
  /** Adds the blurb and "Read more" beneath the title — /work only. */
  detailed: boolean;
}) {
  return (
    <>
      {item.meta.cover && (
        <ExperienceLogo
          src={item.meta.cover}
          alt={item.meta.title}
          size={logoSize}
          lowPriority={logoLowPriority}
          className={detailed ? "float-left mr-4 mb-1 sm:float-none sm:mr-0" : ""}
        />
      )}
      <div className="flex-1">
        {/* While the logo is floated, the title/date pair is shorter than it
            and would otherwise sit against its top edge. Matching the logo's
            height centres the two against each other; the blurb below clears
            the float either way, so nothing shifts down. The logo is sized in
            px, so the height has to come from `logoSize` rather than a rem
            utility — the reader can scale the root font, and the two would
            drift apart. */}
        <div
          className={`flex flex-col md:flex-row md:items-center md:justify-between ${
            detailed
              ? "max-sm:min-h-[var(--exp-logo-height)] max-sm:justify-center"
              : ""
          }`}
          style={
            detailed
              ? ({ "--exp-logo-height": `${logoSize}px` } as CSSProperties)
              : undefined
          }
        >
          <p className="text-sm font-medium group-hover:underline">
            {item.meta.title}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs whitespace-nowrap md:mt-0">
            {item.meta.date}
          </p>
        </div>
        {/* "Read more" trails the blurb inline rather than claiming its own
            line. Entries without a blurb — a current role may still be
            unwritten — fall back to it standing alone.
            `clear-left` drops the blurb fully below the floated logo on narrow
            screens so every line starts at the row's left edge, rather than
            indenting the first one or two around it. */}
        {detailed &&
          (item.meta.description ? (
            <p className="text-muted-foreground mt-1.5 clear-left text-xs leading-relaxed sm:clear-none">
              {item.meta.description}{" "}
              <ReadMore />
            </p>
          ) : (
            <p className="mt-2 clear-left text-xs sm:clear-none">
              <ReadMore />
            </p>
          ))}
      </div>
    </>
  );
}
