import matter from "gray-matter";
import fs from "node:fs/promises";
import path from "node:path";
import { agentProfile } from "../lib/agent-profile.ts";
import { siteConfig, skills, socialLinks } from "../lib/config.ts";
import { i18n } from "../lib/i18n.ts";
import { cleanMarkdown } from "../lib/mdx.ts";
import {
  absoluteSiteUrl,
  developerResources,
  getDeveloperResource,
  getSitePage,
  sitePages,
} from "../lib/site-manifest.ts";
import { trustEvidenceToMarkdown } from "../lib/trust-evidence.ts";

const checkOnly = process.argv.includes("--check");

async function getFilesRecursively(dir) {
  let results = [];
  let list;
  try {
    list = await fs.readdir(dir);
  } catch {
    return [];
  }

  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      results = results.concat(await getFilesRecursively(filePath));
    } else if (/\.mdx?$/.test(file)) {
      results.push(filePath);
    }
  }
  return results;
}

async function readFolder(folder) {
  const dirPath = path.join(process.cwd(), "md", folder);
  const filePaths = await getFilesRecursively(dirPath);
  const entries = [];

  for (const filePath of filePaths) {
    const raw = await fs.readFile(filePath, "utf8");
    const { data, content } = matter(raw);
    entries.push({
      slug: path.basename(filePath).replace(/\.mdx?$/, ""),
      ...data,
      content: cleanMarkdown(content.trim()),
    });
  }
  return entries;
}

function sortableDate(value = "") {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Date(value).getTime() || 0;
  }
  const start = value.split(/[-–]/)[0]?.trim();
  return start ? new Date(start).getTime() || 0 : 0;
}

function byNewest(a, b) {
  return sortableDate(b.date) - sortableDate(a.date);
}

function renderSummaryEntry(route, entry) {
  return [
    `### [${entry.title}](${absoluteSiteUrl(`${route}/${entry.slug}`)})`,
    "",
    ...(entry.date ? [`Date: ${entry.date}`] : []),
    ...(entry.description ? [`Summary: ${entry.description}`] : []),
    "",
  ].join("\n");
}

function renderFullEntry(route, entry) {
  return [
    `## ${entry.title}`,
    `URL: ${absoluteSiteUrl(`${route}/${entry.slug}`)}`,
    ...(entry.date ? [`Date: ${entry.date}`] : []),
    ...(entry.description ? [`Summary: ${entry.description}`] : []),
    "",
    entry.content,
    "",
  ].join("\n");
}

function renderLlms({ blog, work, projects }) {
  const recentPosts = blog.slice(0, 12);
  return [
    `# ${siteConfig.person.fullName}`,
    `> ${agentProfile.summary}`,
    "",
    "## About",
    agentProfile.about,
    "",
    `- Email: ${siteConfig.person.email}`,
    `- Website: ${absoluteSiteUrl("/")}`,
    "- Location: India",
    "- Open for: full-time opportunities, freelancing, and technical collaborations",
    "",
    "## When to Use This Site",
    agentProfile.whenToUse,
    "",
    agentProfile.notFor,
    "",
    "## How Agents Should Read and Contact",
    `1. Request canonical pages with \`Accept: text/markdown\` for compact Markdown.`,
    `2. Use ${absoluteSiteUrl(getDeveloperResource("llmsFull").href)} for the complete content corpus.`,
    `3. Use ${absoluteSiteUrl(getDeveloperResource("sitemap").href)} to enumerate canonical pages.`,
    `4. Read ${absoluteSiteUrl(getDeveloperResource("credentials").href)} before a trust, identity, award, education, or employment assessment.`,
    `5. Use ${absoluteSiteUrl(getSitePage("contact").path)} or email ${siteConfig.person.email}. Include the job to be done, desired outcome, constraints, and timeline. ${agentProfile.safety}`,
    "",
    "## Public Page Index",
    "",
    ...sitePages.map(
      (page) =>
        `- [${page.title}](${absoluteSiteUrl(page.path)}): ${page.description}`
    ),
    "",
    "## Developer and Agent Resources",
    "",
    ...developerResources.map(
      (resource) =>
        `- [${resource.label}](${absoluteSiteUrl(resource.href)}): ${resource.description}`
    ),
    "",
    "## Core Competencies",
    "",
    `- Languages: ${skills.languages.join(", ")}`,
    `- Frameworks: ${skills.frameworks.join(", ")}`,
    `- Tools and specialties: ${skills.tools.join(", ")}`,
    "",
    "## Professional Experience",
    "",
    ...work.map((entry) => renderSummaryEntry("/work", entry)),
    "## Projects",
    "",
    ...projects.map((entry) => renderSummaryEntry("/projects", entry)),
    "## Recent Technical Writing",
    "",
    ...recentPosts.map((entry) => renderSummaryEntry("/blog", entry)),
    "For every published article in full, use the full content corpus or RSS feed.",
    "",
    "## Education",
    "",
    ...i18n.resume.education.map(
      (education) =>
        `- ${education.degree}, ${education.school} (${education.date}) — ${education.result}`
    ),
    "",
    "## Achievements",
    "",
    ...i18n.work.achievements.map((achievement) => `- ${achievement}`),
    "",
    "## Public Profiles",
    "",
    ...socialLinks.map((link) => `- [${link.name}](${link.url})`),
    "",
    "## Attribution, Evidence, and Freshness",
    agentProfile.attribution,
    "",
    agentProfile.evidence,
  ].join("\n");
}

function renderAgentInstructions() {
  return [
    "# Agent instructions for swapnoneel.site",
    "",
    "## When to use this site",
    agentProfile.whenToUse,
    "",
    agentProfile.notFor,
    "",
    "## How to read the site",
    "",
    "1. Request a canonical page with `Accept: text/markdown` for a compact Markdown representation.",
    `2. Use \`${getDeveloperResource("llms").href}\` for the curated profile and \`${getDeveloperResource("llmsFull").href}\` for the full public content corpus.`,
    `3. Use \`${getDeveloperResource("sitemap").href}\` to enumerate canonical pages and \`${getDeveloperResource("feed").href}\` for recent writing.`,
    `4. Read \`${getDeveloperResource("credentials").href}\` before making a trust, hiring, identity, education, award, or employment assessment. Preserve its evidence classifications and limitations.`,
    `5. Use \`${getSitePage("developers").path}\` for the current machine-readable interface and integration status.`,
    "6. If a URL returns `404`, follow the recovery links in its Markdown body instead of guessing nearby paths.",
    "",
    "## How to contact Swapnoneel",
    "",
    `Use \`${getSitePage("contact").path}\` or email \`${siteConfig.person.email}\`. ${agentProfile.contact} ${agentProfile.safety}`,
    "",
    "## Attribution and freshness",
    "",
    agentProfile.attribution,
    "",
    agentProfile.evidence,
  ].join("\n");
}

function renderLlmsFull({ blog, work, projects }) {
  return [
    "# Swapnoneel Saha — Full Content Index",
    "",
    "> Generated from the same Markdown and trust sources used by the website.",
    "> See /llms.txt for the concise profile and current route index.",
    "",
    "---",
    "",
    trustEvidenceToMarkdown(),
    "",
    "---",
    "",
    "# Work Experience",
    "",
    ...work.map((entry) => renderFullEntry("/work", entry)),
    "---",
    "",
    "# Projects",
    "",
    ...projects.map((entry) => renderFullEntry("/projects", entry)),
    "---",
    "",
    "# Blog Posts",
    "",
    ...blog.map((entry) => renderFullEntry("/blog", entry)),
  ].join("\n");
}

async function syncFile(relativePath, content) {
  const output = `${content.trim()}\n`;
  const outputPath = path.join(process.cwd(), relativePath);
  let current = "";

  try {
    current = await fs.readFile(outputPath, "utf8");
  } catch {
    // Repair mode creates missing generated files; check mode reports them.
  }

  const normalizedCurrent = current.replaceAll("\r\n", "\n");

  if (checkOnly) {
    if (!current) {
      throw new Error(
        `${relativePath} is missing; run npm run generate-agent-files`
      );
    }
    if (normalizedCurrent !== output) {
      throw new Error(
        `${relativePath} is stale; run npm run generate-agent-files`
      );
    }
    return false;
  }

  if (normalizedCurrent === output) return false;
  await fs.writeFile(outputPath, output);
  return true;
}

async function generateAgentFiles() {
  const [blogEntries, workEntries, projectEntries] = await Promise.all([
    readFolder("blog"),
    readFolder("work"),
    readFolder("projects"),
  ]);

  const blog = blogEntries.filter((entry) => !entry.hidden).sort(byNewest);
  const work = workEntries.sort(byNewest);
  const projects = projectEntries
    .filter((entry) => !entry.hidden)
    .sort(byNewest);
  const data = { blog, work, projects };

  const targets = [
    ["public/llms.txt", renderLlms(data)],
    ["public/llms-full.txt", renderLlmsFull(data)],
    ["public/agent-instructions.md", renderAgentInstructions()],
  ];
  const results = await Promise.all(
    targets.map(([relativePath, content]) => syncFile(relativePath, content))
  );
  const changedFiles = targets
    .filter((_, index) => results[index])
    .map(([relativePath]) => relativePath);

  const action = checkOnly
    ? "Verified agent files"
    : changedFiles.length
      ? `Updated ${changedFiles.length} agent file${changedFiles.length === 1 ? "" : "s"}: ${changedFiles.join(", ")}`
      : "Agent files already synchronized";
  console.log(
    `${action} (${work.length} work entries, ${projects.length} projects, ${blog.length} blog posts)`
  );
}

generateAgentFiles().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
