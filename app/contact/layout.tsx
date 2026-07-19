import { siteConfig } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import { ogImageUrl } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: i18n.contactPage.title,
  description: i18n.contactPage.intro,
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: `${i18n.contactPage.title} | ${siteConfig.person.fullName}`,
    description: i18n.contactPage.intro,
    url: "https://www.swapnoneel.site/contact",
    type: "website",
    images: [
      {
        url: ogImageUrl(i18n.contactPage.title, i18n.contactPage.intro),
        width: 1200,
        height: 630,
        alt: i18n.contactPage.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${i18n.contactPage.title} | ${siteConfig.person.fullName}`,
    description: i18n.contactPage.intro,
    images: [ogImageUrl(i18n.contactPage.title, i18n.contactPage.intro)],
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
