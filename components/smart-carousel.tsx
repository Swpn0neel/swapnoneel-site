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
}

export function SmartCarousel({
  children,
  ariaLabel,
  className = "",
  autoplayDelay = DEFAULT_AUTOPLAY_DELAY_MS,
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
  const [enhanced, setEnhanced] = useState(false);
  const [autoplayActive, setAutoplayActive] = useState(false);

  const clearAutoplayTimer = useCallback(() => {
    if (autoplayTimerRef.current !== null) {
      window.clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
  }, []);

  const canAutoplay = useCallback(
    () =>
      Boolean(
        apiRef.current &&
        visibleRef.current &&
        !document.hidden &&
        !hoveredRef.current &&
        !focusedRef.current &&
        !interactingRef.current &&
        !reducedMotionRef.current
      ),
    []
  );

  const scheduleAutoplay = useCallback(() => {
    clearAutoplayTimer();

    if (!canAutoplay()) {
      if (mountedRef.current) setAutoplayActive(false);
      return;
    }

    const now = performance.now();
    if (
      autoplayDelay !== DEFAULT_AUTOPLAY_DELAY_MS ||
      synchronizedTickAt <= now + 80
    ) {
      synchronizedTickAt = now + autoplayDelay;
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
        synchronizedTickAt = performance.now() + autoplayDelay;
        scheduleAutoplay();
      },
      Math.max(0, synchronizedTickAt - now)
    );
  }, [autoplayDelay, canAutoplay, clearAutoplayTimer]);

  const pauseForInteraction = useCallback(() => {
    interactingRef.current = true;
    if (interactionTimerRef.current !== null) {
      window.clearTimeout(interactionTimerRef.current);
      interactionTimerRef.current = null;
    }
    clearAutoplayTimer();
    setAutoplayActive(false);
  }, [clearAutoplayTimer]);

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
        align: "start",
        containScroll: false,
        dragFree: true,
        duration: SYNCED_SCROLL_DURATION,
        loop: true,
      });
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
  }, [clearAutoplayTimer, scheduleAutoplay]);

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
      if (interactionTimerRef.current !== null) {
        window.clearTimeout(interactionTimerRef.current);
      }
    };
  }, [scheduleAutoplay]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      apiRef.current?.scrollPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      apiRef.current?.scrollNext();
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
      onFocusCapture={() => {
        focusedRef.current = true;
        clearAutoplayTimer();
        setAutoplayActive(false);
      }}
      onBlurCapture={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        focusedRef.current = false;
        scheduleAutoplay();
      }}
      onPointerDownCapture={pauseForInteraction}
      onPointerUpCapture={resumeAfterInteraction}
      onPointerCancelCapture={resumeAfterInteraction}
      role="region"
      aria-label={ariaLabel}
      aria-roledescription="carousel"
    >
      {children}
    </div>
  );
}
