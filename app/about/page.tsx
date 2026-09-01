import { InformationPage } from "@/components/information-page";
import { aboutPage } from "@/lib/public-page-content";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: aboutPage.description,
  alternates: {
    canonical: "/about",
    types: { "text/markdown": "/about.md" },
  },
};

export default function AboutPage() {
  return (
    <>
      <InformationPage page={aboutPage} />
      <section
        aria-labelledby="verify-profile"
        className="mx-auto -mt-4 max-w-2xl pb-12"
      >
        <h2
          id="verify-profile"
          className="mb-3 text-xl font-semibold tracking-tight"
        >
          Verify this profile
        </h2>
        <p className="text-body-foreground mb-3 text-sm leading-relaxed">
          The credentials page separates publisher and institution records from
          self-reported résumé claims, with a clear limitation for every source.
        </p>
        <ul className="divide-border divide-y text-sm">
          {[
            ["Credentials and verification", "/credentials"],
            ["Professional résumé", "/resume"],
            ["Work samples and case studies", "/work"],
            [
              "Public source code",
              "https://github.com/Swpn0neel/swapnoneel-site",
            ],
          ].map(([label, href]) => (
            <li key={href}>
              <Link
                href={href}
                className="text-body-foreground hover:text-foreground flex items-center justify-between gap-4 py-3 transition-colors"
              >
                <span>{label}</span>
                <span aria-hidden="true">↗</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
