import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { PROJECT_FORMATS } from "../lib/images.config.ts";

// The last images that still went through /_next/image were the two profile
// portraits and the five company logos on the home page. On Vercel the
// optimizer answers those with `Cache-Control: max-age=0, must-revalidate`,
// so every repeat visit revalidated seven images before the hero was settled,
// and the first visitor after a deploy paid a cold transcode for each. They
// are tiny and never change, which makes them the easiest images on the site
// to encode once, here, and serve as immutable static files — the same way
// project covers (generate-project-images.mjs) and blog images
// (mirror-blog-images.mjs) already are.
//
// Each source gets the widths its slot actually renders at 1x and 2x. The
// output name carries a content hash so /ui-img can be cached forever and a
// re-exported source simply gets a new URL. Consumers never build these names:
// lib/ui-images.json is the only place they exist, read via
// lib/ui-image-loader.ts.
const SETS = [
  { dir: "img", match: /^pfp-(?:dark|light)\.webp$/, widths: [140, 280] },
  { dir: "work", match: /\.webp$/, widths: [60, 120] },
];

const outputDir = path.join(process.cwd(), "public", "ui-img");
const manifestPath = path.join(process.cwd(), "lib", "ui-images.json");

const FORMATS = PROJECT_FORMATS.map((f) => ({
  ext: f.ext,
  type: f.type,
  options: { quality: f.quality, effort: f.effort },
}));
const PIPELINE_VERSION = 1;
const pipeline = {
  version: PIPELINE_VERSION,
  formats: Object.fromEntries(FORMATS.map((f) => [f.ext, f.options])),
};

async function readManifest() {
  try {
    return JSON.parse(await fs.readFile(manifestPath, "utf8"));
  } catch {
    return null;
  }
}

const outputName = (stem, hash, width, ext) => `${stem}-${hash}-${width}.${ext}`;

async function exists(file) {
  try {
    await fs.stat(file);
    return true;
  } catch {
    return false;
  }
}

await fs.mkdir(outputDir, { recursive: true });

const previous = await readManifest();
const reusablePipeline =
  JSON.stringify(previous?.pipeline && { ...previous.pipeline, hashes: undefined }) ===
  JSON.stringify({ ...pipeline, hashes: undefined });

const hashes = {};
const sources = {};
const expected = new Set();
let encoded = 0;
let totalBytes = 0;

for (const set of SETS) {
  const dir = path.join(process.cwd(), "public", set.dir);
  const names = (await fs.readdir(dir)).filter((n) => set.match.test(n)).sort();

  for (const name of names) {
    const publicSrc = `/${set.dir}/${name}`;
    const source = await fs.readFile(path.join(dir, name));
    const hash = crypto
      .createHash("sha256")
      .update(source)
      .digest("hex")
      .slice(0, 8);
    hashes[publicSrc] = hash;

    const stem = path.parse(name).name;
    const metadata = await sharp(source).metadata();
    // Never upscale: a 120px logo asked for 120 and 240 gets 120 twice, which
    // is the same file under two descriptors — so cap the ladder at the source.
    const widths = [
      ...new Set(set.widths.map((w) => Math.min(w, metadata.width ?? w))),
    ];
    const names_ = (ext) => widths.map((w) => outputName(stem, hash, w, ext));
    for (const f of FORMATS) for (const n of names_(f.ext)) expected.add(n);

    sources[publicSrc] = {
      width: metadata.width,
      height: metadata.height,
      sources: FORMATS.map((f) => ({
        type: f.type,
        srcSet: widths
          .map((w) => `/ui-img/${outputName(stem, hash, w, f.ext)} ${w}w`)
          .join(", "),
      })),
      // The <img src> under the <source>s: the widest WebP, which every
      // browser that reaches this markup can decode.
      fallback: `/ui-img/${outputName(stem, hash, widths[widths.length - 1], "webp")}`,
    };

    const reusable =
      reusablePipeline &&
      previous?.pipeline?.hashes?.[publicSrc] === hash &&
      (
        await Promise.all(
          FORMATS.flatMap((f) =>
            names_(f.ext).map((n) => exists(path.join(outputDir, n)))
          )
        )
      ).every(Boolean);
    if (reusable) continue;

    for (const width of widths) {
      for (const f of FORMATS) {
        const output = await sharp(source)
          .resize({ width, withoutEnlargement: true })
          [f.ext](f.options)
          .toBuffer();
        await fs.writeFile(
          path.join(outputDir, outputName(stem, hash, width, f.ext)),
          output
        );
        encoded++;
        totalBytes += output.length;
      }
    }
  }
}

// A re-exported or removed source would otherwise leave its old hash's files
// behind forever.
let pruned = 0;
for (const name of await fs.readdir(outputDir)) {
  if (expected.has(name)) continue;
  await fs.rm(path.join(outputDir, name), { force: true });
  pruned++;
}

await fs.writeFile(
  manifestPath,
  `${JSON.stringify({ pipeline: { ...pipeline, hashes }, sources }, null, 2)}\n`
);

console.log(
  encoded === 0
    ? `UI image renditions are current (${Object.keys(sources).length} sources, ${pruned} pruned).`
    : `Generated ${encoded} UI image renditions (${(totalBytes / 1024).toFixed(0)}KB, ${pruned} pruned).`
);
