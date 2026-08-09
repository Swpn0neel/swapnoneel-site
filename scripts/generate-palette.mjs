import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

// Derives each project cover's two dominant hues at build time so the card
// can paint a brand-matched gradient behind the screenshot (see
// .project-cover in app/globals.css). Only hues are stored: saturation and
// lightness are theme-dependent and live in CSS.

const HUE_BIN_SIZE = 30;
const MIN_SATURATION = 0.25;
const MIN_VALUE = 0.15;
const MAX_VALUE = 0.97;
// A secondary hue must be visually distinct and carry real pixel weight,
// otherwise we synthesize a neighbour hue (single-accent UIs like Blame).
const MIN_HUE_DISTANCE = 25;
const SECONDARY_WEIGHT_RATIO = 0.08;
const FALLBACK_HUE_SHIFT = -20;

function rgbToHue(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

function hueDistance(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

async function extractHues(filePath) {
  const { data, info } = await sharp(filePath)
    .resize(200, null, { withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bins = new Map();
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const value = max / 255;
    const saturation = max === 0 ? 0 : (max - min) / max;
    if (saturation < MIN_SATURATION || value < MIN_VALUE || value > MAX_VALUE) {
      continue;
    }
    const hue = rgbToHue(r, g, b);
    const key = Math.floor(hue / HUE_BIN_SIZE) * HUE_BIN_SIZE;
    const bin = bins.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bin.n += 1;
    bin.r += r;
    bin.g += g;
    bin.b += b;
    bins.set(key, bin);
  }

  const ranked = [...bins.values()].sort((a, b) => b.n - a.n);
  if (ranked.length === 0) return { h1: 220, h2: 200 };

  const binHue = (bin) => rgbToHue(bin.r / bin.n, bin.g / bin.n, bin.b / bin.n);
  const h1 = binHue(ranked[0]);

  const secondary = ranked
    .slice(1)
    .find(
      (bin) =>
        bin.n >= Math.max(15, ranked[0].n * SECONDARY_WEIGHT_RATIO) &&
        hueDistance(binHue(bin), h1) >= MIN_HUE_DISTANCE
    );
  const h2 = secondary
    ? binHue(secondary)
    : (h1 + FALLBACK_HUE_SHIFT + 360) % 360;

  return { h1: Math.round(h1), h2: Math.round(h2) };
}

async function generatePaletteMap() {
  const dirPath = path.join(process.cwd(), "public", "project");
  const paletteMap = {};

  const files = await fs.readdir(dirPath);
  for (const file of files.sort()) {
    if (!file.match(/\.(png|jpe?g|webp|avif)$/i)) continue;
    paletteMap[`/project/${file}`] = await extractHues(
      path.join(dirPath, file)
    );
  }

  const outPath = path.join(process.cwd(), "lib", "palette-map.json");
  await fs.writeFile(outPath, `${JSON.stringify(paletteMap, null, 2)}\n`);
  console.log("Successfully generated lib/palette-map.json");
}

generatePaletteMap().catch((error) => {
  console.error(error);
  process.exit(1);
});
