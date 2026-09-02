import { StaticImage } from "@/components/static-image";
import { projectRenditions } from "@/lib/project-image-loader";

interface ProjectWindowProps {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
}

/**
 * The single compositing surface used for project thumbnails and page heroes.
 * Chrome and screenshot remain in normal flow inside one clipped window so they
 * cannot drift onto separate compositor layers during carousel transforms.
 */
export function ProjectWindow({
  src,
  alt,
  sizes,
  priority = false,
  loading,
}: ProjectWindowProps) {
  // Pre-encoded by scripts/generate-project-images.mjs. A cover it has not seen
  // renders the original file rather than guessed filenames.
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
          <StaticImage
            src={src}
            alt={alt}
            sources={renditions?.sources}
            sizes={sizes}
            fill
            className="object-cover object-top"
            priority={priority}
            // Undefined falls through to StaticImage's lazy default; the
            // carousel passes eager for the slides that are on screen.
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
