"use client";

import { useEffect } from "react";

const SHELL_SELECTOR = "[data-progressive-image]";
const IMAGE_SELECTOR = ".progressive-image__image";

const registeredShells = new Set<HTMLElement>();
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
          shimmer.dataset.shimmerActive = entry.isIntersecting ? "true" : "false";
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
  if (registeredShells.has(shell)) return () => {};

  const image = shell.querySelector<HTMLImageElement>(IMAGE_SELECTOR);
  if (!image) return () => {};

  const finish = (state: "loaded" | "error") => {
    shell.dataset.imageState = state;
    const shimmer = shell.querySelector<HTMLElement>("[data-image-shimmer]");
    if (shimmer) shimmer.dataset.shimmerActive = "false";
    getIntersectionObserver()?.unobserve(shell);
  };
  const onLoad = () => finish("loaded");
  const onError = () => finish("error");

  registeredShells.add(shell);
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

  return () => {
    image.removeEventListener("load", onLoad);
    image.removeEventListener("error", onError);
    getIntersectionObserver()?.unobserve(shell);
    registeredShells.delete(shell);
  };
}

function initializeTree(root: ParentNode) {
  if (root instanceof HTMLElement && root.matches(SHELL_SELECTOR)) {
    registerProgressiveImage(root);
  }
  root
    .querySelectorAll<HTMLElement>(SHELL_SELECTOR)
    .forEach((shell) => registerProgressiveImage(shell));
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

    initializeTree(routeRoot);

    const pendingRoots = new Set<ParentNode>();
    let frame = 0;
    const flush = () => {
      frame = 0;
      for (const root of pendingRoots) initializeTree(root);
      pendingRoots.clear();
    };
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement) pendingRoots.add(node);
        }
      }
      if (!frame && pendingRoots.size) frame = requestAnimationFrame(flush);
    });

    observer.observe(routeRoot, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
