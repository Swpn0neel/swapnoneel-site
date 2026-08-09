"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

interface BlogNarratorSlotProps {
  articleId: string;
  slug: string;
  year: number | string;
}

function NarratorPlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="border-border bg-secondary/15 mb-6 rounded-md border p-2.5 sm:p-3"
    >
      <div className="h-11" />
    </div>
  );
}

// BlogNarrator is a large client-only player. Keeping its dynamic import inside
// this tiny client seam removes it from every post's initial bundle, while the
// observer delays even requesting the chunk until the reserved player box is
// near the viewport. The placeholder mirrors BlogNarrator's own pre-ready state
// exactly, so loading the player cannot move the article below it.
const BlogNarrator = dynamic(
  () =>
    import("@/components/blog-narrator").then((module) => module.BlogNarrator),
  {
    ssr: false,
    loading: NarratorPlaceholder,
  }
);

export function BlogNarratorSlot(props: BlogNarratorSlotProps) {
  const slotRef = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot || !("IntersectionObserver" in window)) {
      setNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNearViewport(true);
        observer.disconnect();
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(slot);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={slotRef}>
      {nearViewport ? <BlogNarrator {...props} /> : <NarratorPlaceholder />}
    </div>
  );
}
