import type { EmblaCarouselType } from "embla-carousel";

/**
 * Vanilla port of components/smart-carousel.tsx. Like the theme toggle, every
 * piece of its state was a ref — `enhanced` was the only useState and it was
 * being mirrored onto a data attribute anyway — so the React shell was pure
 * overhead.
 *
 * Slide changes are announced as a `carousel:select` CustomEvent on the root
 * instead of an `onSlideChange` prop, which is what lets the project index
 * follow the strip without the two needing a shared parent component.
 */

const DEFAULT_AUTOPLAY_DELAY_MS = 2500;
const RESUME_AFTER_INTERACTION_MS = 7000;
const SYNCED_SCROLL_DURATION = 30;

// Shared beat every synced carousel counts against, anchored the first time one
// of them schedules a move. A carousel whose delay is a whole multiple of the
// beat only moves on the beats divisible by that multiple — so the projects
// strip (2 beats) steps in unison with every second step of the socials strip
// (1 beat), rather than the two drifting on independent timers.
let beatOrigin: number | null = null;

// A timer can fire a moment before its deadline, which would otherwise resolve
// to the beat that just passed and schedule a ~0ms timeout — advancing twice in
// one beat. Treat anything within this window as already at the next beat.
const BEAT_TOLERANCE_MS = 80;

/** Target time of the next beat this carousel may move on, or null to run free. */
function nextSyncedTick(now: number, delay: number): number | null {
  if (delay % DEFAULT_AUTOPLAY_DELAY_MS !== 0) return null;

  const multiple = delay / DEFAULT_AUTOPLAY_DELAY_MS;
  if (beatOrigin === null) beatOrigin = now;

  const from = now + BEAT_TOLERANCE_MS - beatOrigin;
  const elapsedBeats = Math.floor(from / DEFAULT_AUTOPLAY_DELAY_MS);
  // Round up to the next beat this carousel owns, always ahead of now.
  const nextBeat = (Math.floor(elapsedBeats / multiple) + 1) * multiple;
  return beatOrigin + nextBeat * DEFAULT_AUTOPLAY_DELAY_MS;
}

export interface CarouselController {
  /**
   * Holds autoplay for reasons the carousel cannot observe itself — an open
   * modal, or a pointer resting on sibling UI driven by the slide position.
   * The built-in hover/focus/visibility gates still apply on top.
   */
  setPaused: (value: boolean) => void;
  scrollTo: (index: number) => void;
  destroy: () => void;
}

export function initSmartCarousel(root: HTMLElement): CarouselController {
  const align = (root.dataset.carouselAlign as "start" | "center") ?? "start";
  const dragFree = root.dataset.carouselDragFree !== "false";
  const autoplayDelay =
    Number(root.dataset.carouselDelay) || DEFAULT_AUTOPLAY_DELAY_MS;

  let api: EmblaCarouselType | null = null;
  let autoplayTimer: number | null = null;
  let interactionTimer: number | null = null;
  let visible = false;
  let hovered = false;
  let focused = false;
  let interacting = false;
  let reducedMotion = false;
  let paused = false;
  let releaseInteraction: (() => void) | null = null;

  const clearAutoplayTimer = () => {
    if (autoplayTimer !== null) {
      window.clearTimeout(autoplayTimer);
      autoplayTimer = null;
    }
  };

  const canAutoplay = () => {
    // `hovered` can latch if the element under the pointer changed without a
    // pointerleave — a layout shift under a still cursor. The DOM is the
    // authority, so re-derive from it rather than trust the flag.
    if (hovered && !root.matches(":hover")) hovered = false;

    return Boolean(
      api &&
      visible &&
      !paused &&
      !document.hidden &&
      !hovered &&
      !focused &&
      !interacting &&
      !reducedMotion
    );
  };

  const scheduleAutoplay = () => {
    clearAutoplayTimer();
    if (!canAutoplay()) return;

    const now = performance.now();
    const nextTickAt =
      nextSyncedTick(now, autoplayDelay) ?? now + autoplayDelay;

    autoplayTimer = window.setTimeout(
      () => {
        autoplayTimer = null;
        if (!canAutoplay()) return;
        api?.scrollNext();
        scheduleAutoplay();
      },
      Math.max(0, nextTickAt - now)
    );
  };

  const resumeAfterInteraction = () => {
    if (interactionTimer !== null) window.clearTimeout(interactionTimer);
    interactionTimer = window.setTimeout(() => {
      interactionTimer = null;
      interacting = false;
      scheduleAutoplay();
    }, RESUME_AFTER_INTERACTION_MS);
  };

  // Embla binds mouse drag release to the ownerDocument and never takes pointer
  // capture, so a drag that starts on a slide and ends anywhere else on the
  // page — a flick that drifts off the strip, which is most of them —
  // dispatches its pointerup outside this subtree. Waiting for it here would
  // latch `interacting` on for the life of the page and autoplay would never
  // come back. Bind the release to the window, where it always lands.
  const pauseForInteraction = () => {
    interacting = true;
    if (interactionTimer !== null) {
      window.clearTimeout(interactionTimer);
      interactionTimer = null;
    }
    clearAutoplayTimer();

    if (releaseInteraction) return;
    const release = () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      releaseInteraction = null;
      resumeAfterInteraction();
    };
    releaseInteraction = release;
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
  };

  // The track is overflow-clipped once Embla is driving it, so the browser
  // cannot scroll a focused off-screen slide into view by itself — tabbing
  // would silently land on something invisible. Only keyboard focus moves the
  // track; a click already lands on what the user pointed at.
  const revealFocusedSlide = (target: EventTarget | null) => {
    if (!api || !(target instanceof HTMLElement)) return;
    if (!target.matches(":focus-visible")) return;

    const index = api.slideNodes().findIndex((slide) => slide.contains(target));
    if (index !== -1 && index !== api.selectedScrollSnap()) api.scrollTo(index);
  };

  // Counterpart to revealFocusedSlide: the arrow keys move the track, so they
  // have to carry focus along or they strand it on the slide they just pushed
  // out of sight. Only relevant when focus already sits inside a slide.
  const followSelectedSlide = () => {
    const active = document.activeElement;
    if (!api || !(active instanceof HTMLElement)) return;

    const slides = api.slideNodes();
    if (!slides.some((slide) => slide.contains(active))) return;

    slides[api.selectedScrollSnap()]
      ?.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      ?.focus({ preventScroll: true });
  };

  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      api?.scrollPrev();
      followSelectedSlide();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      api?.scrollNext();
      followSelectedSlide();
    }
  });

  root.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    hovered = true;
    clearAutoplayTimer();
  });
  root.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "touch") return;
    hovered = false;
    scheduleAutoplay();
  });
  root.addEventListener(
    "focusin",
    (event) => {
      focused = true;
      clearAutoplayTimer();
      revealFocusedSlide(event.target);
    },
    true
  );
  root.addEventListener("focusout", (event) => {
    if (root.contains(event.relatedTarget as Node | null)) return;
    focused = false;
    scheduleAutoplay();
  });
  root.addEventListener("pointerdown", pauseForInteraction, true);

  let cancelled = false;
  let loadObserver: IntersectionObserver | null = null;

  const initialise = async () => {
    if (api || cancelled) return;

    const { default: EmblaCarousel } = await import("embla-carousel");
    if (cancelled) return;

    // The fallback track carries a lead-in margin Embla must not see — it
    // measures the DOM, so the offset would be applied twice. Write it in the
    // same task that constructs Embla so the margin is already gone.
    root.dataset.carouselEnhanced = "true";

    api = EmblaCarousel(root, {
      align,
      containScroll: false,
      dragFree,
      duration: SYNCED_SCROLL_DURATION,
      loop: true,
    });

    const notifySlideChange = () => {
      if (!api) return;
      root.dispatchEvent(
        new CustomEvent("carousel:select", {
          detail: { index: api.selectedScrollSnap() },
        })
      );
    };
    api.on("select", notifySlideChange);
    notifySlideChange();
    scheduleAutoplay();
  };

  if ("IntersectionObserver" in window) {
    loadObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        loadObserver?.disconnect();
        void initialise();
      },
      { rootMargin: "320px 0px" }
    );
    loadObserver.observe(root);
  } else {
    void initialise();
  }

  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const updateReducedMotion = () => {
    reducedMotion = mediaQuery.matches;
    scheduleAutoplay();
  };
  updateReducedMotion();
  mediaQuery.addEventListener("change", updateReducedMotion);

  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      scheduleAutoplay();
    },
    { threshold: 0 }
  );
  visibilityObserver.observe(root);

  // Bound per carousel but torn down with it; the controller's destroy()
  // removes it, and a swapped-away carousel is destroyed by its page.
  const onVisibilityChange = () => scheduleAutoplay();
  document.addEventListener("visibilitychange", onVisibilityChange);

  return {
    setPaused(value: boolean) {
      paused = value;
      scheduleAutoplay();
    },
    scrollTo(index: number) {
      api?.scrollTo(index);
    },
    destroy() {
      cancelled = true;
      loadObserver?.disconnect();
      visibilityObserver.disconnect();
      mediaQuery.removeEventListener("change", updateReducedMotion);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      releaseInteraction?.();
      clearAutoplayTimer();
      if (interactionTimer !== null) window.clearTimeout(interactionTimer);
      api?.destroy();
      api = null;
    },
  };
}
