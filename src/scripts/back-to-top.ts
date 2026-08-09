import { NARRATION_VIEWPORT_OVERRIDE_EVENT } from "@/lib/narration-events";

// Stay hidden until the reader has scrolled meaningfully away from the top.
// Crossing this line on the way down fades the button in; coming back up past
// it fades it out again.
const SHOW_THRESHOLD = 400;

export function initBackToTop(button: HTMLButtonElement): void {
  let visible = false;
  let blocked = false;

  const render = () => {
    const hidden = !visible || blocked;
    button.dataset.hidden = String(hidden);
    // pointer-events:none only takes the button away from the mouse. Faded out
    // it was still a tab stop and still in the accessibility tree, so a
    // keyboard user tabbing the page landed on an invisible 48px control and a
    // screen reader announced a button that is not on screen. `inert` removes
    // it from both until it is actually shown.
    button.toggleAttribute("inert", hidden);
  };

  const onScroll = () => {
    const next = window.scrollY > SHOW_THRESHOLD;
    if (next === visible) return;
    visible = next;
    render();
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // The mobile menu locks body scroll while open; the button would otherwise
  // float over the panel.
  const observer = new MutationObserver(() => {
    const next = document.body.style.overflow === "hidden";
    if (next === blocked) return;
    blocked = next;
    render();
  });
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["style"],
  });

  button.addEventListener("click", () => {
    // Narration normally keeps the current word in view. Treat this explicit
    // navigation action like a manual scroll so that auto-follow does not
    // immediately pull the reader back during the smooth scroll.
    window.dispatchEvent(new Event(NARRATION_VIEWPORT_OVERRIDE_EVENT));
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  render();
}
