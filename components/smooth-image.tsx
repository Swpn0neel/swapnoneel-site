"use client";

import Image from "next/image";
import { ComponentProps, useState } from "react";

interface SmoothImageProps extends Omit<
  ComponentProps<typeof Image>,
  "blurDataURL"
> {
  blurDataURL?: string;
}

export function SmoothImage({
  className = "",
  blurDataURL,
  alt = "",
  ...props
}: SmoothImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  // If no blurDataURL is provided, fallback to standard Next.js Image
  if (!blurDataURL) {
    return <Image className={className} alt={alt} {...props} />;
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
        alt={alt || "placeholder"}
        priority
        unoptimized
      />

      {/* Actual High-Res Image */}
      <Image
        {...imageProps}
        alt={alt}
        className={`${className} absolute inset-0 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{
          ...props.style,
          transition:
            "opacity 300ms cubic-bezier(0.4, 0, 0.2, 1), scale 500ms cubic-bezier(0.4, 0, 0.2, 1), transform 500ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onLoad={(e) => {
          setIsLoaded(true);
          if (props.onLoad) props.onLoad(e);
        }}
      />
    </div>
  );
}
