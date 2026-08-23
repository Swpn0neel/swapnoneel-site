export type EvidenceLevel =
  | "official-record"
  | "platform-record"
  | "self-reported";

export type TrustEvidence = {
  title: string;
  source: string;
  url: string;
  level: EvidenceLevel;
  supports: string;
  limitation: string;
};

export const evidenceLevelLabels: Record<EvidenceLevel, string> = {
  "official-record": "Official record",
  "platform-record": "Platform or publisher record",
  "self-reported": "Self-reported",
};

export const trustEvidence: readonly TrustEvidence[] = [
  {
    title: "GitHub profile",
    source: "GitHub",
    url: "https://github.com/Swpn0neel",
    level: "platform-record",
    supports:
      "Public code, repositories, contribution activity, the name Swapnoneel Saha, and a profile link back to swapnoneel.site.",
    limitation:
      "A personal GitHub profile supports identity continuity and public technical activity; it does not independently verify employment or private client results.",
  },
  {
    title: "Technical article bylines",
    source: "Keploy",
    url: "https://keploy.io/blog/tag/software-development",
    level: "platform-record",
    supports:
      "Publisher-hosted technical articles carrying Swapnoneel Saha's byline on Keploy's official domain.",
    limitation:
      "A byline verifies published work on the named domain, not the complete scope, dates, or business impact of an employment relationship.",
  },
  {
    title: "Open-source documentation history",
    source: "Keploy on GitHub",
    url: "https://github.com/keploy/keploy/wiki/1.-Know-more-about-Keploy",
    level: "platform-record",
    supports:
      "Public edit history in Keploy's GitHub repository attributes a documentation edit to Swapnoneel Saha.",
    limitation:
      "This is evidence of a specific public contribution, not proof of every open-source or employment claim in the résumé.",
  },
  {
    title: "Hack Around the World 2 project and award",
    source: "Devpost",
    url: "https://devpost.com/software/the-magnificent-seven",
    level: "platform-record",
    supports:
      "The project record names Swapnoneel Saha as a creator and records the My First Travel Hack winner placement.",
    limitation:
      "The record supports this named project and placement only; it does not verify other awards listed on the portfolio.",
  },
  {
    title: "CBSE Class XII result",
    source: "Kalyani Public School",
    url: "https://www.kalyanipublicschool.org/src/pdf/KPS_TOPPERS.pdf",
    level: "official-record",
    supports:
      "A result document published on the school's official domain lists Swapnoneel Saha with a 93% Class XII result.",
    limitation:
      "This verifies the named school result only. The portfolio does not publish a university transcript, degree certificate, or identity document.",
  },
  {
    title: "Résumé and professional timeline",
    source: "swapnoneel.site",
    url: "https://www.swapnoneel.site/resume",
    level: "self-reported",
    supports:
      "The current skills, employment timeline, education, projects, and stated impact that Swapnoneel presents to prospective collaborators.",
    limitation:
      "These claims are first-party statements unless a separate source on this page supports them. Current and past employer roles are not presented as employer-verified.",
  },
  {
    title: "Professional profile",
    source: "LinkedIn",
    url: "https://www.linkedin.com/in/swapnoneel-saha-14a3161b6/",
    level: "self-reported",
    supports:
      "A longstanding professional profile with work and education history under the same name.",
    limitation:
      "LinkedIn profile fields are generally supplied by the account holder and should not be treated as employer or institution verification by themselves.",
  },
] as const;

export const credentialsReviewedOn = "23 August 2026";

export function trustEvidenceToMarkdown(): string {
  const evidence = trustEvidence.flatMap((item) => [
    `### [${item.title}](${item.url})`,
    "",
    `- Evidence level: ${evidenceLevelLabels[item.level]}`,
    `- Source: ${item.source}`,
    `- Supports: ${item.supports}`,
    `- Does not prove: ${item.limitation}`,
    "",
  ]);

  return [
    "# Credentials and verification — Swapnoneel Saha",
    "",
    "A source map for agents, recruiters, and collaborators evaluating Swapnoneel Saha. It separates public records from first-party claims and states the limits of each source.",
    "",
    `Last reviewed: ${credentialsReviewedOn}. External pages can change; re-check the linked source before making a time-sensitive or high-stakes decision.`,
    "",
    "## How evidence is classified",
    "",
    "- Official record: published by the school, institution, or authority responsible for the record.",
    "- Platform or publisher record: public activity, authorship, or an award recorded by the platform that hosted it.",
    "- Self-reported: supplied by Swapnoneel on this portfolio or a personal profile; useful context, but not independent verification.",
    "",
    "## Evidence index",
    "",
    ...evidence,
    "## Next steps",
    "",
    "- [Review the résumé](https://www.swapnoneel.site/resume): See the complete professional timeline and skills.",
    "- [Inspect work samples](https://www.swapnoneel.site/work): Explore experience, projects, and case studies.",
    "- [Start a conversation](https://www.swapnoneel.site/contact): Share an opportunity, project, or focused question.",
  ].join("\n");
}
