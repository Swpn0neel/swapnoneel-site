"use client";

import Image from "next/image";
import { ComponentProps, useState } from "react";

interface SmoothImageProps extends Omit<ComponentProps<typeof Image>, 'blurDataURL'> {
  blurDataURL?: string;
}

export function SmoothImage({
  className = "",
  blurDataURL,
  ...props
}: SmoothImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  // If no blurDataURL is provided, fallback to standard Next.js Image
  if (!blurDataURL) {
    return <Image className={className} {...props} />;
  }

  const imageProps = { ...props };
  // Next.js warns if width/height are passed alongside fill
  if (imageProps.fill) {
    delete imageProps.width;
    delete imageProps.height;
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Blurred Background Layer */}
      <Image
        {...imageProps}
        src={blurDataURL}
        className={`${className} absolute inset-0 -z-10`}
        style={{ filter: "blur(10px)", transform: "scale(1.1)" }}
        alt={props.alt || "placeholder"}
        priority
        unoptimized
      />

      {/* Actual High-Res Image */}
      <Image
        {...imageProps}
        className={`${className} absolute inset-0 transition-opacity duration-700 ease-in-out ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={(e) => {
          setIsLoaded(true);
          if (props.onLoad) props.onLoad(e);
        }}
      />
    </div>
  );
}
