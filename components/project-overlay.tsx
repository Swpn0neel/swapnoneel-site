"use client";

import { SmoothImage } from "@/components/smooth-image";
import blurMap from "@/lib/blur-map.json";
import { i18n } from "@/lib/i18n";
import { useCallback, useEffect, useRef, useState } from "react";

interface ProjectMeta {
  slug: string;
  cover?: string;
  title: string;
  description?: string;
  link?: string;
}

export interface ProjectOverlayData {
  meta: ProjectMeta;
  content: string;
}

interface ProjectOverlayProps {
  project: ProjectOverlayData | null;
  onClose: () => void;
}

function parseSection(content: string, heading: string): string[] {
  const regex = new RegExp(
    `###\\s+${heading}[\\s\\S]*?\\n([\\s\\S]*?)(?=###|$)`,
    "i"
  );
  const match = content.match(regex);
  if (!match) return [];

  const lines = match[1].split("\n");
  const result: string[] = [];

  for (const line of lines) {
    if (line.trim().startsWith("-")) {
      const cleaned = line.replace(/^-\s*/, "").trim();
      if (cleaned) {
        result.push(cleaned);
      }
    }
  }

  return result;
}

export function ProjectOverlay({ project, onClose }: ProjectOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (project) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      setIsClosing(false);
    }
  }, [project]);

  // Lock body scroll when overlay is open
  useEffect(() => {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    if (project) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [project]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 400);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose]);

  if (!project && !isClosing) return null;

  const techStack = project ? parseSection(project.content, "Tech Stack") : [];
  const features = project ? parseSection(project.content, "Features") : [];
  const projectLink = project?.meta.link;

  return (
    <div
      ref={overlayRef}
      className={`project-overlay-backdrop ${isVisible ? "project-overlay-backdrop--visible" : ""}`}
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={project?.meta.title ?? i18n.common.projectDetails}
    >
      <div
        className={`project-overlay-panel ${isVisible ? "project-overlay-panel--visible" : ""}`}
      >
        {/* Hero image — full bleed, no border, no padding */}
        <div className="project-overlay-hero">
          {project?.meta.cover ? (
            <SmoothImage
              src={project.meta.cover}
              alt={project?.meta.title ?? ""}
              fill
              className="project-overlay-hero-img"
              sizes="(max-width: 640px) 100vw, 860px"
              priority
              showSkeleton
              blurDataURL={
                (blurMap as Record<string, string>)[project.meta.cover]
              }
            />
          ) : (
            <div className="project-overlay-hero-placeholder">
              <span>{project?.meta.title}</span>
            </div>
          )}

          {/* Gradient fade at bottom of image into content area */}
          <div className="project-overlay-hero-fade" />

          {/* Floating close button on top of image */}
          <button
            onClick={handleClose}
            className="project-overlay-close"
            aria-label={i18n.common.closeOverlay}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>

          {/* Title floated on top of hero gradient */}
          <div className="project-overlay-hero-title-bar">
            <h2 className="project-overlay-hero-title">
              {project?.meta.title}
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
          {project?.meta.description && (
            <p className="project-overlay-description">
              {project.meta.description}
            </p>
          )}

          <div className="project-overlay-info-grid">
            {features.length > 0 && (
              <div className="project-overlay-section">
                <h3 className="project-overlay-section-title">
                  {i18n.overlay.features}
                </h3>
                <ul className="project-overlay-features">
                  {features.map((feat, i) => {
                    const clean = feat.replace(/\*\*/g, "");
                    return (
                      <li key={i} className="project-overlay-feature-item">
                        <span className="project-overlay-feature-bullet">
                          ›
                        </span>
                        {clean}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {techStack.length > 0 && (
              <div className="project-overlay-section">
                <h3 className="project-overlay-section-title">
                  {i18n.overlay.techStack}
                </h3>
                <div className="project-overlay-tags">
                  {techStack.map((tech, i) => {
                    const boldMatch = tech.match(/\*\*(.+?)\*\*/);
                    const label = boldMatch
                      ? boldMatch[1]
                      : tech.split("—")[0].split("–")[0].trim();
                    return (
                      <span key={i} className="project-overlay-tag">
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
