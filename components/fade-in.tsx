"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

// One shared IntersectionObserver for every FadeIn / StaggerContainer instance
// instead of each component creating its own — same rootMargin/behavior for all.
let sharedObserver: IntersectionObserver | null = null;
const observerCallbacks = new Map<
  Element,
  (entry: IntersectionObserverEntry) => void
>();

function getSharedObserver() {
  if (sharedObserver) return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        observerCallbacks.get(entry.target)?.(entry);
      }
    },
    { rootMargin: "-50px" }
  );
  return sharedObserver;
}

function useInView(once: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = getSharedObserver();

    observerCallbacks.set(el, (entry) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (once) {
          observer.unobserve(el);
          observerCallbacks.delete(el);
        }
      } else if (!once) {
        setIsVisible(false);
      }
    });
    observer.observe(el);

    return () => {
      observer.unobserve(el);
      observerCallbacks.delete(el);
    };
  }, [once]);

  return { ref, isVisible };
}

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
  once?: boolean;
}

export function FadeIn({
  children,
  delay = 0,
  direction = "up",
  className = "",
  once = true,
}: FadeInProps) {
  const { ref, isVisible } = useInView(once);

  const directionClass: Record<string, string> = {
    up: "slide-in-from-bottom-4",
    down: "slide-in-from-top-4",
    left: "slide-in-from-right-4",
    right: "slide-in-from-left-4",
    none: "",
  };

  return (
    <div
      ref={ref}
      className={`${className} ${isVisible ? `animate-in fade-in ${directionClass[direction]} duration-500 ease-out` : "opacity-0"}`}
      style={{ animationDelay: `${delay}s`, animationFillMode: "backwards" }}
    >
      {children}
    </div>
  );
}

const StaggerContext = createContext(false);

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.1,
}: StaggerContainerProps) {
  const { ref, isVisible } = useInView(true);

  return (
    <StaggerContext.Provider value={isVisible}>
      <div
        ref={ref}
        className={className}
        style={{ "--stagger-delay": `${staggerDelay}s` } as React.CSSProperties}
      >
        {children}
      </div>
    </StaggerContext.Provider>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  index?: number; // caller passes index from .map() — no DOM traversal needed
}

export function StaggerItem({
  children,
  className = "",
  index = 0,
}: StaggerItemProps) {
  const isVisible = useContext(StaggerContext);

  return (
    <div
      className={`${className} ${isVisible ? "animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out" : "opacity-0"}`}
      style={{
        animationDelay: `calc(var(--stagger-delay, 0.1s) * ${index})`,
        animationFillMode: "backwards",
      }}
    >
      {children}
    </div>
  );
}
