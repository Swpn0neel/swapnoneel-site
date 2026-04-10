"use client";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { useRef } from "react";

const links = [
  { name: "github", brand: "github", url: "https://github.com/Swpn0neel" },
  {
    name: "linkedin",
    brand: "linkedin",
    url: "https://www.linkedin.com/in/swapnoneel-saha-14a3161b6/",
  },
  { name: "x", brand: "x", url: "https://x.com/swapnoneel123" },
  {
    name: "leetcode",
    brand: "leetcode",
    url: "https://leetcode.com/u/Swapnoneel/",
  },
  {
    name: "instagram",
    brand: "instagram",
    url: "https://instagram.com/swapnoneel111",
  },
  {
    name: "hashnode",
    brand: "hashnode",
    url: "https://swapnoneel.hashnode.dev",
  },
  { name: "dev.to", brand: "devdotto", url: "https://dev.to/swapnoneel123" },
  {
    name: "letterboxd",
    brand: "letterboxd",
    url: "https://letterboxd.com/Swapnoneel/",
  },
  {
    name: "discord",
    brand: "discord",
    url: "https://discord.com/users/729954975735873537",
  },
  { name: "telegram", brand: "telegram", url: "https://t.me/swapnoneel123" },
];

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export default function SocialLinks() {
  const autoplayRef = useRef(
    Autoplay({ delay: 2500, stopOnInteraction: false })
  );
  const [emblaRef] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      duration: 40, // Slower, smoother feel for social icons
      dragFree: true,
    },
    [autoplayRef.current]
  );

  // Duplicate the links array to allow continuous infinite scrolling feeling
  const doubled = [...links, ...links, ...links];

  return (
    <div
      className="embla w-full overflow-hidden"
      ref={emblaRef}
      role="region"
      aria-label="Social links"
      aria-roledescription="carousel"
    >
      <div className="embla__container flex">
        {doubled.map((link, i) => {
          const isLinkedin = link.brand === "linkedin";

          return (
            <div
              key={i}
              className="embla__slide mr-3 shrink-0"
              role="group"
              aria-roledescription="slide"
              aria-label={`Link to ${link.name}`}
              tabIndex={-1}
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-secondary border-border/60 group flex h-16 w-24 items-center justify-center rounded-xl border transition-colors hover:bg-black/5 dark:bg-[#1a1a1a] dark:hover:bg-[#252525]"
              >
                {isLinkedin ? (
                  <LinkedInIcon className="text-foreground h-6 w-6 opacity-80 transition-opacity group-hover:opacity-100" />
                ) : (
                  <img
                    src={`https://cdn.simpleicons.org/${link.brand}/white`}
                    alt={link.name}
                    className="h-6 w-6 opacity-80 invert transition-opacity group-hover:opacity-100 dark:invert-0"
                  />
                )}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
