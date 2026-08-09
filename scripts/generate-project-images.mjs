import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const sourceDir = path.join(process.cwd(), "public", "project");
const outputDir = path.join(process.cwd(), "public", "project-img");
const cachePath = path.join(outputDir, ".pipeline.json");

// Project cards are shown at ~380px and overlay heroes top out at ~654px, but
// their ten JPEG sources are all 1920px and 265-936KB. Sending them through
// /_next/image made the first visitor pay ten cold AVIF transcodes. These are
// the same four widths next/image can request from next.config.ts, encoded once
// at build time with the slower effort setting that is impractical on demand.
const DEVICE_SIZES = [640, 960, 1280, 1536];
const AVIF_QUALITY = 70;
const AVIF_EFFORT = 6;
const PIPELINE_VERSION = 1;

async function readCache() {
  try {
    return JSON.parse(await fs.readFile(cachePath, "utf8"));
  } catch {
    return null;
  }
}

function outputName(sourceName, width) {
  return `${path.parse(sourceName).name}-${width}.avif`;
}

async function outputsExist(sourceName) {
  try {
    await Promise.all(
      DEVICE_SIZES.map((width) =>
        fs.stat(path.join(outputDir, outputName(sourceName, width)))
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
const previous = await readCache();
const hashes = {};
let encoded = 0;
let totalBytes = 0;

for (const sourceName of sourceNames) {
  const sourcePath = path.join(sourceDir, sourceName);
  const source = await fs.readFile(sourcePath);
  const hash = crypto.createHash("sha256").update(source).digest("hex");
  hashes[sourceName] = hash;

  const reusable =
    previous?.version === PIPELINE_VERSION &&
    previous?.quality === AVIF_QUALITY &&
    previous?.effort === AVIF_EFFORT &&
    previous?.hashes?.[sourceName] === hash &&
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
    const output = await sharp(source)
      .resize({ width, withoutEnlargement: true })
      .avif({ quality: AVIF_QUALITY, effort: AVIF_EFFORT })
      .toBuffer();
    await fs.writeFile(
      path.join(outputDir, outputName(sourceName, width)),
      output
    );
    encoded++;
    totalBytes += output.length;
  }
}

await fs.writeFile(
  cachePath,
  `${JSON.stringify(
    {
      version: PIPELINE_VERSION,
      quality: AVIF_QUALITY,
      effort: AVIF_EFFORT,
      widths: DEVICE_SIZES,
      hashes,
    },
    null,
    2
  )}\n`
);

console.log(
  encoded === 0
    ? `Project image renditions are current (${sourceNames.length} sources).`
    : `Generated ${encoded} project image renditions (${(totalBytes / 1024).toFixed(0)}KB).`
);
