import { siteConfig, skills } from "@/lib/config";
import { i18n } from "@/lib/i18n";
import {
  getAllBlogPosts,
  getAllProjects,
  getAllWorkItems,
  getBlogPost,
  getProject,
  getWorkItem,
} from "@/lib/md";
import {
  aboutPage,
  developersPage,
  privacyPage,
  publicPageToMarkdown,
} from "@/lib/public-page-content";
import {
  absoluteSiteUrl,
  developerResources,
  markdownSitePages,
  type MarkdownPageKey,
} from "@/lib/site-manifest";
import { trustEvidenceToMarkdown } from "@/lib/trust-evidence";

const BASE_URL = "https://www.swapnoneel.site";

export type MarkdownRepresentation = {
  body: string;
  canonicalPath: string;
  status: 200 | 404;
};

function normalizePathname(pathname: string): string {
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  return pathname === "/" ? pathname : pathname.replace(/\/+$/, "");
}

function headingLink(title: string, path: string): string {
  return `- [${title}](${BASE_URL}${path})`;
}

function homeMarkdown(): string {
  const experience = getAllWorkItems()
    .slice(0, 6)
    .flatMap((item) => [
      `### ${item.meta.title}`,
      "",
      `${item.meta.date}${item.meta.description ? ` — ${item.meta.description}` : ""}`,
      "",
    ]);
  const projects = getAllProjects()
    .slice(0, 6)
    .map((item) =>
      headingLink(
        item.meta.title,
        `/projects/${encodeURIComponent(item.meta.slug)}`
      )
    );

  return [
    "# Swapnoneel Saha",
    "",
    siteConfig.metadata.description,
    "",
    "I am an AI engineer and developer advocate working on reliable agentic workflows, developer tools, high-performance web systems, open-source ecosystems, and technical content. I have built products and developer experiences used by thousands of people, and I work best where engineering depth and clear communication matter together.",
    "",
    "## Professional experience",
    "",
    ...experience,
    "## Selected projects",
    "",
    ...projects,
    "",
    "## Explore",
    "",
    headingLink("About", "/about"),
    headingLink("Work", "/work"),
    headingLink("Technical blog", "/blog"),
    headingLink("Developer resources", "/developers"),
    headingLink("Credentials and verification", "/credentials"),
    headingLink("Contact", "/contact"),
    headingLink("Privacy", "/privacy"),
    "",
    `Email: ${siteConfig.person.email}`,
  ].join("\n");
}

function workIndexMarkdown(): string {
  const entries = getAllWorkItems().flatMap((item) => [
    `### [${item.meta.title}](${BASE_URL}/work/${item.meta.slug})`,
    "",
    item.meta.date,
    "",
    ...(item.meta.description ? [item.meta.description, ""] : []),
  ]);

  return [
    "# Swapnoneel Saha — Work",
    "",
    "Professional experience, selected engineering work, and project case studies.",
    "",
    "## Experience",
    "",
    ...entries,
    "## Projects",
    "",
    ...getAllProjects().map((project) =>
      headingLink(
        project.meta.title,
        `/projects/${encodeURIComponent(project.meta.slug)}`
      )
    ),
  ].join("\n");
}

function blogIndexMarkdown(): string {
  return [
    "# Swapnoneel Saha — Technical blog",
    "",
    i18n.blog.description,
    "",
    ...getAllBlogPosts().flatMap((post) => [
      `## [${post.title}](${BASE_URL}/blog/${post.slug})`,
      "",
      `Published: ${post.publishedAt}${post.updatedAt ? `; updated: ${post.updatedAt}` : ""}`,
      "",
      ...(post.brief ? [post.brief, ""] : []),
    ]),
  ].join("\n");
}

function resumeMarkdown(): string {
  return [
    "# Swapnoneel Saha — Résumé",
    "",
    siteConfig.metadata.description,
    "",
    "## Skills",
    "",
    `- Languages: ${skills.languages.join(", ")}`,
    `- Frameworks: ${skills.frameworks.join(", ")}`,
    `- Tools and specialties: ${skills.tools.join(", ")}`,
    "",
    "## Experience",
    "",
    ...getAllWorkItems().flatMap((item) => [
      `### ${item.meta.title}`,
      "",
      item.meta.date,
      "",
      ...(item.meta.description ? [item.meta.description, ""] : []),
    ]),
    "## Contact",
    "",
    `${siteConfig.person.email} · ${BASE_URL}/contact`,
  ].join("\n");
}

function contactMarkdown(): string {
  return [
    "# Contact Swapnoneel Saha",
    "",
    i18n.contactPage.intro,
    "",
    `Email: ${siteConfig.person.email}`,
    "",
    "## Contact options",
    "",
    `- Contact form: ${BASE_URL}/contact`,
    `- Email: mailto:${siteConfig.person.email}`,
    `- Scheduling: ${BASE_URL}/contact#book-a-call`,
  ].join("\n");
}

function aboutMarkdown(): string {
  return [
    publicPageToMarkdown(aboutPage),
    "",
    "## Verify this profile",
    "",
    `- [Credentials and source limitations](${BASE_URL}/credentials)`,
    `- [Professional résumé](${BASE_URL}/resume)`,
    `- [Work samples and case studies](${BASE_URL}/work)`,
    "- [Public source code](https://github.com/Swpn0neel/swapnoneel-site)",
  ].join("\n");
}

function developersMarkdown(): string {
  return [
    publicPageToMarkdown(developersPage),
    "",
    "## Resource links",
    "",
    ...developerResources.map(
      (resource) =>
        `- [${resource.label}](${absoluteSiteUrl(resource.href)}) — ${resource.description}`
    ),
  ].join("\n");
}

function notFoundMarkdown(pathname: string): MarkdownRepresentation {
  const safePath = pathname.replaceAll("`", "");
  return {
    status: 404,
    canonicalPath: pathname,
    body: [
      "# 404 — Page not found",
      "",
      `Nothing exists at \`${safePath}\`. The link may be outdated or the address may be mistyped.`,
      "",
      "## Where to look next",
      "",
      `- [Site map](${BASE_URL}/sitemap.xml)`,
      `- [Agent summary](${BASE_URL}/llms.txt)`,
      `- [Full content index](${BASE_URL}/llms-full.txt)`,
      `- [Developer resources](${BASE_URL}/developers)`,
      `- [Home](${BASE_URL}/)`,
    ].join("\n"),
  };
}

export function getMarkdownRepresentation(
  rawPathname: string
): MarkdownRepresentation {
  const pathname = normalizePathname(rawPathname);

  const staticPageMarkdownHandlers: Record<MarkdownPageKey, () => string> = {
    home: homeMarkdown,
    about: aboutMarkdown,
    privacy: () => publicPageToMarkdown(privacyPage),
    developers: developersMarkdown,
    credentials: trustEvidenceToMarkdown,
    contact: contactMarkdown,
    resume: resumeMarkdown,
    work: workIndexMarkdown,
    blog: blogIndexMarkdown,
    otherWork: () =>
      [
        "# Swapnoneel Saha — Other experience",
        "",
        "Additional writing, design, community, and technical work. Return to the complete work index for current roles and project case studies.",
        "",
        headingLink("Work index", "/work"),
        headingLink("Contact", "/contact"),
      ].join("\n"),
  };

  const staticPage = markdownSitePages.find((page) => page.path === pathname);
  if (staticPage) {
    return {
      body: staticPageMarkdownHandlers[staticPage.key](),
      canonicalPath: pathname,
      status: 200,
    };
  }

  const [root, slug, extra] = pathname.slice(1).split("/");
  if (!slug || extra) return notFoundMarkdown(pathname);

  if (root === "blog") {
    const post = getBlogPost(slug);
    if (!post) return notFoundMarkdown(pathname);
    return {
      status: 200,
      canonicalPath: pathname,
      body: [
        `# ${post.title}`,
        "",
        `Published: ${post.publishedAt}${post.updatedAt ? `; updated: ${post.updatedAt}` : ""}`,
        ...(post.brief ? ["", post.brief] : []),
        "",
        post.content?.markdown ?? "",
      ].join("\n"),
    };
  }

  if (root === "work") {
    const item = getWorkItem(slug);
    if (!item) return notFoundMarkdown(pathname);
    return {
      status: 200,
      canonicalPath: pathname,
      body: [
        `# ${item.meta.title}`,
        "",
        item.meta.date,
        ...(item.meta.description ? ["", item.meta.description] : []),
        "",
        item.content,
      ].join("\n"),
    };
  }

  if (root === "projects") {
    const item = getProject(slug);
    if (!item) return notFoundMarkdown(pathname);
    return {
      status: 200,
      canonicalPath: pathname,
      body: [
        `# ${item.meta.title}`,
        "",
        item.meta.date,
        ...(item.meta.description ? ["", item.meta.description] : []),
        "",
        item.content,
      ].join("\n"),
    };
  }

  return notFoundMarkdown(pathname);
}
