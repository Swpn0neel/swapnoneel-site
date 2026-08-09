import { ProgressiveImage } from "@/components/progressive-image";

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
            priority={priority}
          />
        </div>
      </div>
    </div>
  );
}
