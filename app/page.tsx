import { FadeIn, StaggerContainer, StaggerItem } from "@/components/fade-in";
import { ProjectCarousel } from "@/components/project-carousel";
import { SocialLinks } from "@/components/social-links";
import { ViewMore } from "@/components/view-more";
import { siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { getAllProjects, getAllWorkItems } from "@/lib/md";
import { buildPersonSchema } from "@/lib/structured-data";
import { safeJsonLd } from "@/lib/utils";
import { PfpSpin } from "@/components/pfp-spin";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

const CalBooking = dynamic(() =>
  import("@/components/cal-booking").then((m) => m.CalBooking)
);

export default function Home() {
  const workItems = getAllWorkItems();
  const projects = getAllProjects();

  return (
    <div className="space-y-10 pb-12">
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
        <FadeIn priority>
          <PfpSpin>
          <div className="pfp-flip-card mb-2">
            <div className="pfp-flip-card-inner">
              <div className="pfp-flip-card-front">
                <Image
                  src={siteConfig.images.avatar}
                  alt={i18n.home.hero.avatarAlt}
                  width={140}
                  height={140}
                  className="pfp-image-flip"
                  priority
                />
              </div>
              <div className="pfp-flip-card-back">
                <Image
                  src={siteConfig.images.avatarHover}
                  alt={i18n.home.hero.avatarHoverAlt}
                  width={140}
                  height={140}
                  className="pfp-image-flip"
                />
              </div>
            </div>
          </div>
          </PfpSpin>
        </FadeIn>
        <div>
          <FadeIn delay={0.1} priority>
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
          </FadeIn>
          <FadeIn delay={0.15} priority>
            <p className="text-muted-foreground mb-4 text-sm leading-relaxed lowercase">
              {i18n.home.hero.tagline}
            </p>
          </FadeIn>
          {i18n.home.hero.paragraphs.map((paragraph, index) => (
            <FadeIn key={paragraph} delay={0.2 + index * 0.05} priority>
              <p
                className={`text-muted-foreground text-sm leading-relaxed lowercase ${
                  index > 0 ? "mt-4" : ""
                }`}
              >
                {paragraph}
              </p>
            </FadeIn>
          ))}
          <FadeIn delay={0.35} priority>
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
          </FadeIn>
        </div>
      </section>

      {/* Social Links */}
      <FadeIn delay={0.35} priority>
        <SocialLinks />
      </FadeIn>

      <hr className="border-border" />

      {/* Experience */}
      <section>
        <FadeIn>
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
        </FadeIn>
        <StaggerContainer className="space-y-5" staggerDelay={0.1}>
          {workItems.map((item, i) => (
            <StaggerItem key={item.meta.slug}>
              {item.meta.link ? (
                <a
                  href={item.meta.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3"
                >
                  <WorkCard item={item} />
                </a>
              ) : (
                <Link
                  href={`/work/${item.meta.slug}`}
                  className="group flex items-center gap-3"
                >
                  <WorkCard item={item} />
                </Link>
              )}
              {i < workItems.length - 1 && (
                <hr className="border-border mt-5" />
              )}
            </StaggerItem>
          ))}
        </StaggerContainer>
        <div className="mt-6">
          <hr className="border-border" />
          <ViewMore href="/work/others" />
          <hr className="border-border" />
        </div>
      </section>

      {/* Projects */}
      <section>
        <FadeIn>
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
        </FadeIn>
        <FadeIn delay={0.1}>
          <ProjectCarousel items={projects} />
        </FadeIn>
      </section>

      <hr className="border-border" />

      {/* Contact */}
      <FadeIn>
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
      </FadeIn>
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
        <Image
          src={item.meta.cover}
          alt={item.meta.title}
          width={60}
          height={60}
          className="shrink-0 rounded-md object-cover"
        />
      )}
      <div className="flex-1">
        <p className="text-sm font-medium group-hover:underline">
          {item.meta.title}
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs">{item.meta.date}</p>
      </div>
    </>
  );
}
