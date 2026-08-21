export type NavItemKey = "home" | "blog" | "work" | "contact" | "resume";

export type FooterLinkKey = "source" | "resume" | "site" | "llms";

export type SocialBrand =
  | "github"
  | "linkedin"
  | "x"
  | "reddit"
  | "dailydev"
  | "peerlist"
  | "leetcode"
  | "instagram"
  | "hashnode"
  | "devdotto"
  | "medium"
  | "substack"
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
      "Software Engineer based in India, with extensive experience in building scalable and maintainable software systems. Open to freelancing and full-time opportunities.",
  },
  images: {
    avatar: "/img/pfp-dark.webp",
    avatarHover: "/img/pfp-light.webp",
    // 96px, not the 2010px pfp-circle.webp this used to point at. The favicon
    // is fetched on every page, and at full size it was 130 KB — the single
    // largest resource on the site, larger than the compiled JS bundle, for
    // something that renders into a 16px tab strip.
    icon: "/img/pfp-icon-96.webp",
  },
  calendar: {
    namespaceDark: "dark-booking",
    namespaceLight: "light-booking",
    link: "swapnoneel/30min",
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
  { href: "/resume", key: "resume" },
  { href: siteConfig.repository.sourceUrl, key: "source" },
  { href: "/llms.txt", key: "llms" },
];

export const socialLinks: readonly SocialLink[] = [
  { name: "github", brand: "github", url: "https://github.com/Swpn0neel" },
  {
    name: "linkedin",
    brand: "linkedin",
    url: "https://www.linkedin.com/in/swapnoneel-saha-14a3161b6/",
  },
  { name: "x", brand: "x", url: "https://x.com/swapnoneel123" },
  // {
  //   name: "reddit",
  //   brand: "reddit",
  //   url: "https://www.reddit.com/user/swapnoneel123/",
  // },
  // {
  //   name: "peerlist",
  //   brand: "peerlist",
  //   url: "https://peerlist.io/swapnoneel",
  // },
  { name: "dev.to", brand: "devdotto", url: "https://dev.to/swapnoneel123" },
  {
    name: "medium",
    brand: "medium",
    url: "https://medium.com/@swapnoneel",
  },
  {
    name: "hashnode",
    brand: "hashnode",
    url: "https://swapnoneel.hashnode.dev",
  },
  {
    name: "daily.dev",
    brand: "dailydev",
    url: "https://daily.dev/swapnoneel",
  },
  {
    name: "substack",
    brand: "substack",
    url: "https://substack.com/@swapnoneel123",
  },
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
    name: "letterboxd",
    brand: "letterboxd",
    url: "https://letterboxd.com/Swapnoneel/",
  },
  {
    name: "discord",
    brand: "discord",
    url: "https://discord.com/users/729954975735873537",
  },
  // { name: "telegram", brand: "telegram", url: "https://t.me/swapnoneel123" },
];

export const skills = {
  languages: [
    "TypeScript",
    "JavaScript",
    "Python",
    "GoLang",
    "Java",
    "SQL",
    "C/C++",
  ],
  frameworks: [
    "Next.js",
    "Django",
    "Node.js",
    "Flask",
    "Socket.io",
    "Prisma",
    "Tailwind CSS",
  ],
  tools: [
    "Docker",
    "MongoDB",
    "PostgreSQL",
    "Git",
    "RAG (AI)",
    "API Design",
    "UI/UX (Figma)",
  ],
} as const;

// The résumé's project section, in the order it should read — a deliberate
// pitch, not a feed. It is kept apart from the `featured` frontmatter flag,
// which drives the home page showcase: that one tracks what is newest and
// most interesting, and letting it decide the résumé silently changed which
// projects a recruiter sees the moment a flag moved.
export const resumeProjectSlugs: readonly string[] = [
  "scholarian",
  "mesh-hop",
  "term-chat",
  "folio",
];
