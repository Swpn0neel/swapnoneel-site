import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { DEVICE_SIZES, PROJECT_FORMATS } from "../lib/images.config.ts";

const sourceDir = path.join(process.cwd(), "public", "project");
const outputDir = path.join(process.cwd(), "public", "project-img");
const manifestPath = path.join(process.cwd(), "lib", "project-images.json");

// Project cards are shown at ~380px and overlay heroes top out at ~654px, but
// their ten JPEG sources are all 1920px and 265-936KB. Sending them through
// /_next/image made the first visitor pay ten cold AVIF transcodes. These are
// the same four widths next/image can request from next.config.ts, encoded once
// at build time with the slower effort setting that is impractical on demand.
//
// WebP is encoded alongside AVIF because <picture> does not fall back: once a
// <source> matches, a browser is committed to it. Without this ladder the only
// thing under the AVIF source was the raw 1920px JPEG, so every browser without
// AVIF (Safari before 16.4) downloaded up to 936KB for a 380px card.
//
// Consumers never reconstruct these filenames — the manifest below is the only
// place the naming lives, and lib/project-image-loader.ts is how it is read.
// DEVICE_SIZES and formats are synced via lib/images.config.ts
const FORMATS = PROJECT_FORMATS.map((f) => ({
  ext: f.ext,
  type: f.type,
  options: { quality: f.quality, effort: f.effort },
}));
const PIPELINE_VERSION = 2;

const pipeline = {
  version: PIPELINE_VERSION,
  widths: DEVICE_SIZES,
  formats: Object.fromEntries(FORMATS.map((f) => [f.ext, f.options])),
};

async function readManifest() {
  try {
    return JSON.parse(await fs.readFile(manifestPath, "utf8"));
  } catch {
    return null;
  }
}

const publicPath = (name) => `/project/${name}`;
const outputName = (sourceName, width, ext) =>
  `${path.parse(sourceName).name}-${width}.${ext}`;
const outputPath = (sourceName, width, ext) =>
  `/project-img/${outputName(sourceName, width, ext)}`;

function srcSet(sourceName, ext) {
  return DEVICE_SIZES.map(
    (width) => `${outputPath(sourceName, width, ext)} ${width}w`
  ).join(", ");
}

async function outputsExist(sourceName) {
  try {
    await Promise.all(
      DEVICE_SIZES.flatMap((width) =>
        FORMATS.map((format) =>
          fs.stat(
            path.join(outputDir, outputName(sourceName, width, format.ext))
          )
        )
      )
    );
    return true;
  } catch {
    return false;
  }
}

await fs.mkdir(outputDir, { recursive: true });

const sourceNames = (await fs.readdir(sourceDir))
  .filter((name) => /\.(?:jpe?g|png|webp)$/i.test(name))
  .sort();
const previous = await readManifest();
const reusablePipeline =
  JSON.stringify(
    previous?.pipeline && {
      version: previous.pipeline.version,
      widths: previous.pipeline.widths,
      formats: previous.pipeline.formats,
    }
  ) === JSON.stringify(pipeline);

const hashes = {};
const sources = {};
let encoded = 0;
let totalBytes = 0;

for (const sourceName of sourceNames) {
  const source = await fs.readFile(path.join(sourceDir, sourceName));
  const hash = crypto.createHash("sha256").update(source).digest("hex");
  hashes[sourceName] = hash;

  sources[publicPath(sourceName)] = {
    widest: outputPath(
      sourceName,
      DEVICE_SIZES[DEVICE_SIZES.length - 1],
      "avif"
    ),
    sources: FORMATS.map((format) => ({
      type: format.type,
      srcSet: srcSet(sourceName, format.ext),
    })),
  };

  const reusable =
    reusablePipeline &&
    previous?.pipeline?.hashes?.[sourceName] === hash &&
    (await outputsExist(sourceName));
  if (reusable) continue;

  const metadata = await sharp(source).metadata();
  const widest = DEVICE_SIZES[DEVICE_SIZES.length - 1];
  if (!metadata.width || metadata.width < widest) {
    throw new Error(
      `${sourceName} is ${metadata.width ?? "unknown"}px wide; project covers must be at least ${widest}px for the configured rendition ladder.`
    );
  }

  for (const width of DEVICE_SIZES) {
    for (const format of FORMATS) {
      const output = await sharp(source)
        .resize({ width, withoutEnlargement: true })
        [format.ext](format.options)
        .toBuffer();
      await fs.writeFile(
        path.join(outputDir, outputName(sourceName, width, format.ext)),
        output
      );
      encoded++;
      totalBytes += output.length;
    }
  }
}

// Renaming or deleting a cover used to leave its renditions behind forever,
// where nothing referenced them and nothing would ever clean them up.
const expected = new Set(
  sourceNames.flatMap((sourceName) =>
    DEVICE_SIZES.flatMap((width) =>
      FORMATS.map((format) => outputName(sourceName, width, format.ext))
    )
  )
);
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
    ? `Project image renditions are current (${sourceNames.length} sources, ${pruned} pruned).`
    : `Generated ${encoded} project image renditions (${(totalBytes / 1024).toFixed(0)}KB, ${pruned} pruned).`
);
