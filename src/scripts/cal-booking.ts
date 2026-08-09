import EmbedSnippet from "@calcom/embed-snippet";
import { siteConfig } from "@/lib/config";
import { getRenderedTheme } from "@/lib/theme";

/**
 * Vanilla port of components/cal-booking.tsx.
 *
 * @calcom/embed-react was pulling React in for one button on two pages. Its
 * getCalApi() is a twelve-line wrapper around @calcom/embed-snippet — load the
 * script, call `init` for a namespace, then wait for `Cal.ns[namespace]` to
 * appear — so this is that, without the framework. embed-snippet was already
 * in the tree as embed-react's own dependency.
 */

type CalApi = ((action: string, options?: unknown) => void) & {
  ns: Record<string, (action: string, options?: unknown) => void>;
};

/** One promise per namespace, so the script and `ui` config are set up once. */
const apis = new Map<string, Promise<CalApi["ns"][string]>>();

function getCalApi(namespace: string): Promise<CalApi["ns"][string]> {
  return new Promise(function poll(resolve) {
    const Cal = EmbedSnippet() as unknown as CalApi;
    Cal("init", namespace);
    const api = namespace ? Cal.ns[namespace] : Cal;
    // `init` registers the namespace asynchronously; the upstream helper polls
    // for it the same way.
    if (!api) {
      setTimeout(() => poll(resolve), 50);
      return;
    }
    resolve(api);
  });
}

/**
 * Cal is themed per namespace, so light and dark get separate ones and the
 * visitor's current theme decides which is used. Reading the rendered theme
 * rather than a stored preference keeps it in step with what is on screen.
 */
function prepare(): Promise<CalApi["ns"][string]> {
  const isDark = getRenderedTheme() === "dark";
  const namespace = isDark
    ? siteConfig.calendar.namespaceDark
    : siteConfig.calendar.namespaceLight;

  const existing = apis.get(namespace);
  if (existing) return existing;

  const promise = getCalApi(namespace).then((cal) => {
    cal("ui", {
      theme: isDark ? "dark" : "light",
      cssVarsPerTheme: {
        light: { "cal-brand": isDark ? "#ffffff" : "#000000" },
        dark: { "cal-brand": isDark ? "#ffffff" : "#000000" },
      },
      hideEventTypeDetails: false,
      layout: "month_view",
    });
    return cal;
  });

  apis.set(namespace, promise);
  return promise;
}

export function initCalBooking(button: HTMLElement): void {
  // Warm the embed on intent rather than on load, so the script is usually
  // already there by the time the click lands.
  const warm = () => void prepare();
  button.addEventListener("pointerenter", warm);
  button.addEventListener("focus", warm);

  button.addEventListener("click", async () => {
    const cal = await prepare();
    cal("modal", {
      calLink: siteConfig.calendar.link,
      config: { layout: "month_view" },
    });
  });
}
