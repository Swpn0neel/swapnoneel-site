"use client";

import { useEffect } from "react";

const SHELL_SELECTOR = "[data-progressive-image]";
const IMAGE_SELECTOR = ".progressive-image__image";

export function ProgressiveImageListener() {
  useEffect(() => {
    const finish = (shell: HTMLElement, state: "loaded" | "error") => {
      shell.dataset.imageState = state;
      const shimmer = shell.querySelector<HTMLElement>("[data-image-shimmer]");
      if (shimmer) shimmer.dataset.shimmerActive = "false";
      intersectionObserver?.unobserve(shell);
    };

    const intersectionObserver =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
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
          )
        : null;

    const initialize = (shell: HTMLElement) => {
      if (shell.dataset.imageEnhanced === "true") return;
      shell.dataset.imageEnhanced = "true";
      const image = shell.querySelector<HTMLImageElement>(IMAGE_SELECTOR);
      if (!image) return;

      if (image.complete) {
        finish(shell, image.naturalWidth > 0 ? "loaded" : "error");
        return;
      }

      shell.dataset.imageState = "loading";
      if (intersectionObserver) {
        intersectionObserver.observe(shell);
      } else {
        const shimmer = shell.querySelector<HTMLElement>(
          "[data-image-shimmer]"
        );
        if (shimmer) shimmer.dataset.shimmerActive = "true";
      }
    };

    const initializeTree = (root: ParentNode) => {
      if (root instanceof HTMLElement && root.matches(SHELL_SELECTOR)) {
        initialize(root);
      }
      root
        .querySelectorAll<HTMLElement>(SHELL_SELECTOR)
        .forEach((shell) => initialize(shell));
    };

    const onImageEvent = (event: Event) => {
      const image = event.target;
      if (
        !(image instanceof HTMLImageElement) ||
        !image.matches(IMAGE_SELECTOR)
      )
        return;
      const shell = image.closest<HTMLElement>(SHELL_SELECTOR);
      if (shell) finish(shell, event.type === "load" ? "loaded" : "error");
    };

    initializeTree(document);
    document.addEventListener("load", onImageEvent, true);
    document.addEventListener("error", onImageEvent, true);

    // The root layout survives App Router navigations, so discover progressive
    // images introduced by later RSC payloads without mounting another listener.
    const mutationObserver = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement) initializeTree(node);
        }
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("load", onImageEvent, true);
      document.removeEventListener("error", onImageEvent, true);
      mutationObserver.disconnect();
      intersectionObserver?.disconnect();
    };
  }, []);

  return null;
}
