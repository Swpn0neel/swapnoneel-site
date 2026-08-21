"use client";

import { i18n } from "@/lib/i18n";
import paletteMap from "@/lib/palette-map.json";
import { projectOverlayContent } from "@/lib/project-overlay-content";
import type { ProjectMeta } from "@/lib/project-overlay-data";
import { firstLink } from "@/lib/utils";
import type { CSSProperties } from "react";
import { ProjectWindow } from "./project-window";

const palettes = paletteMap as Record<string, { h1: number; h2: number }>;

interface ProjectDetailContentProps {
  project: ProjectMeta;
  closeButton?: React.ReactNode;
}

export function ProjectDetailContent({
  project,
  closeButton,
}: ProjectDetailContentProps) {
  const { features = [], techStack = [] } =
    projectOverlayContent[project.slug] ?? {};
  const projectLink = firstLink(project.link);
  const palette = project.cover ? palettes[project.cover] : undefined;

  return (
    <>
      {/* Hero — same gradient + framed window treatment as the card */}
      <div
        className={`project-overlay-hero ${project.cover ? "project-cover" : ""}`}
        style={
          project.cover
            ? ({
                "--pc-h1": String(palette?.h1 ?? 220),
                "--pc-h2": String(palette?.h2 ?? 200),
              } as CSSProperties)
            : undefined
        }
      >
        {project.cover ? (
          <ProjectWindow
            src={project.cover}
            alt={project.title}
            sizes="(max-width: 640px) 86vw, 654px"
            priority
          />
        ) : (
          <div className="project-overlay-hero-placeholder">
            <span>{project.title}</span>
          </div>
        )}

        {/* Gradient fade at bottom of image into content area */}
        <div className="project-overlay-hero-fade" />

        {closeButton}

        {/* Title floated on top of hero gradient */}
        <div className="project-overlay-hero-title-bar">
          <h2 id="project-overlay-title" className="project-overlay-hero-title">
            {project.title}
          </h2>
          {projectLink && (
            <a
              href={projectLink}
              target="_blank"
              rel="noopener noreferrer"
              className="project-overlay-glass-link"
              aria-label={i18n.common.learnMore}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 7h10v10" />
                <path d="M7 17 17 7" />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Scrollable info below the hero */}
      <div className="project-overlay-info">
        {project.description && (
          <p
            id="project-overlay-description"
            className="project-overlay-description"
          >
            {project.description}
          </p>
        )}

        <div className="project-overlay-info-grid">
          {features.length > 0 && (
            <div className="project-overlay-section">
              <h3 className="project-overlay-section-title">
                {i18n.overlay.features}
              </h3>
              <ul className="project-overlay-features">
                {features.map((feature) => (
                  <li key={feature} className="project-overlay-feature-item">
                    <span className="project-overlay-feature-bullet">›</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {techStack.length > 0 && (
            <div className="project-overlay-section">
              <h3 className="project-overlay-section-title">
                {i18n.overlay.techStack}
              </h3>
              <div className="project-overlay-tags">
                {techStack.map((tech) => (
                  <span key={tech} className="project-overlay-tag">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
