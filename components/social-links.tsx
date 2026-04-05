"use client";

import { Linkedin } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

const links = [
  { name: "github", brand: "github", url: "https://github.com/Swpn0neel" },
  { name: "linkedin", brand: "linkedin", url: "https://www.linkedin.com/in/swapnoneel-saha-14a3161b6/" },
  { name: "x", brand: "x", url: "https://x.com/swapnoneel123" },
  { name: "leetcode", brand: "leetcode", url: "https://leetcode.com/u/Swapnoneel/" },
  { name: "instagram", brand: "instagram", url: "https://instagram.com/swapnoneel111" },
  { name: "hashnode", brand: "hashnode", url: "https://swapnoneel.hashnode.dev" },
  { name: "dev.to", brand: "devdotto", url: "https://dev.to/swapnoneel123" },
  { name: "letterboxd", brand: "letterboxd", url: "https://letterboxd.com/Swapnoneel/" },
  { name: "discord", brand: "discord", url: "https://discord.com/users/729954975735873537" },
  { name: "telegram", brand: "telegram", url: "https://t.me/swapnoneel123" },
];

export default function SocialLinks() {
  const autoplayRef = useRef(
    Autoplay({ delay: 2500, stopOnInteraction: false })
  );
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "start" }, [
    autoplayRef.current,
  ]);

  // Duplicate the links array to allow continuous infinite scrolling feeling
  const doubled = [...links, ...links, ...links]; 

  return (
    <div className="embla w-full overflow-hidden" ref={emblaRef}>
      <div className="embla__container flex">
        {doubled.map((link, i) => {
          // LinkedIn is not available on simpleicons CDN, so we use Lucide for it.
          const isLinkedin = link.brand === "linkedin";

          return (
            <div key={i} className="embla__slide shrink-0 mr-3">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-24 h-16 bg-secondary hover:bg-black/5 dark:bg-[#1a1a1a] dark:hover:bg-[#252525] border border-border/60 rounded-xl flex items-center justify-center transition-colors group"
              >
                {isLinkedin ? (
                  <Linkedin className="w-6 h-6 text-foreground opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <img
                    src={`https://cdn.simpleicons.org/${link.brand}/white`}
                    alt={link.name}
                    className="w-6 h-6 opacity-80 group-hover:opacity-100 transition-opacity invert dark:invert-0"
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
