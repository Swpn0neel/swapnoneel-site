"use client";

import {
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

const StaggerContext = { isVisible: false }; // ponytail: removed Context, isVisible passed via parent observer

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
    <div
      ref={ref}
      className={className}
      style={{ "--stagger-delay": `${staggerDelay}s`, "--is-visible": isVisible ? "1" : "0" } as React.CSSProperties}
      data-visible={isVisible}
    >
      {children}
    </div>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  index?: number; // ponytail: caller passes index from .map() — no DOM traversal needed
}

export function StaggerItem({ children, className = "", index = 0 }: StaggerItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current?.closest("[data-visible]");
    if (!el) return;
    const update = () => setIsVisible(el.getAttribute("data-visible") === "true");
    update();
    const mo = new MutationObserver(update);
    mo.observe(el, { attributes: true, attributeFilter: ["data-visible"] });
    return () => mo.disconnect();
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
