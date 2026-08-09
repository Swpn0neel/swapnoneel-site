"use client";

import { useEffect } from "react";

type Status = "idle" | "copied" | "error";

const LABEL: Record<Status, string> = {
  idle: "Copy code block",
  copied: "Copied",
  error: "Copy failed",
};

/**
 * `navigator.clipboard` only exists on secure origins, so it is undefined when
 * the site is opened over plain http — previewing from a phone on the LAN, for
 * instance. Falling back to execCommand keeps the button working there instead
 * of failing silently.
 */
async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const staging = document.createElement("textarea");
  staging.value = text;
  staging.readOnly = true;
  staging.style.cssText = "position:fixed;top:0;left:0;opacity:0";
  document.body.appendChild(staging);
  staging.select();
  const copied = document.execCommand("copy");
  staging.remove();
  if (!copied) throw new Error("execCommand('copy') was rejected");
}

function setStatus(button: HTMLButtonElement, status: Status) {
  button.dataset.copyStatus = status;
  button.setAttribute("aria-label", LABEL[status]);
  button.title = LABEL[status];
  const announcement = button.querySelector<HTMLElement>(
    "[data-copy-announcement]"
  );
  if (announcement)
    announcement.textContent = status === "idle" ? "" : LABEL[status];
}

export function CopyButtonListener({ articleId }: { articleId: string }) {
  useEffect(() => {
    const article = document.getElementById(articleId);
    if (!article) return;

    const resetTimers = new Map<HTMLButtonElement, number>();
    const settle = (button: HTMLButtonElement, status: Status) => {
      setStatus(button, status);
      const existing = resetTimers.get(button);
      if (existing !== undefined) window.clearTimeout(existing);
      resetTimers.set(
        button,
        window.setTimeout(() => {
          setStatus(button, "idle");
          resetTimers.delete(button);
        }, 2000)
      );
    };

    const handleClick = async (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>("[data-copy-button]");
      if (!button || !article.contains(button)) return;
      if (button.dataset.copyStatus === "copied") return;

      const code = button.closest<HTMLElement>(".code-block")?.dataset.code;
      if (code === undefined) return;

      try {
        await writeClipboard(code);
        settle(button, "copied");
      } catch (error) {
        console.error("Failed to copy code: ", error);
        settle(button, "error");
      }
    };

    article.addEventListener("click", handleClick);
    return () => {
      article.removeEventListener("click", handleClick);
      resetTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [articleId]);

  return null;
}
