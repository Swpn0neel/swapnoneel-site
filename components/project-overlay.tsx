"use client";

import { i18n } from "@/lib/i18n";
import paletteMap from "@/lib/palette-map.json";
import type { ProjectOverlayData } from "@/lib/project-overlay-data";
import { firstLink } from "@/lib/utils";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ProjectWindow } from "./project-window";

const palettes = paletteMap as Record<string, { h1: number; h2: number }>;

export type { ProjectOverlayData } from "@/lib/project-overlay-data";

interface ProjectOverlayProps {
  project: ProjectOverlayData | null;
  onClose: () => void;
}

export function ProjectOverlay({ project, onClose }: ProjectOverlayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

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

  useEffect(() => {
    if (!project) {
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
      return;
    }

    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      returnFocusRef.current = activeElement;
    }

    const frame = requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => cancelAnimationFrame(frame);
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

  // Keep keyboard focus inside the modal and close it on Escape.
  useEffect(() => {
    if (!project) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key !== "Tab" || !overlayRef.current) return;

      const focusable = Array.from(
        overlayRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose, project]);

  if (!project && !isClosing) return null;

  const techStack = project?.techStack ?? [];
  const features = project?.features ?? [];
  const projectLink = project ? firstLink(project.meta.link) : undefined;
  const palette = project?.meta.cover
    ? palettes[project.meta.cover]
    : undefined;

  return createPortal(
    <div
      id="project-overlay-dialog"
      ref={overlayRef}
      className={`project-overlay-backdrop ${isVisible ? "project-overlay-backdrop--visible" : ""}`}
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-overlay-title"
      aria-describedby={
        project?.meta.description ? "project-overlay-description" : undefined
      }
    >
      <div
        className={`project-overlay-panel ${isVisible ? "project-overlay-panel--visible" : ""}`}
      >
        {/* Hero — same gradient + framed window treatment as the card */}
        <div
          className={`project-overlay-hero ${
            project?.meta.cover ? "project-cover" : ""
          }`}
          style={
            project?.meta.cover
              ? ({
                  "--pc-h1": String(palette?.h1 ?? 220),
                  "--pc-h2": String(palette?.h2 ?? 200),
                } as CSSProperties)
              : undefined
          }
        >
          {project?.meta.cover ? (
            <ProjectWindow
              src={project.meta.cover}
              alt={project.meta.title}
              sizes="(max-width: 640px) 86vw, 654px"
              priority
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
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            className="project-overlay-close"
            aria-label={i18n.common.closeOverlay}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
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
            <h2
              id="project-overlay-title"
              className="project-overlay-hero-title"
            >
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
            <p
              id="project-overlay-description"
              className="project-overlay-description"
            >
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
    </div>,
    document.body
  );
}
