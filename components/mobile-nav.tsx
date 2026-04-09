"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function MobileNav() {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Close menu when window is resized to desktop width
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="md:hidden">
      <button
        onClick={toggleMenu}
        className="relative flex items-center justify-center p-2 text-muted-foreground hover:text-foreground transition-colors duration-300 rounded-md hover:bg-secondary/50 focus:outline-none z-[60]"
        aria-label="Toggle menu"
      >
        <Menu
          className={`h-4 w-4 transition-all duration-300 ${
            isOpen ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        />
        <X
          className={`absolute h-4 w-4 transition-all duration-300 ${
            isOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          }`}
        />
      </button>

      {/* Mobile Menu Dropdown */}
      <div
        className={`absolute top-full left-0 right-0 mt-2 flex flex-col items-center bg-background/80 backdrop-blur-[20px] saturate-[160%] border border-border shadow-lg rounded-xl py-4 gap-4 z-50 origin-top transition-all duration-300 ease-out ${
          isOpen
            ? "translate-y-0 opacity-100 scale-y-100 pointer-events-auto"
            : "-translate-y-2 opacity-0 scale-y-95 pointer-events-none"
        }`}
      >
        <Link
          href="/"
          onClick={closeMenu}
          className="text-sm font-medium text-foreground hover:opacity-60 transition-opacity w-full text-center py-2"
        >
          home.
        </Link>
        <Link
          href="/blog"
          onClick={closeMenu}
          className="text-sm font-medium text-foreground hover:opacity-60 transition-opacity w-full text-center py-2"
        >
          blog.
        </Link>
        <Link
          href="/work"
          onClick={closeMenu}
          className="text-sm font-medium text-foreground hover:opacity-60 transition-opacity w-full text-center py-2"
        >
          work.
        </Link>
        <Link
          href="/contact"
          onClick={closeMenu}
          className="text-sm font-medium text-foreground hover:opacity-60 transition-opacity w-full text-center py-2"
        >
          contact.
        </Link>
      </div>
    </div>
  );
}
