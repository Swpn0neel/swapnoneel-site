import CalBooking from "@/components/cal-booking";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/fade-in";
import ProjectCarousel from "@/components/project-carousel";
import SocialLinks from "@/components/social-links";
import { blurPlaceholder } from "@/lib/blur";
import { siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { getAllProjects, getAllWorkItems } from "@/lib/md";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const workItems = getAllWorkItems();
  const projects = getAllProjects();

  return (
    <div className="space-y-10 pb-12">
      {/* Hero */}
      <section className="flex flex-col gap-5">
        <FadeIn>
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
                  placeholder="blur"
                  blurDataURL={blurPlaceholder}
                />
              </div>
              <div className="pfp-flip-card-back">
                <Image
                  src={siteConfig.images.avatarHover}
                  alt={i18n.home.hero.avatarHoverAlt}
                  width={140}
                  height={140}
                  className="pfp-image-flip"
                  placeholder="blur"
                  blurDataURL={blurPlaceholder}
                />
              </div>
            </div>
          </div>
        </FadeIn>
        <div>
          <FadeIn delay={0.1}>
            <h1 className="mb-3 text-2xl font-semibold tracking-tight">
              {siteConfig.person.displayName}
            </h1>
          </FadeIn>
          {i18n.home.hero.paragraphs.map((paragraph, index) => (
            <FadeIn key={paragraph} delay={0.15 + index * 0.05}>
              <p
                className={`text-muted-foreground text-sm leading-relaxed lowercase ${
                  index > 0 ? "mt-4" : ""
                }`}
              >
                {paragraph}
              </p>
            </FadeIn>
          ))}
          <FadeIn delay={0.3}>
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
      <FadeIn delay={0.35}>
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
                  className="group flex items-start gap-3"
                >
                  <WorkCard item={item} />
                </a>
              ) : (
                <Link
                  href={`/work/${item.meta.slug}`}
                  className="group flex items-start gap-3"
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
          <div className="flex justify-end py-6">
            <Link
              href="/work/others"
              className="text-muted-foreground hover:text-foreground group/more flex items-center gap-1 text-xs transition-colors"
            >
              <span className="group-hover/more:underline">
                {i18n.common.viewMore}
              </span>
              <span className="text-[10px]">→</span>
            </Link>
          </div>
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
          className="mt-0.5 flex-shrink-0 rounded-md object-cover"
          placeholder="blur"
          blurDataURL={blurPlaceholder}
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
