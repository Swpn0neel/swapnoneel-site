/**
 * Lifecycle helpers for running behaviour under `<ClientRouter />`.
 *
 * With client-side routing the document is never replaced, so a component's
 * module script executes exactly once no matter how many times its markup is
 * swapped in. Two consequences, and one helper for each:
 *
 *  - Element-scoped setup has to run again after every swap, against the *new*
 *    nodes. `onPageLoad` handles that: `astro:page-load` fires once on the
 *    initial load and once after each navigation.
 *  - Anything bound to `window` or `document` must be bound exactly once for
 *    the life of the document, or every navigation adds another copy. `once`
 *    guards those.
 */

/** Runs on the first load and after every client-side navigation. */
export function onPageLoad(init: () => void): void {
  document.addEventListener("astro:page-load", init);
}

const claimed = new Set<string>();

/**
 * Runs `setup` the first time it is called for `key`, and never again.
 * For listeners on window/document, which outlive any single page.
 */
export function once(key: string, setup: () => void): void {
  if (claimed.has(key)) return;
  claimed.add(key);
  setup();
}

/**
 * True the first time this element is seen. Element-scoped setup is normally
 * safe to repeat — after a swap the nodes are new — but a persisted element
 * (`transition:persist`) survives, and would otherwise be wired twice.
 */
export function claim(el: Element, key = "wired"): boolean {
  const attr = `data-${key}`;
  if (el.hasAttribute(attr)) return false;
  el.setAttribute(attr, "");
  return true;
}
