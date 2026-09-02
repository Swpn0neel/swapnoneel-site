"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const FRAME = "[data-image-frame]";

type ImageState = "loading" | "loaded" | "error";

function frameOf(node: EventTarget | null): HTMLElement | null {
  return node instanceof Element ? node.closest<HTMLElement>(FRAME) : null;
}

function mark(frame: HTMLElement, state: ImageState) {
  frame.dataset.imageState = state;
  if (state === "loading") frame.setAttribute("aria-busy", "true");
  else frame.removeAttribute("aria-busy");
}

// An image that finished before we were listening reports through `complete`.
// That alone does not separate a decoded image from a broken one, and
// naturalWidth cannot either: inside a `content-visibility: auto` subtree
// (the home page's project strip) Chrome has the bytes but has not decoded
// them, so naturalWidth reads 0 for a perfectly good file. Take `complete` at
// its word and let decode() — which rejects only for a broken image — pull the
// frame back to the error state if it was.
function settle(img: HTMLImageElement) {
  const frame = frameOf(img);
  if (!frame) return;
  if (!img.complete) {
    mark(frame, "loading");
    return;
  }
  mark(frame, "loaded");
  if (img.naturalWidth === 0) {
    img.decode().catch(() => mark(frame, "error"));
  }
}

/**
 * The one piece of JavaScript behind every image on the site.
 *
 * StaticImage renders a frame with `data-image-frame`; this mounts once in the
 * root layout and writes `data-image-state` onto those frames as their images
 * load or fail, which is all the fade-in, shimmer and retry UI in
 * components.css keys on. `load` and `error` do not bubble, but a capturing
 * listener on the document still sees every one of them — so no image needs a
 * handler, a ref, or a hydrated component of its own. Same idea as
 * copy-button-listener.tsx.
 *
 * The shimmer animates only while a frame is near the viewport, so a page of
 * lazy images below the fold does not keep a dozen animations ticking.
 */
export function ImageLoadListener() {
  const pathname = usePathname();

  useEffect(() => {
    const onLoad = (event: Event) => {
      if (!(event.target instanceof HTMLImageElement)) return;
      const frame = frameOf(event.target);
      if (frame) mark(frame, "loaded");
    };
    const onError = (event: Event) => {
      if (!(event.target instanceof HTMLImageElement)) return;
      const frame = frameOf(event.target);
      if (frame) mark(frame, "error");
    };
    const retry = (event: Event) => {
      const control =
        event.target instanceof Element
          ? event.target.closest("[data-image-retry]")
          : null;
      if (!control) return;
      // Frames sit inside links and the profile-photo button; a retry is
      // neither a navigation nor a spin.
      event.preventDefault();
      event.stopPropagation();
      const frame = frameOf(control);
      const picture = frame?.querySelector("picture");
      if (!frame || !picture) return;
      // Remount rather than reassign `src`: the browser committed to whichever
      // <source> matched, and writing `src` back does not re-run that
      // selection. A fresh clone does.
      picture.replaceWith(picture.cloneNode(true));
      mark(frame, "loading");
    };
    // The retry control is a span with a button role (see StaticImage), so
    // the keyboard activation a real button gets for free is supplied here.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") retry(event);
    };

    document.addEventListener("load", onLoad, true);
    document.addEventListener("error", onError, true);
    document.addEventListener("click", retry, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("load", onLoad, true);
      document.removeEventListener("error", onError, true);
      document.removeEventListener("click", retry, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  // Every route swap renders a new set of frames (PageTransition keys the tree
  // on the pathname), so the sweep and the observer are rebuilt per route.
  useEffect(() => {
    const frames = Array.from(document.querySelectorAll<HTMLElement>(FRAME));
    for (const frame of frames) {
      const img = frame.querySelector("img");
      if (img) settle(img);
    }

    if (!("IntersectionObserver" in window)) {
      for (const frame of frames) frame.dataset.imageNear = "true";
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          (entry.target as HTMLElement).dataset.imageNear = entry.isIntersecting
            ? "true"
            : "false";
        }
      },
      { rootMargin: "160px 0px" }
    );
    for (const frame of frames) observer.observe(frame);
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
