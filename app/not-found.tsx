// Imported through the slot, not directly: see components/four-oh-four-game-slot
// for why the game may not be a static import from this file.
import { FourOhFourGameSlot } from "@/components/four-oh-four-game-slot";
import { i18n } from "@/lib/i18n";
import Link from "next/link";

/**
 * The 404, which is the game and one sentence.
 *
 * This page used to end with a suggested-reading block — the standard 404 move,
 * offering something to salvage the trip. The salvage here is the game, and a
 * list of posts underneath it was a second, quieter offer competing with the
 * loud one for the same attention. The navbar above already carries
 * home/work/blog/contact for anyone who just wants out.
 *
 * Losing it takes the content layer off this route entirely: the 404 no longer
 * reads a markdown file to render, and is no longer coupled to the blog.
 */
export default function NotFound() {
  return (
    // Centred in a bounded band rather than stacked under the masthead. Left
    // top-aligned, the game hung above a screenful of nothing once the posts
    // below it went — 640px of it on a tall window.
    //
    // The exact figure wanted here is "whatever the navbar and footer leave",
    // and it is not reachable: <main> measures it as flex-1, but PageTransition
    // sits in between as an auto-height div, so a percentage height on this
    // element resolves against nothing and silently does nothing. 55svh is
    // under that leftover at every size the site is used at, so it can only
    // ever centre — never introduce a scrollbar on a page that fits — and svh
    // rather than vh so a phone's collapsing URL bar cannot resize the band
    // mid-scroll. min- rather than fixed: past that height the block grows.
    //
    // Centring is also why the copy below is handed to the slot rather than
    // rendered next to it. A centred column moves everything in it by half of
    // any height it gains, so opening the play field used to carry the headline
    // up to 84px upward at the exact moment the bricks replaced it. The slot
    // keeps this column's height fixed by holding a reserve that the field
    // takes from — see lib/breakout-field — and the reserve only works from the
    // bottom of the column, below the copy.
    <div className="flex min-h-[55svh] flex-col justify-center py-12 sm:py-16">
      <FourOhFourGameSlot>
        {/* Held to the game's own 460px measure. The container runs to 768px,
            and centred copy set that wide has no left edge for the eye to
            return to — this used to span the whole of it while the 404 sat in a
            narrow column above, so the top of the page read as two unrelated
            objects at two unrelated widths. */}
        <div className="mx-auto mt-6 max-w-[460px] text-center">
          {/* The page's only heading, and until recently it had none at all:
              the 404 above is a <p> on purpose — it is a toy, and it becomes a
              canvas the moment anyone plays with it — so heading navigation
              found nothing here and the page announced no title of its own. */}
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            {i18n.notFound.lead}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {i18n.notFound.sub}
          </p>
          <nav
            aria-label="404 recovery"
            className="text-muted-foreground mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs"
          >
            <Link href="/" className="hover:text-foreground underline">
              home
            </Link>
            <a href="/sitemap.xml" className="hover:text-foreground underline">
              sitemap
            </a>
            <a href="/llms.txt" className="hover:text-foreground underline">
              agent summary
            </a>
            <Link
              href="/developers"
              className="hover:text-foreground underline"
            >
              developer resources
            </Link>
          </nav>
        </div>
      </FourOhFourGameSlot>
    </div>
  );
}
