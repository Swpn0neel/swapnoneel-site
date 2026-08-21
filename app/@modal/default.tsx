// Renders for every route that is not an intercepted /work/[slug]. Required:
// without it, a hard navigation to any other route has no value for this slot
// and Next 404s the whole page.
export default function Default() {
  return null;
}
