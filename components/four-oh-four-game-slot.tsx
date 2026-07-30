"use client";

import dynamic from "next/dynamic";

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

export function FourOhFourGameSlot() {
  return <FourOhFourBreakout />;
}
