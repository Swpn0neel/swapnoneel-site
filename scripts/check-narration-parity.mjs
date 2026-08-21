/**
 * Asserts that the word indices baked into the rendered HTML address the same
 * words the narration timings were built for.
 *
 * Three numbers have to agree for a post to highlight correctly:
 *   1. narrationTokens(markdown).length  — what the extractor fed the TTS
 *   2. sum of data-nwc over the article  — what rehypeNarrate numbered
 *   3. manifest.starts.length            — what the timings index
 *
 * They are produced by different passes (mdast, hast, and the TTS service), so
 * nothing but a check like this keeps them honest. Run against a built site:
 *
 *   pnpm build && node --experimental-strip-types scripts/check-narration-parity.mjs
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { narrationTokens } from "../lib/mdx.ts";

const mdDir = path.join(process.cwd(), "md", "blog");
const htmlDir = path.join(process.cwd(), ".next", "server", "app", "blog");
const narrationDir = path.join(process.cwd(), "public", "narration");

if (!fs.existsSync(htmlDir)) {
  console.error("No built HTML found — run `pnpm build` first.");
  process.exit(1);
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".md")) out.push(p);
  }
  return out;
}

let ok = 0;
let skipped = 0;
const failures = [];

for (const file of walk(mdDir)) {
  const slug = path.basename(file, ".md");
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  const year = new Date(data.date).getFullYear();

  const htmlPath = path.join(htmlDir, `${slug}.html`);
  const manifestPath = path.join(narrationDir, String(year), `${slug}.json`);
  if (!fs.existsSync(htmlPath) || !fs.existsSync(manifestPath)) {
    skipped++;
    continue;
  }

  const html = fs.readFileSync(htmlPath, "utf8");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const tokens = narrationTokens(content).length;

  // Anchors appear in document order; each must start where the last ended.
  const anchors = [
    ...html.matchAll(/data-nwb="(\d+)"[^>]*?data-nwc="(\d+)"/g),
  ].map((m) => ({ start: Number(m[1]), count: Number(m[2]) }));

  if (anchors.length === 0) {
    failures.push(`${slug}: no word anchors in rendered HTML`);
    continue;
  }

  let expected = 0;
  let contiguous = true;
  for (const a of anchors) {
    if (a.start !== expected) {
      contiguous = false;
      break;
    }
    expected += a.count;
  }

  const problems = [];
  if (!contiguous) problems.push("anchor indices are not contiguous");
  if (expected !== tokens) {
    problems.push(`HTML numbers ${expected} words, markdown has ${tokens}`);
  }
  if (manifest.starts?.length !== tokens) {
    problems.push(
      `manifest has ${manifest.starts?.length} starts, markdown has ${tokens}`
    );
  }

  if (problems.length) failures.push(`${slug}: ${problems.join("; ")}`);
  else ok++;
}

console.log(
  `[narration-parity] ok=${ok} skipped=${skipped} failed=${failures.length}`
);
for (const f of failures) console.error(`  ${f}`);
if (failures.length) process.exit(1);
