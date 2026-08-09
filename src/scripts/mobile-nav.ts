import { claim } from "./page-lifecycle";

/**
 * Vanilla port of components/mobile-nav.tsx.
 *
 * The React version's prefetch juggling is gone with Next: the panel is hidden
 * with opacity rather than display:none, so it keeps a layout box inside the
 * viewport and Next's prefetch observer treated every link in it as visible —
 * ~150 KiB of RSC payloads on first paint. Plain <a> elements have no such
 * behaviour, so the workaround has nothing left to work around.
 */
export function initMobileNav(root: HTMLElement): void {
  // Persisted with the navbar — wire once. See src/layouts/Base.astro.
  if (!claim(root, "nav-wired")) return;

  const button = root.querySelector<HTMLButtonElement>("[data-menu-button]");
  const panel = root.querySelector<HTMLElement>("#mobile-menu");
  const overlay = root.querySelector<HTMLElement>("#mobile-menu-overlay");
  if (!button || !panel || !overlay) return;

  let open = false;
  let first: HTMLElement | null = null;
  let last: HTMLElement | null = null;

  const render = () => {
    button.setAttribute("aria-expanded", String(open));
    root.dataset.open = String(open);
    // The overlay only exists to catch outside clicks; it must not intercept
    // them while the panel is closed.
    overlay.hidden = !open;
    // Matches the React version: the panel keeps its layout box either way, so
    // pointer-events is what actually takes it out of play.
    document.body.style.overflow = open ? "hidden" : "";
  };

  const focusables = () =>
    Array.from(
      panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")
    );

  const setOpen = (next: boolean) => {
    if (open === next) return;
    open = next;
    render();

    if (!open) return;
    const items = focusables();
    if (items.length === 0) return;
    first = items[0];
    last = items[items.length - 1];
    first.focus();
  };

  button.addEventListener("click", () => setOpen(!open));
  overlay.addEventListener("click", () => setOpen(false));
  panel.addEventListener("click", (event) => {
    if ((event.target as HTMLElement).closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (!open) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      button.focus();
      return;
    }

    if (event.key !== "Tab") return;
    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
    } else if (document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });

  // Leaving the mobile breakpoint with the panel open would strand it on a
  // layout where the button that closes it is hidden.
  const desktop = window.matchMedia("(min-width: 768px)");
  desktop.addEventListener("change", (event) => {
    if (event.matches) setOpen(false);
  });
  if (desktop.matches) open = false;

  render();
}
