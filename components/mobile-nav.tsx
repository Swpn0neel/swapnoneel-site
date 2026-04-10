"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

const navItems = [
  { href: "/", label: "home." },
  { href: "/blog", label: "blog." },
  { href: "/work", label: "work." },
  { href: "/contact", label: "contact." },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();
  const menuRef = React.useRef<HTMLDivElement>(null);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const firstFocusableRef = React.useRef<HTMLElement>(null);
  const lastFocusableRef = React.useRef<HTMLElement>(null);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  React.useEffect(() => {
    if (isOpen && menuRef.current) {
      const focusableElements = menuRef.current.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])"
      );
      if (focusableElements.length > 0) {
        firstFocusableRef.current = focusableElements[0];
        lastFocusableRef.current =
          focusableElements[focusableElements.length - 1];
        firstFocusableRef.current?.focus();
      }
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        menuButtonRef.current?.focus();
        return;
      }

      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusableRef.current) {
            e.preventDefault();
            lastFocusableRef.current?.focus();
          }
        } else {
          if (document.activeElement === lastFocusableRef.current) {
            e.preventDefault();
            firstFocusableRef.current?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        ref={menuButtonRef}
        onClick={toggleMenu}
        className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 focus-visible:ring-ring relative z-[60] flex items-center justify-center rounded-md p-2 transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
      >
        <Menu
          className={`h-4 w-4 transition-all duration-300 ${
            isOpen
              ? "scale-0 rotate-90 opacity-0"
              : "scale-100 rotate-0 opacity-100"
          }`}
        />
        <X
          className={`absolute h-4 w-4 transition-all duration-300 ${
            isOpen
              ? "scale-100 rotate-0 opacity-100"
              : "scale-0 -rotate-90 opacity-0"
          }`}
        />
      </button>

      <div
        ref={menuRef}
        id="mobile-menu"
        className={`bg-background/80 border-border absolute top-full right-0 left-0 z-50 mt-2 flex origin-top flex-col items-center gap-4 rounded-xl border py-4 shadow-lg saturate-[160%] backdrop-blur-[20px] transition-all duration-300 ease-out ${
          isOpen
            ? "pointer-events-auto translate-y-0 scale-y-100 opacity-100"
            : "pointer-events-none -translate-y-2 scale-y-95 opacity-0"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={closeMenu}
            className="text-foreground focus-visible:ring-ring w-full rounded-md py-2 text-center text-sm font-medium transition-opacity hover:opacity-60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            aria-current={pathname === item.href ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
