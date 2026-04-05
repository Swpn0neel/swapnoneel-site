"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
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

  // Duplicate images for a seamless infinite feel
  const doubled = [...images, ...images];

  return (
    <div className="embla w-full overflow-hidden" ref={emblaRef}>
      <div className="embla__container flex">
        {doubled.map((img, i) => (
          <div
            key={i}
            className="embla__slide flex-shrink-0 mr-4 rounded-lg overflow-hidden"
            style={{ width: 280, height: 180 }}
          >
            <Image
              src={img.src}
              alt={img.alt}
              width={280}
              height={180}
              className="object-cover w-full h-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
