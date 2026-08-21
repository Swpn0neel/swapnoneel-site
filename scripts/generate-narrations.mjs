// Generates read-along narration for blog posts with Microsoft Edge neural TTS,
// and keeps narration in sync with the current set of posts.
//
// For each post in md/blog it synthesizes the narratable prose (same skip
// rules as the client narrator: no code, tables, images) and produces:
//   - an MP3: always cached locally at public/narration/<year>/<slug>.mp3
//     (gitignored — a local backup copy, not the source of truth) and
//     uploaded to Vercel Blob at narration/<slug>.mp3 (the source of truth
//     production reads from)
//   - public/narration/<year>/<slug>.json (committed): word timings + audio
//     URL, consumed by components/blog-narrator.tsx to drive word highlighting.
//     The year subfolder mirrors md/blog/<year>/ and is keyed off the post's
//     own publish year, not its folder — see yearOf() below.
//
// A full run (no slug args) also prunes posts that no longer exist in
// md/blog: their Blob object, local JSON and local MP3 are all deleted.
//
// This runs automatically via predev/prebuild (so local dev and `pnpm build`
// stay in sync with the current posts) and via a pre-commit hook (so the
// committed manifests always match what's live in Blob). It no-ops on
// Vercel's own remote build — that build only needs the manifests already
// committed by the pre-commit hook; re-synthesizing there would be slow and
// would break the build if the Blob token isn't configured remotely.
//
// Usage:
//   node scripts/generate-narrations.mjs              # sync all posts (cached by content hash)
//   node scripts/generate-narrations.mjs <slug> ...   # regenerate specific posts (no pruning)
//   node scripts/generate-narrations.mjs --force      # ignore the hash cache
//   node scripts/generate-narrations.mjs --offline    # skip Blob entirely: local MP3s only,
//                                                     # for quick local testing (--local also works)
//
// Requires BLOB_READ_WRITE_TOKEN (env or .env.local) unless --offline. Missing
// prerequisites (no token, running on Vercel) are treated as a soft skip, not
// a hard failure, so `pnpm dev`/`pnpm build` never break because of this step.

import matter from "gray-matter";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { alignNarration, extractBlocks, narrationTokens } from "../lib/mdx.ts";

const VOICE = "en-US-AndrewMultilingualNeural";
// 48 kbps CBR mono: clear for speech, and duration maths stay exact (ms = bytes / 6).
const FORMAT = OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3;
const BYTES_PER_MS = 48000 / 8 / 1000;
// One websocket request per segment keeps each request small enough that the
// service never truncates, and a dropped connection only costs one segment.
const SEGMENT_MAX_CHARS = 3000;

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, "md", "blog");
const OUT_DIR = path.join(ROOT, "public", "narration");

try {
  process.loadEnvFile(path.join(ROOT, ".env.local"));
} catch {
  // no .env.local — fine if the token is already in the environment
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const offline = args.includes("--offline") || args.includes("--local");
const onlySlugs = args.filter((a) => !a.startsWith("--"));

// ---- narration text extraction ------------------------------------------------
// Mirrors the client-side TreeWalker in blog-narrator.tsx: headings, paragraphs,
// list items and blockquotes are narrated; code (incl. inline), tables and
// images are not. Small tokenization differences are fine — the client aligns
// timing words to DOM words tolerantly.
// cleanMarkdown + extractBlocks are single-sourced from lib/mdx.ts (unified AST).

// ---- synthesis ----------------------------------------------------------------

const escapeXml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function groupSegments(blocks) {
  const segments = [];
  let cur = [];
  let len = 0;
  for (const block of blocks) {
    if (len > 0 && len + block.length > SEGMENT_MAX_CHARS) {
      segments.push(cur.join("\n\n"));
      cur = [];
      len = 0;
    }
    cur.push(block);
    len += block.length + 2;
  }
  if (cur.length) segments.push(cur.join("\n\n"));
  return segments;
}

function synthesizeSegment(text) {
  return new Promise((resolve, reject) => {
    const run = async () => {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(VOICE, FORMAT, { wordBoundaryEnabled: true });
      const { audioStream, metadataStream } = tts.toStream(escapeXml(text));
      const audio = [];
      const words = [];
      audioStream.on("data", (d) => audio.push(d));
      metadataStream?.on("data", (d) => {
        try {
          for (const entry of JSON.parse(d.toString()).Metadata || []) {
            if (entry.Type === "WordBoundary") {
              words.push({
                text: entry.Data.text.Text,
                startMs: entry.Data.Offset / 10000,
              });
            }
          }
        } catch {
          // malformed metadata frame — skip it
        }
      });
      await new Promise((res, rej) => {
        audioStream.on("end", res);
        audioStream.on("error", rej);
      });
      tts.close();
      const buf = Buffer.concat(audio);
      if (buf.length === 0) throw new Error("no audio received");
      return { audio: buf, words };
    };
    run().then(resolve, reject);
  });
}

async function withRetry(fn, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw lastErr;
}

// ---- per-post pipeline --------------------------------------------------------

async function saveAudio(slug, year, buffer) {
  // Local copy is kept unconditionally — it's a convenience backup, not the
  // source of truth, so it's gitignored and never blocks anything if missing.
  fs.mkdirSync(path.join(OUT_DIR, String(year)), { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, String(year), `${slug}.mp3`), buffer);
  if (offline) return `/narration/${year}/${slug}.mp3`;
  const { put } = await import("@vercel/blob");
  const blob = await put(`narration/${slug}.mp3`, buffer, {
    // Pinning the token skips @vercel/blob's OIDC auto-auth path, which this
    // linked project's Vercel dashboard doesn't have enabled for the
    // "development" environment and otherwise fails before BLOB_READ_WRITE_TOKEN
    // is ever tried.
    token: process.env.BLOB_READ_WRITE_TOKEN,
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "audio/mpeg",
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });
  return blob.url;
}

// The narration folder mirrors md/blog/<year>/, keyed off each post's own
// `date` frontmatter (matching how app/blog/[slug]/page.tsx picks the year it
// asks blog-narrator.tsx to fetch from), not the folder the .md happens to
// live in.
function yearOf(data) {
  const d = new Date(data.date);
  return isNaN(d.getTime()) ? "unknown" : d.getFullYear();
}

async function processPost(filePath) {
  const slug = path.basename(filePath).replace(/\.mdx?$/, "");
  if (onlySlugs.length && !onlySlugs.includes(slug)) return "skipped";

  const { data, content } = matter(fs.readFileSync(filePath, "utf8"));
  const year = yearOf(data);
  const blocks = extractBlocks(content);
  if (!blocks.length) return "skipped";

  const hash = crypto
    .createHash("sha256")
    .update(`${VOICE}|48k|${blocks.join("\n")}`)
    .digest("hex")
    .slice(0, 16);

  const yearDir = path.join(OUT_DIR, String(year));
  fs.mkdirSync(yearDir, { recursive: true });
  const jsonPath = path.join(yearDir, `${slug}.json`);
  const localMp3Path = path.join(yearDir, `${slug}.mp3`);
  if (!force && fs.existsSync(jsonPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      // A previously offline-only run must not satisfy a real (uploaded) run.
      const uploaded =
        typeof existing.audio === "string" && existing.audio.startsWith("http");
      if (existing.hash === hash && (offline || uploaded)) {
        // Fresh clones (or anyone else's machine) won't have the gitignored
        // local MP3 yet — backfill it from Blob instead of re-synthesizing.
        if (!offline && uploaded && !fs.existsSync(localMp3Path)) {
          try {
            const res = await fetch(existing.audio);
            if (res.ok) {
              fs.writeFileSync(
                localMp3Path,
                Buffer.from(await res.arrayBuffer())
              );
            }
          } catch {
            // best-effort only — narration still plays fine straight from Blob
          }
        }
        return "cached";
      }
    } catch {
      // unreadable manifest — regenerate
    }
  }

  const segments = groupSegments(blocks);
  const audioParts = [];
  const words = [];
  const starts = [];
  let baseMs = 0;
  for (const [i, segment] of segments.entries()) {
    process.stdout.write(`\r  ${slug}: segment ${i + 1}/${segments.length}   `);
    const result = await withRetry(() => synthesizeSegment(segment));
    for (const w of result.words) {
      words.push(w.text);
      starts.push(Math.round(baseMs + w.startMs));
    }
    audioParts.push(result.audio);
    baseMs += result.audio.length / BYTES_PER_MS;
  }
  process.stdout.write("\r");

  const audioBuf = Buffer.concat(audioParts);
  const audioUrl = await saveAudio(slug, year, audioBuf);

  // v2: `starts` is indexed by *source* token, not by TTS word. The service's
  // tokens do not line up with the article's — it splits hyphenated words,
  // merges others, and speaks expansions like "2026" as "twenty twenty-six" —
  // and resolving that used to be the browser's job on every page load.
  // alignNarration does it once, here, against the same token list
  // rehypeNarrate numbers into the HTML, so the player only reads an index.
  //
  // `ttsWords`/`ttsStarts` stay in the file even though nothing reads them at
  // runtime. They are the only inputs alignNarration needs, so keeping them
  // means a future change to the tokeniser can re-derive `starts` offline
  // (scripts/align-narrations.mjs) instead of re-synthesising every post and
  // invalidating every audio URL.
  const durationMs = Math.round(baseMs);
  const tokens = narrationTokens(content);
  const alignedStarts = alignNarration(tokens, words, starts, durationMs);

  fs.writeFileSync(
    jsonPath,
    JSON.stringify({
      v: 2,
      voice: VOICE,
      hash,
      audio: audioUrl,
      durationMs,
      count: tokens.length,
      starts: alignedStarts,
      ttsWords: words,
      ttsStarts: starts,
    })
  );
  const mins = (baseMs / 60000).toFixed(1);
  const mb = (audioBuf.length / 1024 / 1024).toFixed(1);
  console.log(
    `  ${slug}: ${mins} min, ${mb} MB, ${tokens.length} tokens (${words.length} tts words)`
  );
  return "generated";
}

// ---- pruning (posts removed from md/blog) --------------------------------------

async function pruneOrphans(currentSlugs) {
  let removed = 0;
  for (const yearDirName of fs.readdirSync(OUT_DIR)) {
    const yearDir = path.join(OUT_DIR, yearDirName);
    if (!fs.statSync(yearDir).isDirectory()) continue;

    for (const file of fs.readdirSync(yearDir)) {
      if (!file.endsWith(".json")) continue;
      const slug = file.replace(/\.json$/, "");
      if (currentSlugs.has(slug)) continue;

      const jsonPath = path.join(yearDir, file);
      try {
        const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
        if (
          !offline &&
          typeof data.audio === "string" &&
          data.audio.startsWith("http")
        ) {
          const { del } = await import("@vercel/blob");
          await del(data.audio, { token: process.env.BLOB_READ_WRITE_TOKEN });
        }
      } catch (err) {
        console.error(
          `  warning: could not delete Blob audio for removed post "${slug}": ${err.message}`
        );
      }
      fs.rmSync(jsonPath, { force: true });
      const mp3Path = path.join(yearDir, `${slug}.mp3`);
      if (fs.existsSync(mp3Path)) fs.rmSync(mp3Path, { force: true });
      console.log(`  removed narration for deleted post: ${slug}`);
      removed++;
    }

    if (fs.readdirSync(yearDir).length === 0) fs.rmdirSync(yearDir);
  }
  return removed;
}

// ---- main ---------------------------------------------------------------------

function listPosts(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(listPosts(p));
    else if (/\.mdx?$/.test(entry.name)) results.push(p);
  }
  return results;
}

async function main() {
  // Vercel's own build only needs the JSON manifests already committed by
  // the pre-commit hook (they point at audio already uploaded to Blob).
  // Re-running synthesis in that ephemeral build container would be slow,
  // redundant, and would break the deploy if the Blob token isn't also
  // configured as a Vercel project env var.
  if (process.env.VERCEL && !process.env.FORCE_NARRATION_SYNC) {
    console.log(
      "generate-narrations: skipping on Vercel build (uses committed manifests)."
    );
    return;
  }

  if (!offline && !process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn(
      "generate-narrations: BLOB_READ_WRITE_TOKEN is not set (env or .env.local)" +
        " — skipping narration sync.\n" +
        "  Set it up in the Vercel dashboard (Storage -> Blob), or run with\n" +
        "  --offline to test locally without uploading."
    );
    return;
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const posts = listPosts(BLOG_DIR);
  const currentSlugs = new Set(
    posts.map((p) => path.basename(p).replace(/\.mdx?$/, ""))
  );

  const counts = { generated: 0, cached: 0, skipped: 0, failed: 0 };
  for (const filePath of posts) {
    try {
      counts[await processPost(filePath)]++;
    } catch (err) {
      counts.failed++;
      console.error(`  ${path.basename(filePath)}: FAILED — ${err.message}`);
    }
  }

  // Pruning is based on the full current post list, so it only makes sense
  // on a full run — a targeted `<slug>` run must not delete unrelated posts.
  const removed = onlySlugs.length === 0 ? await pruneOrphans(currentSlugs) : 0;

  console.log(
    `\nDone: ${counts.generated} generated, ${counts.cached} cached, ` +
      `${counts.skipped} skipped, ${counts.failed} failed, ${removed} removed`
  );
  if (counts.failed) process.exit(1);
}

await main();
