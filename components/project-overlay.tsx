"use client";

import { useEffect, useRef, useState, useCallback } from "react";

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
  return match[1]
    .split("\n")
    .filter((line) => line.trim().startsWith("-"))
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean);
}

export default function ProjectOverlay({
  project,
  onClose,
}: ProjectOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (project) {
      // Tiny delay so the mount animation can play
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
    if (project) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
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
      aria-label={project?.meta.title ?? "Project details"}
    >
      <div
        className={`project-overlay-panel ${isVisible ? "project-overlay-panel--visible" : ""}`}
      >
        {/* Header bar */}
        <div className="project-overlay-header">
          <span className="project-overlay-title">
            {project?.meta.title}
          </span>
          <button
            onClick={handleClose}
            className="project-overlay-close"
            aria-label="Close overlay"
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
        </div>

        {/* Body */}
        <div className="project-overlay-body">
          {/* Image side — uses plain <img> so the browser respects natural dimensions */}
          <div className="project-overlay-image-wrapper">
            {project?.meta.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.meta.cover}
                alt={project.meta.title}
                className="project-overlay-image"
              />
            ) : (
              <div className="project-overlay-image-placeholder">
                <span>{project?.meta.title}</span>
              </div>
            )}
          </div>

          {/* Details side */}
          <div className="project-overlay-details">
            {project?.meta.description && (
              <p className="project-overlay-description">
                {project.meta.description}
              </p>
            )}

            {techStack.length > 0 && (
              <div className="project-overlay-section">
                <h3 className="project-overlay-section-title">Tech Stack</h3>
                <div className="project-overlay-tags">
                  {techStack.map((tech, i) => {
                    // Extract bold text or use part before dash
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

            {features.length > 0 && (
              <div className="project-overlay-section">
                <h3 className="project-overlay-section-title">Features</h3>
                <ul className="project-overlay-features">
                  {features.map((feat, i) => {
                    // Strip markdown bold markers
                    const clean = feat.replace(/\*\*/g, "");
                    return (
                      <li key={i} className="project-overlay-feature-item">
                        <span className="project-overlay-feature-bullet">›</span>
                        {clean}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer with link button */}
        {projectLink && (
          <div className="project-overlay-footer">
            <a
              href={projectLink}
              target="_blank"
              rel="noopener noreferrer"
              className="project-overlay-link-btn"
            >
              <span>Learn more</span>
              {/* Tilted external-link arrow — signals redirect to another site */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
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
          </div>
        )}
      </div>
    </div>
  );
}
