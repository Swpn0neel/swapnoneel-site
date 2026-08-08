import { i18n } from "@/lib/i18n";
import type { RelatedPost } from "@/lib/related-posts";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { type CSSProperties } from "react";

interface RelatedPostsProps {
  posts: RelatedPost[];
}

// Server component for the same reason BlogList is one: it holds no state, and
// the rows are the last thing on a long page, so there's no reason to ship or
// hydrate anything for them.
export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <nav
      aria-labelledby="read-next-heading"
      className="blog-footer-gap border-border/40 border-t pt-8"
    >
      {/* Same section heading as Experience / Projects on the home page —
          muted, uppercase, wide tracking. The size comes from a scaled class
          rather than text-sm so it tracks A-/A/A+ with the rows beneath it;
          at the default setting the two resolve to the same 0.875rem. */}
      <h2
        id="read-next-heading"
        className="text-muted-foreground blog-related-title mb-3 font-semibold tracking-widest uppercase"
      >
        {i18n.blog.readNext}
      </h2>

      <ul className="space-y-0">
        {posts.map((post, i) => {
          const d = new Date(post.publishedAt);
          const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(
            d.getMonth() + 1
          ).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
          return (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group/row block py-3.5"
              >
                <div className="flex items-baseline justify-between gap-4">
                  {/* Titles start at full foreground, so the only colour move
                      available to them on hover is downwards — which reads as
                      the row going inactive under the cursor. Branded posts
                      move sideways into their accent instead (the same one the
                      listing uses, see lib/blog-brand) and the rest hold still;
                      the hover feedback for those is the description below
                      brightening, which is the direction the rest of the site
                      moves on hover. */}
                  <span
                    className={cn(
                      "text-foreground blog-related-title min-w-0 font-medium transition-colors",
                      post.accent && "group-hover/row:text-(--post-accent)"
                    )}
                    style={
                      post.accent
                        ? ({ "--post-accent": post.accent } as CSSProperties)
                        : undefined
                    }
                  >
                    {post.title}
                  </span>
                  {/* Hidden on phones: the column is narrow enough there that
                      the date costs the title a line more often than it tells
                      the reader anything. */}
                  <span className="text-muted-foreground blog-related-meta hidden shrink-0 font-mono sm:inline">
                    {dateStr}
                  </span>
                </div>
                {post.brief && (
                  <p className="text-muted-foreground group-hover/row:text-body-foreground blog-related-meta mt-1 line-clamp-2 transition-colors">
                    {post.brief}
                  </p>
                )}
              </Link>
              {i < posts.length - 1 && <hr className="border-border/40" />}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
