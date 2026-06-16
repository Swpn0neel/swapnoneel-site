import fs from "fs";
import path from "path";

// List of blogs with their URLs (we fetch all metadata dynamically!)
const blogs = [
  {
    slug: "chaos-testing-explained-a-comprehensive-guide",
    link: "https://keploy.io/blog/community/chaos-testing-explained-a-comprehensive-guide",
  },
  {
    slug: "access-control-testing-guide",
    link: "https://keploy.io/blog/community/access-control-testing-guide",
  },
  {
    slug: "top-5-must-use-vs-code-extensions-for-developers-in-2025",
    link: "https://keploy.io/blog/community/top-5-must-use-vs-code-extensions-for-developers-in-2025",
  },
  {
    slug: "unit-testing-vs-integration-testing-a-comprehensive-guide",
    link: "https://keploy.io/blog/community/unit-testing-vs-integration-testing-a-comprehensive-guide",
  },
  {
    slug: "comparing-github-copilot-vs-chatgpt-for-unit-testing",
    link: "https://keploy.io/blog/community/comparing-github-copilot-vs-chatgpt-for-unit-testing",
  },
  {
    slug: "ai-code",
    link: "https://keploy.io/blog/community/ai-code",
  },
  {
    slug: "guide-finding-elements-in-a-list-using-python",
    link: "https://keploy.io/blog/community/guide-finding-elements-in-a-list-using-python",
  },
  {
    slug: "the-impact-of-ai-on-code-commenting-and-software-documentation",
    link: "https://keploy.io/blog/community/the-impact-of-ai-on-code-commenting-and-software-documentation",
  },
  {
    slug: "functional-testing-an-in-depth-overview",
    link: "https://keploy.io/blog/community/functional-testing-an-in-depth-overview",
  },
  {
    slug: "javascript-random-number",
    link: "https://keploy.io/blog/community/javascript-random-number",
  },
];

let TurndownService;
try {
  const mod = await import("turndown");
  TurndownService = mod.default;
} catch (e) {
  console.error("Please run 'pnpm add -D turndown' first.");
  process.exit(1);
}

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

// Remove Table of Contents blocks
turndownService.addRule("removeToc", {
  filter: function (node) {
    return node.className && node.className.includes("post-toc-block");
  },
  replacement: function () {
    return "";
  },
});

// Strip HTML helper
function cleanExcerpt(htmlStr) {
  if (!htmlStr) return "";
  return htmlStr
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/&hellip;/g, "...") // Replace ellipses
    .replace(/\[&hellip;\]/g, "...")
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();
}

async function run() {
  const outputDir = path.join(process.cwd(), "md", "blog");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const blog of blogs) {
    console.log(`Fetching: ${blog.slug}...`);
    try {
      const response = await fetch(blog.link);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const html = await response.text();
      const nextDataMatch = html.match(
        /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
      );
      if (!nextDataMatch) {
        throw new Error("Could not find __NEXT_DATA__ script tag");
      }

      const nextData = JSON.parse(nextDataMatch[1]);
      const post = nextData.props?.pageProps?.post;
      if (!post) {
        throw new Error("Could not find post data inside pageProps");
      }

      let htmlContent = post.content;
      if (!htmlContent) {
        throw new Error("Could not find post content string");
      }

      // 1. Remove style and script tags entirely
      htmlContent = htmlContent.replace(/<style[\s\S]*?<\/style>/gi, "");
      htmlContent = htmlContent.replace(/<script[\s\S]*?<\/script>/gi, "");

      // 2. Remove the author bio boxes at the bottom of the post content
      htmlContent = htmlContent.split(
        /<div[^>]*class=["']pp-multiple-authors-boxes-wrapper/i
      )[0];

      const title = post.title || "";
      const date = post.date
        ? new Date(post.date).toISOString()
        : new Date().toISOString();
      const description =
        cleanExcerpt(post.excerpt) || post.seo?.metaDesc || "";
      const cover = post.featuredImage?.node?.sourceUrl || "";

      console.log(`Converting to markdown for: "${title}"...`);
      let markdown = turndownService.turndown(htmlContent);

      // Clean up markdown backslashes in front of underscores/asterisks
      markdown = markdown.replace(/\\_/g, "_");

      // format the final file content
      const fileContent = `---
title: "${title.replace(/"/g, '\\"')}"
date: "${date}"
description: "${description.replace(/"/g, '\\"')}"
cover: "${cover}"
link: "${blog.link}"
---

${markdown}
`;

      const filePath = path.join(outputDir, `${blog.slug}.md`);
      fs.writeFileSync(filePath, fileContent, "utf8");
      console.log(`Saved: ${filePath}\n`);
    } catch (error) {
      console.error(`Failed to process ${blog.slug}:`, error);
    }
  }

  console.log("All blogs imported successfully with clean content!");
}

run();
