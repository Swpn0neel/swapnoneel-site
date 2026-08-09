import Image, { type ImageProps } from "next/image";

interface ProgressiveImageProps extends Omit<
  ImageProps,
  "loader" | "onError" | "onLoad" | "placeholder" | "blurDataURL"
> {
  as?: "div" | "span";
  critical?: boolean;
  sourceSets?: Array<{ sizes?: string; srcSet: string; type: string }>;
}

/**
 * Server-rendered image markup. Images are deliberately opaque in the HTML;
 * the single listener in ProgressiveImageListener only hides an incomplete,
 * non-priority image after its JS has mounted, then fades it back on load.
 * That ordering keeps images visible when JavaScript is disabled or the
 * enhancer chunk fails.
 */
export function ProgressiveImage({
  alt,
  as: Wrapper = "div",
  className = "",
  critical = false,
  sourceSets,
  ...imageProps
}: ProgressiveImageProps) {
  const image = (
    <Image
      {...imageProps}
      alt={alt}
      className={`progressive-image__image ${className}`}
    />
  );

  return (
    <Wrapper
      data-progressive-image
      data-progressive-priority={
        critical || imageProps.priority ? "true" : undefined
      }
      className={`progressive-image relative block overflow-hidden ${
        imageProps.fill ? "size-full" : ""
      }`}
    >
      <span
        aria-hidden="true"
        data-image-shimmer
        data-shimmer-active="false"
        className="image-shimmer progressive-image__shimmer absolute inset-0 transition-opacity duration-300 ease-out"
      />
      {sourceSets?.length ? (
        <picture>
          {sourceSets.map((source) => (
            <source key={source.type} {...source} />
          ))}
          {image}
        </picture>
      ) : (
        image
      )}
    </Wrapper>
  );
}
