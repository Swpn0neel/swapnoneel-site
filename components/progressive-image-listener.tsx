"use client";

import { useEffect } from "react";

const SHELL_SELECTOR = "[data-progressive-image]";
const UNENHANCED_SHELL_SELECTOR =
  '[data-progressive-image]:not([data-image-enhanced="true"])';
const IMAGE_SELECTOR = ".progressive-image__image";

type ImageRegistration = {
  cleanup: () => void;
};

// A fallback scan can win the race with a component effect. A WeakMap keeps
// that shared registration from retaining a detached shell, while returning
// the same cleanup to the later component owner.
const registeredShells = new WeakMap<HTMLElement, ImageRegistration>();
let intersectionObserver: IntersectionObserver | null = null;

function getIntersectionObserver() {
  if (intersectionObserver || !("IntersectionObserver" in window)) {
    return intersectionObserver;
  }

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const shell = entry.target as HTMLElement;
        const shimmer = shell.querySelector<HTMLElement>(
          "[data-image-shimmer]"
        );
        if (shimmer && shell.dataset.imageState === "loading") {
          shimmer.dataset.shimmerActive = entry.isIntersecting
            ? "true"
            : "false";
        }
      }
    },
    { rootMargin: "160px 0px" }
  );

  return intersectionObserver;
}

/**
 * Registers a ProgressiveImage at its own hydration boundary. The image stays
 * visible in the server HTML; registration only opts an incomplete,
 * non-priority image into the established shimmer/fade behaviour.
 */
export function registerProgressiveImage(shell: HTMLElement) {
  const existing = registeredShells.get(shell);
  if (existing) return existing.cleanup;

  const image = shell.querySelector<HTMLImageElement>(IMAGE_SELECTOR);
  if (!image) return () => {};

  const finish = (state: "loaded" | "error") => {
    shell.dataset.imageState = state;
    const shimmer = shell.querySelector<HTMLElement>("[data-image-shimmer]");
    if (shimmer) shimmer.dataset.shimmerActive = "false";
    getIntersectionObserver()?.unobserve(shell);
    image.removeEventListener("load", onLoad);
    image.removeEventListener("error", onError);
  };
  const onLoad = () => finish("loaded");
  const onError = () => finish("error");

  const cleanup = () => {
    // A stale owner can run after a fallback scan has re-registered a moved
    // shell. It must not tear down that newer registration.
    if (registeredShells.get(shell) !== registration) return;
    image.removeEventListener("load", onLoad);
    image.removeEventListener("error", onError);
    getIntersectionObserver()?.unobserve(shell);
    registeredShells.delete(shell);
    delete shell.dataset.imageEnhanced;
  };
  const registration: ImageRegistration = { cleanup };
  registeredShells.set(shell, registration);
  shell.dataset.imageEnhanced = "true";
  image.addEventListener("load", onLoad);
  image.addEventListener("error", onError);

  if (image.complete) {
    finish(image.naturalWidth > 0 ? "loaded" : "error");
  } else {
    shell.dataset.imageState = "loading";
    const observer = getIntersectionObserver();
    if (observer) {
      observer.observe(shell);
    } else {
      const shimmer = shell.querySelector<HTMLElement>("[data-image-shimmer]");
      if (shimmer) shimmer.dataset.shimmerActive = "true";
    }
  }

  return cleanup;
}

function initializeRoute(root: HTMLElement) {
  root
    .querySelectorAll<HTMLElement>(UNENHANCED_SHELL_SELECTOR)
    .forEach((shell) => registerProgressiveImage(shell));
}

function unregisterTree(root: Node) {
  if (!(root instanceof HTMLElement)) return;

  if (root.matches(SHELL_SELECTOR)) {
    registeredShells.get(root)?.cleanup();
  }
  root
    .querySelectorAll<HTMLElement>(SHELL_SELECTOR)
    .forEach((shell) => registeredShells.get(shell)?.cleanup());
}

/**
 * Direct image registration covers normal React navigation. This fallback is
 * deliberately limited to route content for nodes inserted by streamed or
 * third-party dynamic content, and coalesces a mutation burst into one scan.
 */
export function ProgressiveImageListener() {
  useEffect(() => {
    const routeRoot = document.getElementById("main-content");
    if (!routeRoot) return;

    initializeRoute(routeRoot);

    let frame = 0;
    const flush = () => {
      frame = 0;
      // Dynamic narration can insert thousands of small nodes. One route-root
      // query avoids work proportional to that mutation burst.
      initializeRoute(routeRoot);
    };
    const observer = new MutationObserver((records) => {
      let hasAdditions = false;
      for (const record of records) {
        hasAdditions ||= record.addedNodes.length > 0;
        record.removedNodes.forEach(unregisterTree);
      }
      if (!frame && hasAdditions) frame = requestAnimationFrame(flush);
    });

    observer.observe(routeRoot, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
