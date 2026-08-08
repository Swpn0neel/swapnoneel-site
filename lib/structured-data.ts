import { siteConfig, skills, socialLinks } from "@/lib/config";
import { i18n } from "@/lib/i18n";

// Single source of truth for the Person entity used in JSON-LD across the
// site (root layout's sitewide Person, homepage's ProfilePage mainEntity),
// so the two never drift out of sync with each other or with the real
// skills/education data shown elsewhere on the site.
/**
 * `imageUrl` is passed in because the avatar is no longer at a stable public
 * path: it moved into src/assets so Astro can optimise it, and the emitted file
 * carries a content hash. The caller resolves the asset and hands over an
 * absolute URL. The old literal is kept as the fallback so a caller that has no
 * asset to hand still produces a schema with a plausible image.
 */
export function buildPersonSchema(imageUrl?: string) {
  return {
    "@type": "Person",
    name: siteConfig.person.fullName,
    url: "https://www.swapnoneel.site",
    image: imageUrl ?? `https://www.swapnoneel.site${siteConfig.images.avatar}`,
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
