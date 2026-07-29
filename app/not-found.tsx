import { FourOhFourBreakout } from "@/components/four-oh-four-breakout";
import { i18n } from "@/lib/i18n";
import { getAllBlogPosts } from "@/lib/md";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

// Previously this picked a random post, which forced the route to render per
// request — re-reading all 43 markdown files and their narration JSON on every
// 404. getAllBlogPosts() is already sorted newest-first, so taking the head is
// both cheaper and more useful, and it lets the page prerender.
export default async function NotFound() {
  const [latest] = await getAllBlogPosts();

  return (
    <div className="py-20">
      {/* The navbar above already carries home/work/blog/contact, so there is
          no quick-links row here; it was the same four links twice. */}
      <FourOhFourBreakout />

      <div className="mt-8 text-center">
        <p className="text-foreground text-lg">{i18n.notFound.lead}</p>
        <p className="text-muted-foreground mt-1 text-sm">
          {i18n.notFound.sub}
        </p>
      </div>

      {latest && (
        <div className="border-border bg-card mt-12 rounded-md border p-6">
          <p className="text-muted-foreground mb-3 text-center text-xs tracking-widest uppercase">
            {i18n.notFound.latestLabel}
          </p>
          {/* The arrow is inline with the title rather than a flex sibling of
              it. As a sibling it centred itself against the whole wrapped
              block, so on a title long enough to wrap it floated off beside the
              middle line instead of following the last word. */}
          <Link
            href={`/blog/${latest.slug}`}
            aria-label={`${i18n.notFound.readNow}: ${latest.title}`}
            className="text-foreground hover:text-muted-foreground block text-center font-medium transition-colors"
          >
            {latest.title}
            <ArrowUpRight
              aria-hidden="true"
              className="ml-1 inline size-4 align-[-0.15em]"
            />
          </Link>
        </div>
      )}
    </div>
  );
}
