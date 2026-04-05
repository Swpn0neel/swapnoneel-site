import Image from "next/image";
import Link from "next/link";
import SocialLinks from "@/components/social-links";
import { getAllWorkItems, getAllProjects } from "@/lib/md";
import CalBooking from "@/components/cal-booking";

export default function Home() {
  const workItems = getAllWorkItems();
  const projects = getAllProjects().slice(0, 3);

  return (
    <div className="space-y-10 pb-12">
      {/* Hero */}
      <section className="flex flex-col gap-5">
        <Image
          src="/img/pfp.png"
          alt="Swapnoneel Saha"
          width={72}
          height={72}
          className="rounded-full object-cover"
          priority
        />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-3">
            swapnoneel saha
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            CS undergrad at MAKAUT, based in West Bengal, India. Self-taught
            developer. Loves to build and write things.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed mt-2">
            I&apos;ve written technical content used by thousands of developers,
            built DevRel tooling at{" "}
            <a
              href="https://keploy.io"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-foreground hover:opacity-70 transition-opacity"
            >
              Keploy
            </a>
            , and created an Advanced Python course purchased by{" "}
            <strong>9800+ users</strong> on Tutorials Point.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed mt-2">
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
          {workItems.map((item) => (
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
              <hr className="border-border mt-5" />
            </div>
          ))}
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.meta.slug} item={p} />
          ))}
        </div>
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

      {/* Links */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Links
        </h2>
        <ul className="space-y-1 text-sm">
          {[
            { label: "GitHub", href: "https://github.com" },
            { label: "LinkedIn", href: "https://linkedin.com" },
            { label: "Tutorials Point Profile", href: "https://tutorialspoint.com" },
            { label: "Keploy Blog", href: "https://keploy.io/blog" },
          ].map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors underline"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
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

function ProjectCard({
  item,
}: {
  item: { meta: { slug: string; cover?: string; title: string; description?: string; link?: string } };
}) {
  const href = item.meta.link ?? `/work/${item.meta.slug}`;
  const isExternal = !!item.meta.link;

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group block rounded-lg overflow-hidden border border-border hover:border-foreground/30 transition-colors"
    >
      {item.meta.cover ? (
        <Image
          src={item.meta.cover}
          alt={item.meta.title}
          width={300}
          height={160}
          className="object-cover w-full h-36"
        />
      ) : (
        <div className="w-full h-36 bg-secondary flex items-center justify-center text-xs text-muted-foreground">
          {item.meta.title}
        </div>
      )}
      <div className="p-2">
        <p className="text-xs font-semibold">{item.meta.title}</p>
        {item.meta.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {item.meta.description}
          </p>
        )}
      </div>
    </a>
  );
}
