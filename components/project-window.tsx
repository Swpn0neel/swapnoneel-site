import { ProgressiveImage } from "@/components/progressive-image";
import { projectRenditions } from "@/lib/project-image-loader";

interface ProjectWindowProps {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}

/**
 * The single compositing surface used for project thumbnails and overlay heroes.
 * Chrome and screenshot remain in normal flow inside one clipped window so they
 * cannot drift onto separate compositor layers during carousel transforms.
 */
export function ProjectWindow({
  src,
  alt,
  sizes,
  priority = false,
}: ProjectWindowProps) {
  // Pre-encoded by scripts/generate-project-images.mjs. A cover it has not seen
  // falls through to the optimizer rather than to guessed filenames.
  const renditions = projectRenditions(src);

  return (
    <div className="project-window">
      <div className="project-window-chrome" aria-hidden="true">
        <span className="project-window-lights">
          <span className="project-window-light project-window-light--close" />
          <span className="project-window-light project-window-light--minimize" />
          <span className="project-window-light project-window-light--zoom" />
        </span>
      </div>
      <div className="project-window-shot">
        <div className="project-window-shot-crop">
          <ProgressiveImage
            src={src}
            alt={alt}
            fill
            className="object-cover object-top"
            sizes={sizes}
            critical={priority}
            loading={priority ? "eager" : undefined}
            fetchPriority={priority ? "high" : undefined}
            unoptimized={Boolean(renditions)}
            sourceSets={renditions?.sources.map((source) => ({
              ...source,
              sizes,
            }))}
          />
          {priority && renditions && (
            <link
              rel="preload"
              as="image"
              type="image/avif"
              href={renditions.widest}
              imageSrcSet={renditions.sources[0].srcSet}
              imageSizes={sizes}
              fetchPriority="high"
            />
          )}
        </div>
      </div>
    </div>
  );
}
