type OptionalIdleScheduler = {
  requestIdleCallback?: Window["requestIdleCallback"];
  cancelIdleCallback?: Window["cancelIdleCallback"];
};

/**
 * Keeps feature detection separate from the DOM-typed `window`. Modern DOM
 * declarations make requestIdleCallback required, so checking it directly
 * with `in` otherwise narrows the fallback branch to `never`.
 */
export function getOptionalIdleScheduler(): OptionalIdleScheduler {
  return window as unknown as OptionalIdleScheduler;
}
