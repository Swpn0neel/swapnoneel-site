"use client";

import type { EmblaCarouselType } from "embla-carousel";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const DEFAULT_AUTOPLAY_DELAY_MS = 2500;
const RESUME_AFTER_INTERACTION_MS = 7000;
const SYNCED_SCROLL_DURATION = 30;

// Carousels that share the default delay read the same target time. This keeps
// their next movement aligned without loading a separate autoplay plug-in.
let synchronizedTickAt = 0;

interface SmartCarouselProps {
  children: ReactNode;
  ariaLabel: string;
  className?: string;
  autoplayDelay?: number;
  align?: "start" | "center";
  dragFree?: boolean;
  onSlideChange?: (index: number) => void;
  /**
   * Holds autoplay for reasons the carousel cannot observe itself — an open
   * modal, or a pointer resting on sibling UI that is driven by the slide
   * position. The built-in hover/focus/visibility gates still apply on top.
   */
  paused?: boolean;
}

export function SmartCarousel({
  children,
  ariaLabel,
  className = "",
  autoplayDelay = DEFAULT_AUTOPLAY_DELAY_MS,
  align = "start",
  dragFree = true,
  onSlideChange,
  paused = false,
}: SmartCarouselProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<EmblaCarouselType | null>(null);
  const autoplayTimerRef = useRef<number | null>(null);
  const interactionTimerRef = useRef<number | null>(null);
  const visibleRef = useRef(false);
  const hoveredRef = useRef(false);
  const focusedRef = useRef(false);
  const interactingRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const mountedRef = useRef(true);
  const pausedRef = useRef(paused);
  const releaseInteractionRef = useRef<(() => void) | null>(null);
  const onSlideChangeRef = useRef(onSlideChange);
  const [enhanced, setEnhanced] = useState(false);
  const [autoplayActive, setAutoplayActive] = useState(false);

  useEffect(() => {
    onSlideChangeRef.current = onSlideChange;
  }, [onSlideChange]);

  const clearAutoplayTimer = useCallback(() => {
    if (autoplayTimerRef.current !== null) {
      window.clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
  }, []);

  const canAutoplay = useCallback(() => {
    // hoveredRef can latch if the element under the pointer changed without a
    // pointerleave — a re-render or a layout shift under a still cursor. The
    // DOM is the authority, so re-derive from it rather than trust the flag.
    const root = rootRef.current;
    if (hoveredRef.current && root && !root.matches(":hover")) {
      hoveredRef.current = false;
    }

    return Boolean(
      apiRef.current &&
      visibleRef.current &&
      !pausedRef.current &&
      !document.hidden &&
      !hoveredRef.current &&
      !focusedRef.current &&
      !interactingRef.current &&
      !reducedMotionRef.current
    );
  }, []);

  const scheduleAutoplay = useCallback(() => {
    clearAutoplayTimer();

    if (!canAutoplay()) {
      if (mountedRef.current) setAutoplayActive(false);
      return;
    }

    const now = performance.now();
    let nextTickAt = now + autoplayDelay;
    if (autoplayDelay === DEFAULT_AUTOPLAY_DELAY_MS) {
      if (synchronizedTickAt <= now + 80) {
        synchronizedTickAt = nextTickAt;
      }
      nextTickAt = synchronizedTickAt;
    }

    if (mountedRef.current) setAutoplayActive(true);
    autoplayTimerRef.current = window.setTimeout(
      () => {
        autoplayTimerRef.current = null;
        if (!canAutoplay()) {
          if (mountedRef.current) setAutoplayActive(false);
          return;
        }

        apiRef.current?.scrollNext();
        if (autoplayDelay === DEFAULT_AUTOPLAY_DELAY_MS) {
          synchronizedTickAt = performance.now() + autoplayDelay;
        }
        scheduleAutoplay();
      },
      Math.max(0, nextTickAt - now)
    );
  }, [autoplayDelay, canAutoplay, clearAutoplayTimer]);

  const resumeAfterInteraction = useCallback(() => {
    if (interactionTimerRef.current !== null) {
      window.clearTimeout(interactionTimerRef.current);
    }
    interactionTimerRef.current = window.setTimeout(() => {
      interactionTimerRef.current = null;
      interactingRef.current = false;
      scheduleAutoplay();
    }, RESUME_AFTER_INTERACTION_MS);
  }, [scheduleAutoplay]);

  // Embla binds mouse drag release to the ownerDocument and never takes
  // pointer capture, so a drag that starts on a slide and ends anywhere else
  // on the page — a flick that drifts off the strip, which is most of them —
  // dispatches its pointerup somewhere React cannot see from this subtree.
  // Waiting for onPointerUpCapture there latches interactingRef on for the
  // life of the page and autoplay never comes back. Bind the release to the
  // window, where it always lands.
  const pauseForInteraction = useCallback(() => {
    interactingRef.current = true;
    if (interactionTimerRef.current !== null) {
      window.clearTimeout(interactionTimerRef.current);
      interactionTimerRef.current = null;
    }
    clearAutoplayTimer();
    setAutoplayActive(false);

    if (releaseInteractionRef.current) return;
    const release = () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      releaseInteractionRef.current = null;
      resumeAfterInteraction();
    };
    releaseInteractionRef.current = release;
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
  }, [clearAutoplayTimer, resumeAfterInteraction]);

  useEffect(() => {
    pausedRef.current = paused;
    scheduleAutoplay();
  }, [paused, scheduleAutoplay]);

  useEffect(() => {
    mountedRef.current = true;
    const root = rootRef.current;
    if (!root) return;

    let cancelled = false;
    let loadObserver: IntersectionObserver | null = null;

    const initialise = async () => {
      if (apiRef.current || cancelled) return;

      const { default: EmblaCarousel } = await import("embla-carousel");
      if (cancelled || !rootRef.current) return;

      apiRef.current = EmblaCarousel(rootRef.current, {
        align,
        containScroll: false,
        dragFree,
        duration: SYNCED_SCROLL_DURATION,
        loop: true,
      });
      const notifySlideChange = () => {
        if (!apiRef.current) return;
        onSlideChangeRef.current?.(apiRef.current.selectedScrollSnap());
      };
      apiRef.current.on("select", notifySlideChange);
      notifySlideChange();
      setEnhanced(true);
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

    return () => {
      cancelled = true;
      mountedRef.current = false;
      loadObserver?.disconnect();
      clearAutoplayTimer();
      apiRef.current?.destroy();
      apiRef.current = null;
    };
  }, [align, clearAutoplayTimer, dragFree, scheduleAutoplay]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => {
      reducedMotionRef.current = mediaQuery.matches;
      scheduleAutoplay();
    };
    updateReducedMotion();
    mediaQuery.addEventListener("change", updateReducedMotion);

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current =
          entry.isIntersecting && entry.intersectionRatio >= 0.2;
        scheduleAutoplay();
      },
      { threshold: [0, 0.2, 0.5] }
    );
    visibilityObserver.observe(root);

    const onVisibilityChange = () => scheduleAutoplay();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      mediaQuery.removeEventListener("change", updateReducedMotion);
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      releaseInteractionRef.current?.();
      if (interactionTimerRef.current !== null) {
        window.clearTimeout(interactionTimerRef.current);
        interactionTimerRef.current = null;
      }
    };
  }, [scheduleAutoplay]);

  // The track is overflow-clipped once Embla is driving it, so the browser
  // cannot scroll a focused off-screen slide into view by itself — tabbing
  // would silently land on something invisible. Only keyboard focus moves the
  // track; a click already lands on what the user pointed at.
  const revealFocusedSlide = useCallback((target: EventTarget) => {
    const api = apiRef.current;
    if (!api || !(target instanceof HTMLElement)) return;
    if (!target.matches(":focus-visible")) return;

    const index = api.slideNodes().findIndex((slide) => slide.contains(target));
    if (index !== -1 && index !== api.selectedScrollSnap()) api.scrollTo(index);
  }, []);

  // Counterpart to revealFocusedSlide: the arrow keys move the track, so they
  // have to carry focus along or they strand it on the slide they just pushed
  // out of sight. Only relevant when focus already sits inside a slide.
  const followSelectedSlide = useCallback(() => {
    const api = apiRef.current;
    const active = document.activeElement;
    if (!api || !(active instanceof HTMLElement)) return;

    const slides = api.slideNodes();
    if (!slides.some((slide) => slide.contains(active))) return;

    slides[api.selectedScrollSnap()]
      ?.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      ?.focus({ preventScroll: true });
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      apiRef.current?.scrollPrev();
      followSelectedSlide();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      apiRef.current?.scrollNext();
      followSelectedSlide();
    }
  };

  return (
    <div
      ref={rootRef}
      className={`smart-carousel ${className}`}
      data-carousel-enhanced={enhanced ? "true" : "false"}
      data-autoplay-active={autoplayActive ? "true" : "false"}
      onKeyDown={handleKeyDown}
      onPointerEnter={(event) => {
        if (event.pointerType === "touch") return;
        hoveredRef.current = true;
        clearAutoplayTimer();
        setAutoplayActive(false);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "touch") return;
        hoveredRef.current = false;
        scheduleAutoplay();
      }}
      onFocusCapture={(event) => {
        focusedRef.current = true;
        clearAutoplayTimer();
        setAutoplayActive(false);
        revealFocusedSlide(event.target);
      }}
      onBlurCapture={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        focusedRef.current = false;
        scheduleAutoplay();
      }}
      onPointerDownCapture={pauseForInteraction}
      role="region"
      aria-label={ariaLabel}
      aria-roledescription="carousel"
    >
      {children}
    </div>
  );
}
