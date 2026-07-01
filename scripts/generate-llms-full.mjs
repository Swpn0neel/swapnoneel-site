import fs from "fs/promises";
import matter from "gray-matter";
import path from "path";

const baseUrl = "https://www.swapnoneel.site";

async function readFolder(folder) {
  const dirPath = path.join(process.cwd(), "md", folder);
  let files = [];

  try {
    files = await fs.readdir(dirPath);
  } catch (error) {
    console.warn(`Skipping ${dirPath}:`, error.message);
    return [];
  }

  const entries = [];
  for (const file of files) {
    if (!file.match(/\.mdx?$/)) continue;
    const raw = await fs.readFile(path.join(dirPath, file), "utf8");
    const { data, content } = matter(raw);
    entries.push({ slug: file.replace(/\.mdx?$/, ""), ...data, content: content.trim() });
  }
  return entries;
}

function renderEntry(url, entry) {
  const lines = [`## ${entry.title}`, `URL: ${url}`];
  if (entry.date) lines.push(`Date: ${entry.date}`);
  if (entry.description) lines.push(`Summary: ${entry.description}`);
  lines.push("", entry.content, "");
  return lines.join("\n");
}

async function generateLlmsFull() {
  const [blog, work, projects] = await Promise.all([
    readFolder("blog"),
    readFolder("work"),
    readFolder("projects"),
  ]);

  blog.sort(
    (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
  );

  const parts = [
    "# Swapnoneel Saha — Full Content Index",
    "",
    "> Auto-generated at build time directly from the site's source content —",
    "> every work entry, project, and blog post in full, always kept in sync.",
    "> See /llms.txt for a curated summary.",
    "",
    "---",
    "",
    "# Work Experience",
    "",
    ...work.map((item) => renderEntry(`${baseUrl}/work/${item.slug}`, item)),
    "---",
    "",
    "# Projects",
    "",
    ...projects.map((item) =>
      renderEntry(item.link || `${baseUrl}/work/${item.slug}`, item)
    ),
    "---",
    "",
    "# Blog Posts",
    "",
    ...blog.map((item) => renderEntry(`${baseUrl}/blog/${item.slug}`, item)),
  ];

  const outPath = path.join(process.cwd(), "public", "llms-full.txt");
  await fs.writeFile(outPath, `${parts.join("\n")}\n`);
  console.log(
    `Successfully generated public/llms-full.txt (${work.length} work entries, ${projects.length} projects, ${blog.length} blog posts)`
  );
}

generateLlmsFull().catch((error) => {
  console.error(error);
  process.exit(1);
});
