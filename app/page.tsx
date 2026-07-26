import { ExperienceLogo } from "@/components/experience-logo";
import { PfpSpin } from "@/components/pfp-spin";
import { ProjectCarousel } from "@/components/project-carousel";
import { SocialLinks } from "@/components/social-links";
import { ViewMore } from "@/components/view-more";
import blurMap from "@/lib/blur-map.json";
import { siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { getAllProjects, getAllWorkItems } from "@/lib/md";
import { buildProjectOverlayData } from "@/lib/project-overlay-data";
import { buildPersonSchema } from "@/lib/structured-data";
import { firstLink, safeJsonLd } from "@/lib/utils";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

const CalBooking = dynamic(() =>
  import("@/components/cal-booking").then((m) => m.CalBooking)
);

export default function Home() {
  const workItems = getAllWorkItems();
  const projects = getAllProjects().map(buildProjectOverlayData);

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
                {/* Front face rests hidden: `.light .pfp-flip-card-inner` is
                    rotated 180deg and a brand-new visit always starts light,
                    so this one is only seen after a theme switch or a flip. */}
                <Image
                  src={siteConfig.images.avatar}
                  alt={i18n.home.hero.avatarAlt}
                  width={140}
                  height={140}
                  loading="lazy"
                  fetchPriority="low"
                  decoding="async"
                  placeholder="blur"
                  blurDataURL={blurMap[siteConfig.images.avatar]}
                  className="pfp-image-flip"
                />
              </div>
              <div className="pfp-flip-card-back">
                {/* Back face is what a first-time visitor actually sees (light
                    theme rests at 180deg), so this is the one worth loading
                    eagerly. fetchPriority stays low — the LCP element is the
                    bio paragraph, and this must not compete with the font. */}
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
          {i18n.home.hero.paragraphs.map((paragraph, index) => (
            <p
              key={paragraph}
              className={`text-muted-foreground text-sm leading-relaxed lowercase ${index > 0 ? "mt-4" : ""
                }`}
            >
              {paragraph}
            </p>
          ))}
          <p className="text-muted-foreground mt-4 text-sm leading-relaxed lowercase">
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
      <section className="deferred-render">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-muted-foreground text-sm font-semibold tracking-widest uppercase">
            {i18n.home.sections.experience}
          </h2>
          <Link
            href="/work"
            className="text-muted-foreground hover:text-foreground text-xs underline transition-colors"
          >
            {i18n.common.seeAll}
          </Link>
        </div>
        <div className="space-y-4 sm:space-y-3">
          {workItems.map((item, i) => (
            <div key={item.meta.slug}>
              {item.meta.link ? (
                <a
                  href={firstLink(item.meta.link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 sm:gap-3"
                >
                  <WorkCard item={item} />
                </a>
              ) : (
                <Link
                  href={`/work/${item.meta.slug}?from=home`}
                  prefetch={false}
                  className="group flex items-center gap-4 sm:gap-3"
                >
                  <WorkCard item={item} />
                </Link>
              )}
              {i < workItems.length - 1 && (
                <hr className="border-border mt-4 sm:mt-3" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 sm:mt-3">
          <hr className="border-border" />
          <ViewMore href="/work/others?from=home" />
          <hr className="border-border" />
        </div>
      </section>

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
        <ProjectCarousel items={projects} />
      </section>

      <hr className="border-border" />

      {/* Contact */}
      <section>
        <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-widest uppercase">
          {i18n.home.sections.contact}
        </h2>
        <p className="text-muted-foreground text-sm">
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

function WorkCard({
  item,
}: {
  item: { meta: { cover?: string; title: string; date: string } };
}) {
  return (
    <>
      {item.meta.cover && (
        <ExperienceLogo src={item.meta.cover} alt={item.meta.title} size={40} />
      )}
      <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-medium group-hover:underline">
          {item.meta.title}
        </p>
        <p className="text-muted-foreground text-xs mt-0.5 md:mt-0 whitespace-nowrap">
          {item.meta.date}
        </p>
      </div>
    </>
  );
}
