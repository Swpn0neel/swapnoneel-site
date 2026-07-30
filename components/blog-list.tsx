import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { type CSSProperties } from "react";

interface Post {
  slug: string;
  title: string;
  publishedAt: string;
  // Company accent for hover (Keploy orange, Maxim green, ...), already
  // resolved server-side — see lib/blog-brand.
  accent?: string;
}

interface BlogListProps {
  posts: Post[];
}

// Deliberately a server component. The only state this ever held was "is this
// year collapsed", and paying for it with `use client` meant all 44 rows were
// re-executed and reconciled on the client: 770ms TBT and 650ms of Style &
// Layout on /blog, the worst score on the site. A native <details> gets the
// same behaviour with no JS at all — see .details-animated in globals.css for
// the open/close transition.
export function BlogList({ posts }: BlogListProps) {
  // Group by year
  const grouped = posts.reduce<Record<string, Post[]>>((acc, post) => {
    const year = new Date(post.publishedAt).getFullYear().toString();
    if (!acc[year]) acc[year] = [];
    acc[year].push(post);
    return acc;
  }, {});

  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="pb-12">
      {years.map((year) => (
        <details key={year} open className="details-animated group/year mb-6">
          {/* Year Accordion Trigger. list-none plus the webkit marker rule
              removes the UA disclosure triangle; the chevron below is the
              affordance, rotated by the parent's [open] state.

              Three named groups are in play and none of them may be the
              anonymous `group`: /year is the details (open state), /head is
              the summary (hover state — an unnamed group here would make
              hovering any post row light up the year heading), /row is each
              link. */}
          <summary className="group/head flex w-full cursor-pointer list-none items-center justify-between py-2 select-none [&::-webkit-details-marker]:hidden">
            <div className="flex items-center gap-2.5">
              <h2 className="text-foreground group-hover/head:text-muted-foreground text-sm font-semibold transition-colors">
                {year}
              </h2>
              {/* Full-opacity muted-foreground, not /60: at 10px on
                  secondary/65 the faded version was 3.29:1, below the 4.5:1
                  WCAG AA floor for small text. */}
              <span className="text-muted-foreground bg-secondary/65 rounded-full px-2 py-0.5 font-mono text-[10px] leading-none font-medium">
                {grouped[year].length}
              </span>
            </div>
            <ChevronDown
              aria-hidden="true"
              className="text-muted-foreground/50 group-hover/head:text-foreground h-4 w-4 -rotate-90 transition-all duration-300 group-open/year:rotate-0"
            />
          </summary>

          <div className="space-y-0 pt-2 pb-4">
            {grouped[year].map((post, i) => {
              const d = new Date(post.publishedAt);
              const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
              return (
                <div key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group/row flex items-center justify-between py-3"
                  >
                    <span
                      className={cn(
                        "text-muted-foreground min-w-0 truncate text-sm transition-colors",
                        post.accent
                          ? "group-hover/row:text-(--post-accent)"
                          : "group-hover/row:text-foreground"
                      )}
                      style={
                        post.accent
                          ? ({
                              "--post-accent": post.accent,
                            } as CSSProperties)
                          : undefined
                      }
                    >
                      {post.title}
                    </span>
                    <span className="text-muted-foreground ml-4 shrink-0 font-mono text-xs">
                      {dateStr}
                    </span>
                  </Link>
                  {i < grouped[year].length - 1 && (
                    <hr className="border-border/40" />
                  )}
                </div>
              );
            })}
          </div>
          <hr className="border-border/40 mt-1" />
        </details>
      ))}
    </div>
  );
}
