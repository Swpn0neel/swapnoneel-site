export type NavItemKey = "home" | "blog" | "work" | "contact" | "resume";

export type FooterLinkKey = "rss" | "sitemap" | "github" | "resume";

export type SocialBrand =
  | "github"
  | "linkedin"
  | "x"
  | "leetcode"
  | "instagram"
  | "hashnode"
  | "devdotto"
  | "letterboxd"
  | "discord"
  | "telegram";

export interface NavItem {
  href: string;
  key: NavItemKey;
}

export interface FooterLink {
  href: string;
  key: FooterLinkKey;
}

export interface SocialLink {
  name: string;
  brand: SocialBrand;
  url: string;
}

export const siteConfig = {
  person: {
    shortName: "Swapnoneel",
    fullName: "Swapnoneel Saha",
    displayName: "swapnoneel saha",
    email: "swapnoneelsaha111@gmail.com",
  },
  metadata: {
    description:
      "Software Engineer based in India, with extensive experience in building scalable and maintainable software systems. Open to freelnacing and full-time opportunities.",
  },
  images: {
    avatar: "/img/pfp.jpg",
    avatarHover: "/img/pfp-hover.png",
    icon: "/img/pfp-circle.png",
  },
  calendar: {
    namespaceDark: "dark-booking",
    namespaceLight: "light-booking",
    link: "swapnoneel/30min",
  },
  hashnode: {
    host: "swapnoneel.hashnode.dev",
    graphQlEndpoint:
      process.env.HASHNODE_GQL_ENDPOINT || "https://gql.hashnode.com/",
    rssUrl: "https://swapnoneel.hashnode.dev/rss.xml",
  },
  repository: {
    sourceUrl: "https://github.com/Swpn0neel/swapnoneel-site",
  },
} as const;

export const navItems: readonly NavItem[] = [
  { href: "/", key: "home" },
  { href: "/work", key: "work" },
  { href: "/blog", key: "blog" },
  { href: "/contact", key: "contact" },
];

export const footerLinks: readonly FooterLink[] = [
  { href: siteConfig.hashnode.rssUrl, key: "rss" },
  { href: "/sitemap.xml", key: "sitemap" },
  { href: siteConfig.repository.sourceUrl, key: "github" },
  { href: "/resume", key: "resume" },
];

export const socialLinks: readonly SocialLink[] = [
  { name: "github", brand: "github", url: "https://github.com/Swpn0neel" },
  {
    name: "linkedin",
    brand: "linkedin",
    url: "https://www.linkedin.com/in/swapnoneel-saha-14a3161b6/",
  },
  { name: "x", brand: "x", url: "https://x.com/swapnoneel123" },
  {
    name: "leetcode",
    brand: "leetcode",
    url: "https://leetcode.com/u/Swapnoneel/",
  },
  {
    name: "instagram",
    brand: "instagram",
    url: "https://instagram.com/swapnoneel111",
  },
  {
    name: "hashnode",
    brand: "hashnode",
    url: "https://swapnoneel.hashnode.dev",
  },
  { name: "dev.to", brand: "devdotto", url: "https://dev.to/swapnoneel123" },
  {
    name: "letterboxd",
    brand: "letterboxd",
    url: "https://letterboxd.com/Swapnoneel/",
  },
  {
    name: "discord",
    brand: "discord",
    url: "https://discord.com/users/729954975735873537",
  },
  { name: "telegram", brand: "telegram", url: "https://t.me/swapnoneel123" },
];
