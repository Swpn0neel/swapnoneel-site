"use client";

import { FIELD } from "@/lib/breakout-field";
import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";

// app/not-found.tsx is part of the root layout's boundary tree, so anything it
// imports statically lands in the eagerly-loaded script set of *every* route.
// The Breakout component and its engine are 10.4 KB raw / 3.6 KB brotli of
// canvas code that only a 404 can ever run, and they were being downloaded and
// evaluated on the home page, every blog post and every project page.
//
// This slot is the seam. It is a client component so it may use `ssr: false`
// (a server component cannot), and it is deliberately tiny — this file is what
// ships everywhere now, while the game itself moves behind a runtime import()
// that no other route ever reaches.
//
// `loading` still renders on the server, so the 404 headline below is real
// server-rendered text: a visitor who never runs the JS sees the same "404"
// they always did, and the game swaps in over it on the one route that needs
// it. The markup mirrors the component's own idle state so the swap is
// invisible.
const FourOhFourBreakout = dynamic(
  () =>
    import("@/components/four-oh-four-breakout").then(
      (m) => m.FourOhFourBreakout
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center">
        <div className="relative mx-auto w-full max-w-[460px] overflow-hidden">
          {/* The numeral is in flow here, so this box takes its height for
              free. In the loaded component both children are absolute and the
              same clamp has to be repeated as a min-h on the wrapper — change
              this size and that one moves with it, or the swap jumps. */}
          <p className="text-muted-foreground pointer-events-none m-0 text-center text-[clamp(4rem,34vw,10rem)] leading-none font-bold">
            404
          </p>
        </div>
        {/* Matches the min-h-11 the loaded component reserves for its HUD, so
            the content below does not jump when the game takes over. */}
        <div className="mt-5 min-h-11" />
      </div>
    ),
  }
);

/**
 * The game, the page's own copy, and the reserve that pays for the play field.
 *
 * The copy arrives as `children` from the server component rather than being
 * rendered beside this one, because the reserve has to be the *last* thing in
 * the centred column. Anywhere higher and the empty space at rest opens up
 * between the game and the sentence under it; at the bottom it is just the
 * page standing off the footer, which nobody reads as a hole.
 *
 * Why a reserve exists at all is in lib/breakout-field: the column is centred,
 * so its height has to stay constant or the headline slides as the field opens.
 * The reserve is the field's complement — 168 and 0, then 0 and 168 — on the
 * same duration and curve as the wrapper's own height transition, so the sum
 * holds at every frame and not merely at the two ends.
 */
export function FourOhFourGameSlot({ children }: { children?: ReactNode }) {
  const [playing, setPlaying] = useState(false);

  return (
    <>
      <FourOhFourBreakout onPlayingChange={setPlaying} />
      {children}
      <div
        className="motion-safe:transition-[height] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ height: playing ? 0 : FIELD }}
      />
    </>
  );
}
