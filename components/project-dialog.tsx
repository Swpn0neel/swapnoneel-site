"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { i18n } from "@/lib/i18n";
import type { ProjectMeta } from "@/lib/project-overlay-data";
import { ProjectDetailContent } from "./project-detail-content";

interface ProjectDialogProps {
  project: ProjectMeta;
}

export function ProjectDialog({ project }: ProjectDialogProps) {
  const router = useRouter();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.push("/work");
      }
    }
  };

  return (
    <Dialog.Root open onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="project-overlay-backdrop project-overlay-backdrop--visible" />
        <Dialog.Content
          className="project-overlay-panel project-overlay-panel--visible"
          aria-describedby={
            project.description ? "project-overlay-description" : undefined
          }
        >
          <Dialog.Title className="sr-only">{project.title}</Dialog.Title>
          <ProjectDetailContent
            project={project}
            closeButton={
              <Dialog.Close
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
              </Dialog.Close>
            }
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
