import crypto from "crypto";
import fs from "fs/promises";
import matter from "gray-matter";
import path from "path";
import sharp from "sharp";

const mdDir = path.join(process.cwd(), "md", "blog");
const outDir = path.join(process.cwd(), "public", "blog-img");
// Originals for posts written here rather than syndicated from dev.to/Hashnode.
// The tree mirrors the published paths: assets/blog-img/<year>/<slug>/name.png
// becomes /blog-img/<year>/<slug>/name.webp.
const localSrcDir = path.join(process.cwd(), "assets", "blog-img");
const manifestPath = path.join(process.cwd(), "lib", "blog-images.json");
const CONCURRENCY = 8;

// Blog images come from third-party hosts (WordPress, Hashnode, S3) whose
// origins answer in ~1s. Every /_next/image cache miss paid that round trip
// plus a full-size transcode before a single byte reached the reader, so a
// 5KB image could take over a second. Mirroring the sources into public/ at
// build time removes the third-party hop entirely: the optimizer now reads a
// small local file off our own CDN.
//
// MAX_WIDTH matches the largest entry in next.config deviceSizes — anything
// wider can never be selected by a srcset candidate, so storing it would only
// slow the transcode down.
const MAX_WIDTH = 1280;
const WEBP_QUALITY = 100;

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
  // mirroring too.
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

// Same idea for locally-authored posts, except the "source" is a file in
// assets/blog-img instead of a remote host. The markdown already points at the
// published /blog-img path, so these need no rewriting at render time — they
// only need the transcode and the manifest dimensions (which is what keeps the
// frame from shifting once the image loads).
function extractLocalRefs(raw) {
  const refs = new Set();
  const { data, content } = matter(raw);
  if (typeof data.cover === "string" && data.cover.startsWith("/blog-img/")) {
    refs.add(data.cover);
  }
  const regex = /!\[[^\]]*\]\((\/blog-img\/[^\s)]+)/g;
  let match;
  while ((match = regex.exec(content))) {
    refs.add(match[1]);
  }
  return refs;
}

// Finds the original next to the published path, whatever extension it was
// authored in (screenshots arrive as .png, photos as .jpg).
async function findLocalSource(ref) {
  const relative = ref.replace(/^\/blog-img\//, "").replace(/\.webp$/, "");
  const dir = path.join(localSrcDir, path.dirname(relative));
  const base = path.basename(relative);
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch {
    return null;
  }
  const hit = entries.find(
    (entry) =>
      entry.replace(/\.[^.]*$/, "") === base &&
      /\.(png|jpe?g|webp|avif|gif|tiff?)$/i.test(entry)
  );
  return hit ? path.join(dir, hit) : null;
}

// Re-transcodes only when the original is newer than what is already published,
// so a build over an unchanged assets/ tree does no image work at all.
async function transcodeLocal(source, target) {
  const absolute = path.join(
    process.cwd(),
    "public",
    target.replace(/^\//, "")
  );
  const [sourceStat, targetStat] = await Promise.all([
    fs.stat(source),
    fs.stat(absolute).catch(() => null),
  ]);
  if (targetStat && targetStat.mtimeMs >= sourceStat.mtimeMs) {
    const meta = await sharp(absolute).metadata();
    return { local: target, width: meta.width, height: meta.height, bytes: 0 };
  }

  const output = await sharp(source, { density: 300 })
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true });

  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, output.data);

  return {
    local: target,
    width: output.info.width,
    height: output.info.height,
    bytes: output.data.length,
  };
}

// Mirrored paths relative to public/blog-img, using forward slashes so they
// compare directly against the manifest's `local` values on Windows too.
async function listMirroredFiles(dir = outDir, prefix = "") {
  const found = new Set();
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      for (const nested of await listMirroredFiles(
        path.join(dir, entry.name),
        relative
      )) {
        found.add(nested);
      }
    } else {
      found.add(relative);
    }
  }
  return found;
}

async function removeEmptyDirectories(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    await removeEmptyDirectories(path.join(dir, entry.name));
  }
  if (dir !== outDir && (await fs.readdir(dir)).length === 0) {
    await fs.rmdir(dir);
  }
}

// Post slugs pass through whole (they are already unique and readable);
// only the image basename is capped, since upload names can be arbitrarily
// long and the hash suffix is what actually guarantees uniqueness.
function slugify(value, fallback, maxLength = Infinity) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, maxLength) || fallback
  );
}

// Mirrored files live under blog-img/<year>/<post-slug>/ so the directory tree
// matches md/blog and a post's images can be found (or deleted) as a unit.
// The hash suffix keeps two same-named uploads from different hosts (there are
// several `image.png`s) from overwriting each other, and changes whenever the
// source URL changes so a stale file can never be served.
function localPath(url, owner) {
  const hash = crypto.createHash("sha1").update(url).digest("hex").slice(0, 8);
  let base = "image";
  try {
    base = path.basename(new URL(url).pathname).replace(/\.[^.]*$/, "");
  } catch {
    // fall through to the default
  }
  return `/blog-img/${owner.year}/${owner.slug}/${slugify(base, "image", 48)}-${hash}.webp`;
}

async function mirror(url, target) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  // density lifts SVG rasterization to the target width instead of its
  // (usually tiny) intrinsic size.
  const input = sharp(buffer, { density: 300 });
  const metadata = await input.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("no dimensions");
  }

  const output = await input
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true });

  const absolute = path.join(
    process.cwd(),
    "public",
    target.replace(/^\//, "")
  );
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, output.data);

  return {
    local: target,
    width: output.info.width,
    height: output.info.height,
    bytes: output.data.length,
  };
}

async function mirrorBlogImages() {
  await fs.mkdir(outDir, { recursive: true });

  // Sorted so a URL shared by several posts always lands in the same post's
  // directory, whichever order the filesystem hands the files back in.
  const files = (await getAllMarkdownFiles(mdDir)).sort();
  const allUrls = new Map();
  const allLocalRefs = new Set();
  for (const file of files) {
    const relative = path.relative(mdDir, file);
    const owner = {
      year: slugify(path.dirname(relative), "misc"),
      slug: slugify(path.basename(relative).replace(/\.mdx?$/, ""), "post"),
    };
    const content = await fs.readFile(file, "utf8");
    for (const url of extractImageUrls(content)) {
      if (!allUrls.has(url)) allUrls.set(url, owner);
    }
    for (const ref of extractLocalRefs(content)) {
      allLocalRefs.add(ref);
    }
  }

  let existing = {};
  try {
    existing = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  } catch {
    existing = {};
  }

  const present = await listMirroredFiles();

  // Move rather than re-download when a post is renamed or an image changes
  // owner: the bytes on disk are already the right bytes.
  let moved = 0;
  for (const [url, owner] of allUrls) {
    const entry = existing[url];
    const target = localPath(url, owner);
    if (!entry || entry.local === target) continue;
    if (!present.has(entry.local.replace("/blog-img/", ""))) continue;
    const from = path.join(outDir, entry.local.replace("/blog-img/", ""));
    const to = path.join(outDir, target.replace("/blog-img/", ""));
    await fs.mkdir(path.dirname(to), { recursive: true });
    await fs.rename(from, to);
    present.delete(entry.local.replace("/blog-img/", ""));
    present.add(target.replace("/blog-img/", ""));
    existing[url] = { ...entry, local: target };
    moved += 1;
  }

  // Re-fetch anything missing from the manifest, and anything whose mirrored
  // file has since been deleted, so a wiped public/blog-img self-heals.
  const toFetch = Array.from(allUrls.keys()).filter((url) => {
    const entry = existing[url];
    return !entry || !present.has(entry.local.replace("/blog-img/", ""));
  });

  const failures = [];
  let mirroredBytes = 0;

  for (let i = 0; i < toFetch.length; i += CONCURRENCY) {
    const batch = toFetch.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (url) => {
        try {
          return await mirror(url, localPath(url, allUrls.get(url)));
        } catch (error) {
          failures.push(`${url} — ${error.message}`);
          return null;
        }
      })
    );
    batch.forEach((url, idx) => {
      const result = results[idx];
      if (!result) return;
      mirroredBytes += result.bytes;
      existing[url] = {
        local: result.local,
        width: result.width,
        height: result.height,
      };
    });
  }

  // Locally-authored images: transcode assets/blog-img into public/blog-img.
  let localTranscoded = 0;
  for (const ref of allLocalRefs) {
    const source = await findLocalSource(ref);
    if (!source) {
      failures.push(`${ref} — no original found under assets/blog-img`);
      continue;
    }
    try {
      const result = await transcodeLocal(source, ref);
      if (result.bytes) {
        mirroredBytes += result.bytes;
        localTranscoded += 1;
      }
      existing[ref] = {
        local: result.local,
        width: result.width,
        height: result.height,
      };
    } catch (error) {
      failures.push(`${ref} — ${error.message}`);
    }
  }

  // Prune manifest entries for images no longer referenced by any post.
  const manifest = Object.fromEntries(
    Object.keys(existing)
      .filter((key) => allUrls.has(key) || allLocalRefs.has(key))
      .sort()
      .map((key) => [key, existing[key]])
  );

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  // Delete mirrored files that no longer belong to any manifest entry, then
  // the directories a deleted post left behind.
  const kept = new Set(
    Object.values(manifest).map((entry) =>
      entry.local.replace("/blog-img/", "")
    )
  );
  let pruned = 0;
  for (const file of await listMirroredFiles()) {
    if (kept.has(file)) continue;
    await fs.unlink(path.join(outDir, file));
    pruned += 1;
  }
  await removeEmptyDirectories(outDir);

  console.log(
    `Successfully generated lib/blog-images.json (${Object.keys(manifest).length}/${allUrls.size + allLocalRefs.size} images mirrored, ${toFetch.length} fetched, ${localTranscoded} transcoded locally, ${moved} moved, ${pruned} pruned)`
  );
  if (mirroredBytes) {
    console.log(`  wrote ${(mirroredBytes / 1048576).toFixed(1)} MB`);
  }
  // Unmirrored images still render — BlogImage falls back to the original
  // remote URL — but they keep the slow third-party path, so make them loud.
  if (failures.length) {
    console.warn(`  ${failures.length} image(s) could not be mirrored:`);
    for (const failure of failures) console.warn(`    ${failure}`);
  }
}

mirrorBlogImages().catch((error) => {
  console.error(error);
  process.exit(1);
});
