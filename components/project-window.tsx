import { ProgressiveImage } from "@/components/progressive-image";

interface ProjectWindowProps {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}

const PROJECT_RENDITION_WIDTHS = [640, 960, 1280, 1536];

function projectRendition(src: string, width: number) {
  return src
    .replace(/^\/project\//, "/project-img/")
    .replace(/\.[^/.]+$/, `-${width}.avif`);
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
  const avifSrcSet = PROJECT_RENDITION_WIDTHS.map(
    (width) => `${projectRendition(src, width)} ${width}w`
  ).join(", ");

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
            unoptimized
            sourceSets={[{ type: "image/avif", srcSet: avifSrcSet, sizes }]}
          />
          {priority && (
            <link
              rel="preload"
              as="image"
              type="image/avif"
              href={projectRendition(
                src,
                PROJECT_RENDITION_WIDTHS[PROJECT_RENDITION_WIDTHS.length - 1]
              )}
              imageSrcSet={avifSrcSet}
              imageSizes={sizes}
              fetchPriority="high"
            />
          )}
        </div>
      </div>
    </div>
  );
}
