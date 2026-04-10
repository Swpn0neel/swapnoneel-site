"use client";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { useRef } from "react";

type CarouselImage = {
  src: string;
  alt: string;
};

export default function Carousel({ images }: { images: CarouselImage[] }) {
  const autoplayRef = useRef(
    Autoplay({ delay: 2500, stopOnInteraction: false })
  );
  const [emblaRef] = useEmblaCarousel({ loop: true, dragFree: true }, [
    autoplayRef.current,
  ]);

  const doubled = [...images, ...images];

  return (
    <div
      className="embla w-full overflow-hidden"
      ref={emblaRef}
      role="region"
      aria-label="Image carousel"
      aria-roledescription="carousel"
    >
      <div className="embla__container flex">
        {doubled.map((img, i) => (
          <div
            key={i}
            className="embla__slide mr-4 flex-shrink-0 overflow-hidden rounded-lg"
            style={{ width: 280, height: 180 }}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${(i % images.length) + 1} of ${images.length}: ${img.alt}`}
            tabIndex={-1}
          >
            <Image
              src={img.src}
              alt={img.alt}
              width={280}
              height={180}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
