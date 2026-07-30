import { ExperienceSection } from "@/components/experience-section";
import { PfpSpin } from "@/components/pfp-spin";
import { ProjectShowcase } from "@/components/project-showcase";
import { SocialLinks } from "@/components/social-links";
import blurMap from "@/lib/blur-map.json";
import { siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { getAllWorkItems, getFeaturedProjects } from "@/lib/md";
import { buildProjectOverlayData } from "@/lib/project-overlay-data";
import { buildPersonSchema } from "@/lib/structured-data";
import { safeJsonLd } from "@/lib/utils";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

const CalBooking = dynamic(() =>
  import("@/components/cal-booking").then((m) => m.CalBooking)
);

export default function Home() {
  const workItems = getAllWorkItems();
  const projects = getFeaturedProjects().map(buildProjectOverlayData);

  return (
    <div className="space-y-7 pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            mainEntity: buildPersonSchema(),
          }),
        }}
      />
      {/* Hero */}
      <section className="flex flex-col gap-5">
        <PfpSpin>
          <div className="pfp-flip-card mb-2">
            <div className="pfp-flip-card-inner">
              <div className="pfp-flip-card-front">
                {/* Front face is the resting face in dark theme. Which of the
                    two faces a visitor sees first now depends on their OS
                    setting, so both load eagerly — this one used to be lazy on
                    the assumption that a first visit was always light, which
                    left dark-theme visitors watching the hero pop in.
                    fetchPriority stays low: the LCP element is the bio
                    paragraph, and neither face may compete with the font. */}
                <Image
                  src={siteConfig.images.avatar}
                  alt={i18n.home.hero.avatarAlt}
                  width={140}
                  height={140}
                  loading="eager"
                  fetchPriority="low"
                  decoding="async"
                  placeholder="blur"
                  blurDataURL={blurMap[siteConfig.images.avatar]}
                  className="pfp-image-flip"
                />
              </div>
              <div className="pfp-flip-card-back">
                {/* Back face is the resting face in light theme. See the note
                    on the front face for why both load eagerly. */}
                <Image
                  src={siteConfig.images.avatarHover}
                  alt={i18n.home.hero.avatarHoverAlt}
                  width={140}
                  height={140}
                  loading="eager"
                  fetchPriority="low"
                  decoding="async"
                  placeholder="blur"
                  blurDataURL={blurMap[siteConfig.images.avatarHover]}
                  className="pfp-image-flip"
                />
              </div>
            </div>
          </div>
        </PfpSpin>
        <div>
          <h1 className="mb-3 flex flex-wrap items-baseline gap-2 text-2xl font-semibold tracking-tight">
            <span>{siteConfig.person.displayName}</span>
            {/* <a
              href="https://hire-swapnoneel.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hire-me-link text-sm font-bold tracking-normal"
            >
              (hire_me↗)
            </a> */}
          </h1>
          <p className="text-muted-foreground mb-4 text-sm leading-relaxed lowercase">
            {i18n.home.hero.tagline}
          </p>
          {/* The bio is the page's subject, not supporting text, so it reads at
              body strength while the tagline above it — a subtitle — keeps the
              muted tone. Same reasoning as .prose p in globals.css. */}
          {i18n.home.hero.paragraphs.map((paragraph, index) => (
            <p
              key={paragraph}
              className={`text-body-foreground text-sm leading-relaxed lowercase ${
                index > 0 ? "mt-4" : ""
              }`}
            >
              {paragraph}
            </p>
          ))}
          <p className="text-body-foreground mt-4 text-sm leading-relaxed lowercase">
            {i18n.home.hero.reachMeLabel}{" "}
            <a
              href={`mailto:${siteConfig.person.email}`}
              className="text-foreground underline transition-opacity hover:opacity-70"
            >
              {siteConfig.person.email}
            </a>{" "}
            {i18n.home.hero.reachMeSuffix}
          </p>
        </div>
      </section>

      {/* Social Links */}
      <SocialLinks />

      <hr className="border-border" />

      {/* Experience */}
      <ExperienceSection
        items={workItems}
        seeAllHref="/work"
        from="home"
        className="deferred-render"
      />

      {/* Projects */}
      <section className="deferred-render">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
            {i18n.home.sections.projects}
          </h2>
          <Link
            href="/work"
            className="text-muted-foreground hover:text-foreground text-xs underline transition-colors"
          >
            {i18n.common.seeAll}
          </Link>
        </div>
        <ProjectShowcase items={projects} />
      </section>

      <hr className="border-border" />

      {/* Contact */}
      <section>
        <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-widest uppercase">
          {i18n.home.sections.contact}
        </h2>
        <p className="text-body-foreground text-sm">
          {i18n.home.contact.intro}{" "}
          <Link href="/contact" className="text-foreground underline">
            {i18n.home.contact.messageLink}
          </Link>{" "}
          {i18n.home.contact.middle}{" "}
          <CalBooking
            customText={i18n.home.contact.bookCall}
            className="text-foreground cursor-pointer underline"
          />{" "}
          {i18n.home.contact.outro}
        </p>
      </section>
    </div>
  );
}
