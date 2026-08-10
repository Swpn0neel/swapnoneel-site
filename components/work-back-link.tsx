import { BackLink } from "@/components/back-link";
import { WorkBackLinkPicker } from "@/components/work-back-link-picker";
import { i18n } from "@/lib/i18n";
import { Suspense } from "react";

// /work/[slug] and /work/others are prerendered, so the return destination is
// not knowable on the server. The picker resolves it from ?from= on the client;
// Suspense is what keeps the route static, and its fallback is the /work link —
// already correct for every entry point except the home page.
export function WorkBackLink() {
  const workLabel = i18n.work.otherExperience.backLink;

  return (
    <Suspense fallback={<BackLink href="/work" label={workLabel} />}>
      <WorkBackLinkPicker workLabel={workLabel} />
    </Suspense>
  );
}
