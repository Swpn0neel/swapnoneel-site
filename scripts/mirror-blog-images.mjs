// Pulls remote images referenced by a post into src/assets/blog-img and
// rewrites the markdown to point at the local copy.
//
// This replaces a 584-line script that also transcoded, resized, hashed and
// maintained a manifest of pre-encoded AVIF renditions per breakpoint. All of
// that existed to work around next/image: the optimizer hardcodes `effort: 3`
// and re-encoded an already-lossy WebP mirror, so doing it properly meant doing
// it ourselves. Astro's build encodes from the original at whatever effort and
// quality astro.config.mjs asks for, so the only job left is the one that was
// always genuinely necessary — getting third-party bytes onto our own disk so a
// dead upstream URL cannot break a post.
//
// Run it after pasting a syndicated draft:
//   node scripts/mirror-blog-images.mjs
//
// Idempotent: a post with no remote images is left alone.

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const BLOG_DIR = path.join(process.cwd(), "src", "content", "blog");
const ASSET_ROOT = path.join(process.cwd(), "src", "assets", "blog-img");

const IMAGE_PATTERN = /(!\[[^\]]*\])\((https?:\/\/[^)\s]+)\)/g;
const COVER_PATTERN = /^(cover\s*:\s*)(["']?)(https?:\/\/\S+?)\2\s*$/m;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return /\.mdx?$/.test(entry.name) ? [full] : [];
    })
  );
  return files.flat();
}

/**
 * A stable filename: the upstream basename plus a short hash of the full URL.
 * The hash is what keeps two posts that both reference "banner.png" from
 * colliding, and what makes re-running this a no-op.
 */
function filenameFor(url) {
  const base =
    path
      .basename(new URL(url).pathname)
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 60) || "image";
  const hash = crypto.createHash("sha1").update(url).digest("hex").slice(0, 8);
  return `${base}-${hash}`;
}

async function download(url, destNoExt) {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`${response.status} ${response.statusText}`);
  const type = response.headers.get("content-type") ?? "";
  const ext =
    {
      "image/webp": ".webp",
      "image/avif": ".avif",
      "image/png": ".png",
      "image/jpeg": ".jpg",
      "image/gif": ".gif",
      "image/svg+xml": ".svg",
    }[type.split(";")[0].trim()] ??
    path.extname(new URL(url).pathname) ??
    ".jpg";

  const dest = `${destNoExt}${ext}`;
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, Buffer.from(await response.arrayBuffer()));
  return dest;
}

let downloaded = 0;
let rewritten = 0;
const failures = [];

for (const post of await walk(BLOG_DIR)) {
  const slug = path.basename(post).replace(/\.mdx?$/, "");
  const year = path.basename(path.dirname(post));
  const postDir = path.dirname(post);
  let text = await fs.readFile(post, "utf8");
  let changed = false;

  /** Downloads `url` and returns the path to write into the markdown. */
  const localise = async (url) => {
    const destNoExt = path.join(ASSET_ROOT, year, slug, filenameFor(url));
    // Already pulled on an earlier run?
    const dir = path.dirname(destNoExt);
    const existing = await fs.readdir(dir).catch(() => []);
    const match = existing.find((name) =>
      name.startsWith(path.basename(destNoExt) + ".")
    );
    const file = match
      ? path.join(dir, match)
      : await download(url, destNoExt).then((p) => {
          downloaded++;
          return p;
        });
    return path.relative(postDir, file).replace(/\\/g, "/");
  };

  const cover = text.match(COVER_PATTERN);
  if (cover) {
    try {
      text = text.replace(COVER_PATTERN, `$1${await localise(cover[3])}`);
      changed = true;
    } catch (error) {
      failures.push(`${slug} cover: ${error.message}`);
    }
  }

  for (const [full, alt, url] of [...text.matchAll(IMAGE_PATTERN)]) {
    try {
      text = text.replace(full, `${alt}(${await localise(url)})`);
      changed = true;
    } catch (error) {
      failures.push(`${slug} ${url}: ${error.message}`);
    }
  }

  if (changed) {
    await fs.writeFile(post, text, "utf8");
    rewritten++;
  }
}

console.log(
  `blog images: ${downloaded} downloaded, ${rewritten} post(s) rewritten` +
    (failures.length ? `, ${failures.length} failed` : "")
);
for (const failure of failures) console.warn(`  ${failure}`);
