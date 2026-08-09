import { claim, once } from "./page-lifecycle";

/**
 * Vanilla port of components/project-overlay.tsx.
 *
 * The panel markup is pre-rendered into a <template> per project, so opening
 * one clones a subtree instead of building it. What is left here is the modal
 * behaviour the React version also had: the enter/leave transition, the body
 * scroll lock, the focus trap, Escape, and returning focus on close.
 *
 * Other components open it by dispatching `project-overlay:open` on the window
 * with the project's slug, and hear about state changes through
 * `project-overlay:change`. That keeps the carousel, the index and the grid
 * from needing a shared parent the way the React tree did.
 */

/** Matches the CSS leave transition on .project-overlay-panel. */
const CLOSE_DURATION_MS = 400;

export const OPEN_EVENT = "project-overlay:open";
export const CHANGE_EVENT = "project-overlay:change";

export function initProjectOverlay(dialog: HTMLElement): void {
  // The dialog markup is per-page, but its window listeners are not: bound
  // again on every navigation, one Escape would close it twice over.
  if (!claim(dialog, "overlay-wired")) return;

  let openSlug: string | null = null;
  let closeTimer: number | null = null;
  let returnFocus: HTMLElement | null = null;

  const announce = () => {
    window.dispatchEvent(
      new CustomEvent(CHANGE_EVENT, { detail: { slug: openSlug } })
    );
  };

  const focusable = () =>
    Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );

  function close() {
    if (!openSlug) return;

    dialog.classList.remove("project-overlay-backdrop--visible");
    dialog
      .querySelector(".project-overlay-panel")
      ?.classList.remove("project-overlay-panel--visible");

    openSlug = null;
    announce();

    if (closeTimer !== null) window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      closeTimer = null;
      dialog.hidden = true;
      dialog.replaceChildren();
      document.body.style.overflow = "";
      returnFocus?.focus();
      returnFocus = null;
    }, CLOSE_DURATION_MS);
  }

  function open(slug: string) {
    const template = document.querySelector<HTMLTemplateElement>(
      `template[data-project-panel="${CSS.escape(slug)}"]`
    );
    if (!template) return;

    if (closeTimer !== null) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }

    // Only remember where focus came from on a fresh open; switching straight
    // from one project to another must still return to the original trigger.
    if (!openSlug && document.activeElement instanceof HTMLElement) {
      returnFocus = document.activeElement;
    }

    dialog.replaceChildren(template.content.cloneNode(true));
    dialog.hidden = false;

    const description = dialog.querySelector("#project-overlay-description");
    if (description) {
      dialog.setAttribute("aria-describedby", "project-overlay-description");
    } else {
      dialog.removeAttribute("aria-describedby");
    }

    // Body scroll lock. No paddingRight compensation for the vanishing
    // scrollbar — `scrollbar-gutter: stable` on html holds that space open
    // through the lock, so padding here would shift the page by the
    // scrollbar's width rather than keep it still.
    document.body.style.overflow = "hidden";
    openSlug = slug;
    announce();

    // Focus moves now, not on a frame. The React version deferred this because
    // its portal had to mount first; here the panel is already in the document
    // the moment replaceChildren returns, so waiting would only widen the
    // window in which a keyboard user is focused on the page behind the modal.
    dialog.querySelector<HTMLButtonElement>("[data-overlay-close]")?.focus();

    // The reveal does still need a frame: the clone has to be laid out in its
    // start state before the class that transitions away from it lands, or
    // there is nothing to animate from.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (openSlug !== slug) return;
        dialog.classList.add("project-overlay-backdrop--visible");
        dialog
          .querySelector(".project-overlay-panel")
          ?.classList.add("project-overlay-panel--visible");
      });
    });
  }

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
    else if ((event.target as HTMLElement).closest("[data-overlay-close]"))
      close();
  });

  window.addEventListener("keydown", (event) => {
    if (!openSlug) return;

    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== "Tab") return;
    const items = focusable();
    if (items.length === 0) return;

    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener(OPEN_EVENT, (event) => {
    const slug = (event as CustomEvent<{ slug: string }>).detail?.slug;
    if (slug) open(slug);
  });
}

/** Wires every `[data-open-project]` trigger on the page to the overlay. */
export function bindOverlayTriggers(root: ParentNode = document): void {
  for (const trigger of root.querySelectorAll<HTMLElement>(
    "[data-open-project]"
  )) {
    trigger.addEventListener("click", () => {
      const slug = trigger.dataset.openProject;
      if (slug) {
        window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { slug } }));
      }
    });
  }

  // aria-expanded has to track the shared overlay, not each trigger's own
  // state — several triggers can point at the same project. Bound once: the
  // handler re-queries the DOM, so it keeps working for pages swapped in later.
  once("overlay-aria", () =>
    window.addEventListener(CHANGE_EVENT, (event) => {
      const open = (event as CustomEvent<{ slug: string | null }>).detail?.slug;
      for (const trigger of root.querySelectorAll<HTMLElement>(
        "[data-open-project]"
      )) {
        trigger.setAttribute(
          "aria-expanded",
          String(trigger.dataset.openProject === open)
        );
      }
    })
  );
}
