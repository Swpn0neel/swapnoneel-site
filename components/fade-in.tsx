"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

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
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { rootMargin: "-50px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

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
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { rootMargin: "-50px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
}

export function StaggerItem({ children, className = "" }: StaggerItemProps) {
  const isVisible = useContext(StaggerContext);
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const parent = ref.current.parentElement;
      if (parent) {
        setIndex(Array.from(parent.children).indexOf(ref.current));
      }
    }
  }, []);

  return (
    <div
      ref={ref}
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
