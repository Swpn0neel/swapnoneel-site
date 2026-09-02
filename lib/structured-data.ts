import { siteConfig, skills, socialLinks } from "@/lib/config";
import { i18n } from "@/lib/i18n";

// The one Person node in the site's JSON-LD. The root layout emits it on every
// page; anything else that needs the person (the home page's ProfilePage) points
// at it through PERSON_ID rather than embedding a second copy.
export const PERSON_ID = "https://www.swapnoneel.site/#person";

export function buildPersonSchema() {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: siteConfig.person.fullName,
    url: "https://www.swapnoneel.site",
    image: `https://www.swapnoneel.site${siteConfig.images.avatar}`,
    jobTitle: "Software Engineer",
    description: siteConfig.metadata.description,
    sameAs: socialLinks.map((link) => link.url),
    knowsAbout: [...skills.languages, ...skills.frameworks, ...skills.tools],
    alumniOf: i18n.resume.education.map((edu) => ({
      "@type": "EducationalOrganization",
      name: edu.school,
    })),
  };
}
