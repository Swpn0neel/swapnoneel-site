"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsBlocked(document.body.style.overflow === "hidden");
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });

    // Initial check
    setIsBlocked(document.body.style.overflow === "hidden");

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show when user scrolls down 400px
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    // Initial check
    toggleVisibility();

    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`border-border bg-background/80 text-muted-foreground hover:border-foreground/20 hover:text-foreground fixed right-8 bottom-8 z-[100] flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 hover:shadow-sm active:scale-95 ${
        isVisible && !isBlocked
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
      aria-label="Back to top"
    >
      <ArrowUp size={18} strokeWidth={1.5} />
    </button>
  );
}
