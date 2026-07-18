import fs from "fs/promises";
import matter from "gray-matter";
import path from "path";
import sharp from "sharp";

const mdDir = path.join(process.cwd(), "md", "blog");
const outPath = path.join(process.cwd(), "lib", "image-dimensions.json");
const CONCURRENCY = 8;

async function getAllMarkdownFiles(dir) {
  let results = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(await getAllMarkdownFiles(full));
    } else if (/\.mdx?$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function extractImageUrls(raw) {
  const urls = new Set();
  const { data, content } = matter(raw);
  // Frontmatter cover images render as the post thumbnail, so they need
  // dimensions too.
  if (typeof data.cover === "string" && /^https?:\/\//.test(data.cover)) {
    urls.add(data.cover);
  }
  // Hashnode exports often trail the URL with `title` or `align="..."`
  // before the closing paren (e.g. `![](url align="center")`) — the app's
  // markdown cleanup strips that suffix before render, so just capture up
  // to the first whitespace/paren rather than requiring `)` immediately
  // after the URL, or every such image silently gets skipped here.
  const regex = /!\[[^\]]*\]\((https?:\/\/[^\s)]+)/g;
  let match;
  while ((match = regex.exec(content))) {
    urls.add(match[1]);
  }
  return urls;
}

async function fetchDimensions(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) return null;
    return { width: metadata.width, height: metadata.height };
  } catch (error) {
    console.warn(`Skipping dimensions for ${url}: ${error.message}`);
    return null;
  }
}

// Precomputes real width/height for every remote image embedded in blog
// markdown, mirroring generate-blur.mjs's build-time approach so BlogImage
// can reserve a frame matching each image's actual aspect ratio (no CLS)
// instead of forcing every image into a fixed 16:9 box. Cached by URL so
// repeat runs only fetch images that are new since the last build.
async function generateImageDimensions() {
  const files = await getAllMarkdownFiles(mdDir);
  const allUrls = new Set();
  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    for (const url of extractImageUrls(content)) allUrls.add(url);
  }

  let existing = {};
  try {
    existing = JSON.parse(await fs.readFile(outPath, "utf8"));
  } catch {
    existing = {};
  }

  const toFetch = Array.from(allUrls).filter((url) => !existing[url]);
  for (let i = 0; i < toFetch.length; i += CONCURRENCY) {
    const batch = toFetch.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(fetchDimensions));
    batch.forEach((url, idx) => {
      if (results[idx]) existing[url] = results[idx];
    });
  }

  // prune entries for images no longer referenced by any post
  const sorted = Object.fromEntries(
    Object.keys(existing)
      .filter((key) => allUrls.has(key))
      .sort()
      .map((key) => [key, existing[key]])
  );

  await fs.writeFile(outPath, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(
    `Successfully generated lib/image-dimensions.json (${Object.keys(sorted).length} images, ${toFetch.length} fetched)`
  );
}

generateImageDimensions().catch((error) => {
  console.error(error);
  process.exit(1);
});
