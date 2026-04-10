import CalBooking from "@/components/cal-booking";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/fade-in";
import ProjectCarousel from "@/components/project-carousel";
import SocialLinks from "@/components/social-links";
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
                  src="/img/pfp.jpg"
                  alt="Swapnoneel Saha"
                  width={140}
                  height={140}
                  className="pfp-image-flip"
                  priority
                />
              </div>
              <div className="pfp-flip-card-back">
                <Image
                  src="/img/pfp-hover.png"
                  alt="Swapnoneel Saha Hover"
                  width={140}
                  height={140}
                  className="pfp-image-flip"
                />
              </div>
            </div>
          </div>
        </FadeIn>
        <div>
          <FadeIn delay={0.1}>
            <h1 className="mb-3 text-2xl font-semibold tracking-tight">
              swapnoneel saha
            </h1>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p className="text-muted-foreground text-sm leading-relaxed lowercase">
              I am a software engineer and full-stack developer specializing in
              the architecture of developer-centric tools, high-performance web
              applications, and automation systems. My work is defined by a
              focus on reducing technical complexity through better engineering,
              cleaner interfaces, and intuitive user experiences.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-muted-foreground mt-4 text-sm leading-relaxed lowercase">
              I&apos;ve spent the past few years building products that can
              scale and perform well, ranging from developer-facing
              infrastructure to educational platforms that help thousands of
              engineers worldwide. This has allowed me to bridge the gap between
              back-end technical rigor and front-end usability, with deep
              expertise in python, typescript, and ui/ux design.
            </p>
          </FadeIn>
          <FadeIn delay={0.25}>
            <p className="text-muted-foreground mt-4 text-sm leading-relaxed lowercase">
              Currently, I am deep in the development of agentic AI systems,
              crafting intelligent agents that automate complex, multi-step
              engineering workflows. I thrive on solving the unsolved problems,
              whether that involves architecting a scalable backend or designing
              a seamless interaction layer for a new tool.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <p className="text-muted-foreground mt-4 text-sm leading-relaxed lowercase">
              Reach me at{" "}
              <a
                href="mailto:swapnoneelsaha111@gmail.com"
                className="text-foreground underline transition-opacity hover:opacity-70"
              >
                swapnoneelsaha111@gmail.com
              </a>{" "}
              :)
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
              Experience
            </h2>
            <Link
              href="/work"
              className="text-muted-foreground hover:text-foreground text-xs underline transition-colors"
            >
              See all
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
              <span className="group-hover/more:underline">View More</span>
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
              Projects
            </h2>
            <Link
              href="/work"
              className="text-muted-foreground hover:text-foreground text-xs underline transition-colors"
            >
              See all
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
            Contact
          </h2>
          <p className="text-muted-foreground text-sm">
            Shoot me a{" "}
            <Link href="/contact" className="text-foreground underline">
              message
            </Link>{" "}
            or you can also directly{" "}
            <CalBooking
              customText="book a call"
              className="text-foreground cursor-pointer underline"
            />{" "}
            with me.
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
