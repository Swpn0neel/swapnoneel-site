/**
 * Converts narration manifests from v1 (TTS-indexed) to v2 (token-indexed).
 *
 * v1 stored the TTS service's own word list and its boundary offsets. Those
 * tokens do not line up with the words in the article — the service splits
 * hyphenated words, merges others, and speaks expansions like "2026" as "twenty
 * twenty-six" — so the browser had to fuzzy-match the two lists on every page
 * load before it could highlight anything.
 *
 * That match is deterministic, so it belongs here. This rewrites `starts` to be
 * indexed by source token, the same index `rehypeNarrate` stamps into the HTML,
 * and drops the now-redundant `words` array. No audio is re-synthesised and no
 * Blob upload happens: only the JSON changes.
 *
 * Usage: node --experimental-strip-types scripts/align-narrations.mjs [slug...]
 *        --check  exit 1 if anything would change (CI guard)
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { alignNarration, narrationTokens } from "../lib/mdx.ts";

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const onlySlugs = args.filter((a) => !a.startsWith("--"));

const mdDir = path.join(process.cwd(), "md", "blog");
const narrationDir = path.join(process.cwd(), "public", "narration");

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

let converted = 0;
let alreadyV2 = 0;
let missing = 0;
let failed = 0;

for (const file of walk(mdDir)) {
  const slug = path.basename(file, ".md");
  if (onlySlugs.length && !onlySlugs.includes(slug)) continue;

  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  const year = new Date(data.date).getFullYear();
  if (Number.isNaN(year)) continue;

  const manifestPath = path.join(narrationDir, String(year), `${slug}.json`);
  if (!fs.existsSync(manifestPath)) {
    missing++;
    continue;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const tokens = narrationTokens(content);

  // v1 kept the TTS boundaries in words/starts. v2 moves them to
  // ttsWords/ttsStarts and gives `starts` the token-indexed timings, so a
  // re-run always has what alignNarration needs and never has to re-synthesise.
  const ttsWords = manifest.ttsWords ?? manifest.words;
  const ttsStarts =
    manifest.ttsStarts ?? (manifest.v >= 2 ? null : manifest.starts);

  if (manifest.v >= 2 && manifest.starts?.length === tokens.length) {
    alreadyV2++;
    continue;
  }

  if (!Array.isArray(ttsWords) || !Array.isArray(ttsStarts)) {
    console.error(
      `  ${slug}: no TTS boundaries in this manifest — only generate-narrations can rebuild it`
    );
    failed++;
    continue;
  }

  const starts = alignNarration(tokens, ttsWords, ttsStarts, manifest.durationMs);

  if (starts.length !== tokens.length) {
    console.error(`  ${slug}: alignment produced ${starts.length}/${tokens.length}`);
    failed++;
    continue;
  }

  if (checkOnly) {
    console.log(`  ${slug}: would convert (${tokens.length} tokens)`);
    converted++;
    continue;
  }

  const next = {
    v: 2,
    voice: manifest.voice,
    hash: manifest.hash,
    audio: manifest.audio,
    durationMs: manifest.durationMs,
    count: tokens.length,
    starts,
    ttsWords,
    ttsStarts,
  };
  fs.writeFileSync(manifestPath, JSON.stringify(next));
  converted++;
}

console.log(
  `[align-narrations] converted=${converted} alreadyV2=${alreadyV2} noManifest=${missing} failed=${failed}`
);
if (failed > 0) process.exit(1);
if (checkOnly && converted > 0) process.exit(1);
