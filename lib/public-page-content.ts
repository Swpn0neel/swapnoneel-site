export type PublicPageSection = {
  heading: string;
  paragraphs: readonly string[];
};

export type PublicPageContent = {
  title: string;
  description: string;
  intro: string;
  sections: readonly PublicPageSection[];
};

export const aboutPage: PublicPageContent = {
  title: "About Swapnoneel Saha",
  description:
    "Background, working style, and areas of focus for Swapnoneel Saha, a technical growth operator and GTM engineer based in India.",
  intro:
    "I’m a technical growth operator based in India. I work where product engineering, go-to-market strategies, agentic workflows, and technical content meet: building systems, driving developer distribution, and helping early-stage startups scale their user base and reach.",
  sections: [
    {
      heading: "What I work on",
      paragraphs: [
        "My work spans technical go-to-market strategies, developer distribution, open-source ecosystems, agentic workflows, and high-performance web systems. I have built developer-facing integrations, driven community distribution reaching hundreds of thousands of impressions, and helped early-stage teams turn technical products into fast-growing developer ecosystems.",
        "I’m especially interested in reliable AI agents: systems whose behavior can be observed, evaluated, and improved instead of treated as a black box. That interest also shapes this site. Its articles, project notes, machine-readable indexes, and Markdown responses are designed to be useful to both people and software agents.",
      ],
    },
    {
      heading: "How I collaborate",
      paragraphs: [
        "I’m most useful on work that needs engineering depth, growth execution, and clear technical communication at the same time. That can mean formulating a go-to-market strategy, prototyping an agent workflow, orchestrating developer distribution, creating technical content engines, or scaling open-source communities.",
        "For a fuller record, see the work page, résumé, project case studies, and technical blog. For collaboration, freelance work, full-time opportunities, or a specific technical question, use the contact page and include the problem, relevant constraints, and the outcome you want.",
      ],
    },
  ],
};

export const privacyPage: PublicPageContent = {
  title: "Privacy",
  description:
    "Privacy information for swapnoneel.site, including analytics, contact-form processing, scheduling, external links, and visitor choices.",
  intro:
    "This is the privacy notice for swapnoneel.site, the personal portfolio and writing site of Swapnoneel Saha. It explains what information may be processed when you browse the site, send a message, book a call, or follow a link to another service. Last updated: August 23, 2026.",
  sections: [
    {
      heading: "Browsing and measurement",
      paragraphs: [
        "The site uses Vercel Analytics and Vercel Speed Insights to understand aggregate traffic and technical performance. When the site is delivered, hosting and measurement providers may process ordinary request information such as an IP address, browser or device details, referring page, requested URL, and timing data. This information is used to operate, secure, and improve the site rather than to build advertising profiles.",
        "The site stores your selected color theme and article text-size preference in your browser so those choices persist. These preferences remain on your device unless you clear the site’s local storage. The public pages do not require an account, and the portfolio does not provide a user database or sell visitor information.",
      ],
    },
    {
      heading: "Messages, scheduling, and external services",
      paragraphs: [
        "If you submit the contact form, the name, email address, subject, and message you provide are sent through EmailJS so Swapnoneel can receive and reply to the message. Do not include passwords, payment details, private keys, health records, or other sensitive information. Information you send is used only to understand and respond to your request or continue a professional conversation you initiated.",
        "Booking a call uses Cal.com, and external links may take you to GitHub, LinkedIn, publishing platforms, project sites, or other services. Those services operate under their own privacy terms. You can avoid their processing by not opening the relevant link or booking widget. To ask a privacy question or request deletion of information you sent through the contact form, email swapnoneelsaha111@gmail.com.",
      ],
    },
  ],
};

export const developersPage: PublicPageContent = {
  title: "Swapnoneel Saha developer resources",
  description:
    "Developer and agent resources for swapnoneel.site: Markdown negotiation, content indexes, feeds, sitemap, source code, and integration status.",
  intro:
    "This page is the developer-resource index for swapnoneel.site. It lists the stable, public interfaces an agent, crawler, research tool, or developer can use to read the site without relying on client-side JavaScript.",
  sections: [
    {
      heading: "Machine-readable interfaces",
      paragraphs: [
        "Canonical page URLs support HTTP content negotiation. Send Accept: text/markdown to receive a UTF-8 Markdown representation; send Accept: text/html for the browser document. Negotiated responses vary on Accept, explicit .md sibling URLs are available for page content, and unsupported media requests receive HTTP 406. The sitemap, robots file, RSS feed, concise llms.txt profile, full llms-full.txt corpus, and agent instructions are linked below.",
        "Blog posts retain their authored Markdown, while index and profile pages expose concise Markdown assembled from the same source data used by the visible site. A missing page returns HTTP 404 in both HTML and Markdown. The Markdown 404 includes recovery links so an automated client can continue from the sitemap or content indexes.",
      ],
    },
    {
      heading: "API and integration status",
      paragraphs: [
        "swapnoneel.site is a public portfolio and publication, not a hosted software API. It currently has no public OpenAPI specification, authentication flow, webhook endpoint, package SDK, or MCP server. Those interfaces are intentionally not fabricated here. The supported integration surface is read-only HTTP content, the RSS feed, public metadata, and the site’s open-source repository.",
        "For project-specific APIs or source code, open the relevant project page and follow its repository or live-project link when one is published. To discuss an integration, agent workflow, technical collaboration, or access that is not public, contact Swapnoneel with the target project, intended use, data required, and expected call pattern.",
      ],
    },
  ],
};

export function publicPageToMarkdown(page: PublicPageContent): string {
  const sections = page.sections.flatMap((section) => [
    `## ${section.heading}`,
    "",
    ...section.paragraphs.flatMap((paragraph) => [paragraph, ""]),
  ]);

  return [`# ${page.title}`, "", page.intro, "", ...sections].join("\n").trim();
}
