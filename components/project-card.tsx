import Image from "next/image";
import { blurPlaceholder } from "@/lib/blur";
import Link from "next/link";

interface ProjectCardProps {
  item: {
    meta: {
      slug: string;
      cover?: string;
      title: string;
      description?: string;
      link?: string;
    };
  };
}

export default function ProjectCard({ item }: ProjectCardProps) {
  const href = item.meta.link ?? `/work/${item.meta.slug}`;
  const isExternal = !!item.meta.link;

  const CardContent = (
    <div className="group border-border hover:border-foreground/30 block h-full overflow-hidden rounded-lg border transition-colors">
      {item.meta.cover ? (
        <Image
          src={item.meta.cover}
          alt={item.meta.title}
          width={400}
          height={225}
          className="h-36 w-full object-cover"
          placeholder="blur"
          blurDataURL={blurPlaceholder}
        />
      ) : (
        <div className="bg-secondary text-muted-foreground flex h-36 w-full items-center justify-center px-4 text-center font-mono text-xs">
          {item.meta.title}
        </div>
      )}
      <div className="p-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold">{item.meta.title}</p>
          {isExternal && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <path d="M7 7h10v10" />
              <path d="M7 17 17 7" />
            </svg>
          )}
        </div>
        {item.meta.description && (
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed">
            {item.meta.description}
          </p>
        )}
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {CardContent}
      </a>
    );
  }

  return <Link href={href}>{CardContent}</Link>;
}
