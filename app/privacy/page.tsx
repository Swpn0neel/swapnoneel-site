import { InformationPage } from "@/components/information-page";
import { privacyPage } from "@/lib/public-page-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: privacyPage.description,
  alternates: {
    canonical: "/privacy",
    types: { "text/markdown": "/privacy.md" },
  },
};

export default function PrivacyPage() {
  return <InformationPage page={privacyPage} />;
}
