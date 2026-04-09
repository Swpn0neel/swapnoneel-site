import Image from "next/image";
import Link from "next/link";
import SocialLinks from "@/components/social-links";
import { getAllWorkItems, getAllProjects } from "@/lib/md";
import ProjectCarousel from "@/components/project-carousel";
import CalBooking from "@/components/cal-booking";

export default function Home() {
  const workItems = getAllWorkItems();
  const projects = getAllProjects();

  return (
    <div className="space-y-10 pb-12">
      {/* Hero */}
      <section className="flex flex-col gap-5">
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
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-3">
            swapnoneel saha
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed lowercase">
            I am a software engineer and full-stack developer specializing in
            the architecture of developer-centric tools, high-performance web
            applications, and automation systems. My work is defined by a focus
            on reducing technical complexity through better engineering, cleaner
            interfaces, and intuitive user experiences.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed mt-4 lowercase">
            I&apos;ve spent the past few years building products that can scale and perform well, ranging from developer-facing infrastructure to educational
            platforms that help thousands of engineers worldwide. This has
            allowed me to bridge the gap between back-end technical rigor and
            front-end usability, with deep expertise in python, typescript, and ui/ux design.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed mt-4 lowercase">
            Currently, I am deep in the development of agentic AI systems,
            crafting intelligent agents that automate complex, multi-step
            engineering workflows. I thrive on solving the unsolved
            problems, whether that involves architecting a scalable backend or
            designing a seamless interaction layer for a new tool.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed mt-4 lowercase">
            Reach me at{" "}
            <a
              href="mailto:swapnoneelsaha111@gmail.com"
              className="underline text-foreground hover:opacity-70 transition-opacity"
            >
              swapnoneelsaha111@gmail.com
            </a>{" "}
            :)
          </p>
        </div>
      </section>

      {/* Social Links */}
      <SocialLinks />

      <hr className="border-border" />

      {/* Experience */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Experience
          </h2>
          <Link
            href="/work"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
          >
            See all
          </Link>
        </div>
        <div className="space-y-5">
          {workItems.map((item, i) => (
            <div key={item.meta.slug}>
              {item.meta.link ? (
                <a
                  href={item.meta.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 group"
                >
                  <WorkCard item={item} />
                </a>
              ) : (
                <Link
                  href={`/work/${item.meta.slug}`}
                  className="flex items-start gap-3 group"
                >
                  <WorkCard item={item} />
                </Link>
              )}
              {i < workItems.length - 1 && <hr className="border-border mt-5" />}
            </div>
          ))}
          <div className="mt-6">
            <hr className="border-border" />
            <div className="flex justify-end py-6">
              <Link
                href="/work/others"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group/more"
              >
                <span className="group-hover/more:underline">View More</span>
                <span className="text-[10px]">→</span>
              </Link>
            </div>
            <hr className="border-border" />
          </div>
        </div>


      </section>

      {/* Projects */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Projects
          </h2>
          <Link
            href="/work"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
          >
            See all
          </Link>
        </div>
        <ProjectCarousel items={projects} />
      </section>

      <hr className="border-border" />

      {/* Contact */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Contact
        </h2>
        <p className="text-sm text-muted-foreground">
          Shoot me a{" "}
          <Link
            href="/contact"
            className="underline text-foreground"
          >
            message
          </Link>{" "}
          or you can also directly{" "}
          <CalBooking
            customText="book a call"
            className="underline text-foreground cursor-pointer"
          />{" "}
          with me.
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
        <Image
          src={item.meta.cover}
          alt={item.meta.title}
          width={60}
          height={60}
          className="rounded-md object-cover flex-shrink-0 mt-0.5"
        />
      )}
      <div className="flex-1">
        <p className="text-sm font-medium group-hover:underline">
          {item.meta.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{item.meta.date}</p>
      </div>
    </>
  );
}

