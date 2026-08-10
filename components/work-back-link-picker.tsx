"use client";

import { BackLink } from "@/components/back-link";
import { useSearchParams } from "next/navigation";

/**
 * Reads the `?from=` that ExperienceSection appends so the detail page knows
 * where the reader came from.
 *
 * This has to be `useSearchParams` rather than `location.search`: the router
 * navigates with `history.pushState`, and neither `:target` nor a plain
 * mount-time read of `location` is reliable under it — pushState does not
 * update the document's target element, and it lands after a child effect
 * runs. The hook is subscribed to the router's own URL state, so it is correct
 * on the soft navigation from the home page, on a hard load, and on back/forward.
 */
export function WorkBackLinkPicker({ workLabel }: { workLabel: string }) {
  return useSearchParams().get("from") === "home" ? (
    <BackLink href="/" label="home" />
  ) : (
    <BackLink href="/work" label={workLabel} />
  );
}
