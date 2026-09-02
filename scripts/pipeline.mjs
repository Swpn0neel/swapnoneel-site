import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const isDev = args.includes("--dev");
const isBuild = args.includes("--build");
const force = args.includes("--force");

// These run concurrently, which is only safe because none of them reads another's
// output. Worth keeping true: generate-blur scans public/{work,project,img},
// generate-ui-images reads public/{img,work} and writes public/ui-img, and
// generate-palette public/project — the *source* images, not the encoded
// public/{blog-img,project-img} the heavy scripts write — while
// generate-agent-files reads canonical content sources only. A new
// script that consumes one of these outputs belongs after the batch, next to
// align-narrations, not in it.
const fastScripts = [
  "scripts/generate-blur.mjs",
  "scripts/generate-ui-images.mjs",
  "scripts/generate-palette.mjs",
  "scripts/generate-agent-files.mjs",
];

const heavyScripts = [
  "scripts/generate-project-images.mjs",
  "scripts/mirror-blog-images.mjs",
  "scripts/generate-narrations.mjs",
];

// Must follow generate-narrations: it re-indexes that script's output from TTS
// tokens to source tokens, which is what rehypeNarrate's data-nwi refers to.
// Cheap and idempotent, so it runs unconditionally even when narration was
// skipped as up to date — a manifest written before this step existed still
// gets upgraded.
const afterNarration = "scripts/align-narrations.mjs";

function run(script) {
  // Scripts that import a .ts module from lib/ need type stripping. Listed
  // explicitly rather than sniffed from the filename, which was easy to get
  // subtly wrong as scripts gained imports.
  const NEEDS_STRIP_TYPES = new Set([
    "scripts/generate-agent-files.mjs",
    "scripts/generate-narrations.mjs",
    "scripts/align-narrations.mjs",
    "scripts/mirror-blog-images.mjs",
    "scripts/generate-project-images.mjs",
    "scripts/generate-ui-images.mjs",
  ]);
  const cmdArgs =
    NEEDS_STRIP_TYPES.has(script) || script.endsWith(".ts")
      ? ["--experimental-strip-types", script]
      : [script];
  return new Promise((resolve, reject) => {
    const child = spawn("node", cmdArgs, { stdio: "inherit" });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${script} exited ${code}`));
    });
    child.on("error", reject);
  });
}

function newestMtime(dir, depth = 6) {
  let newest = 0;
  function walk(d, lvl) {
    if (lvl < 0) return;
    let entries;
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = path.join(d, e.name);
      try {
        const s = fs.statSync(p);
        if (s.mtimeMs > newest) newest = s.mtimeMs;
        if (e.isDirectory()) walk(p, lvl - 1);
      } catch {}
    }
  }
  walk(dir, depth);
  return newest;
}

function mtimeOf(file) {
  try {
    return fs.statSync(file).mtimeMs;
  } catch {
    return 0;
  }
}

function needsMirror() {
  if (force) return true;
  const manifest = path.join(process.cwd(), "lib", "blog-images.json");
  const m = mtimeOf(manifest);
  if (!m) return true;
  const mdNew = newestMtime(path.join(process.cwd(), "md", "blog"));
  const assetsNew = newestMtime(path.join(process.cwd(), "assets", "blog-img"));
  return mdNew > m || assetsNew > m;
}

function needsProjectImages() {
  if (force) return true;
  const manifest = path.join(process.cwd(), "lib", "project-images.json");
  const m = mtimeOf(manifest);
  if (!m) return true;
  const srcNew = newestMtime(path.join(process.cwd(), "public", "project"));
  const outMissing = (() => {
    try {
      const out = path.join(process.cwd(), "public", "project-img");
      const files = fs.readdirSync(out);
      return files.length === 0;
    } catch {
      return true;
    }
  })();
  if (outMissing) return true;
  return srcNew > m;
}

function needsNarrations() {
  if (force) return true;
  const outDir = path.join(process.cwd(), "public", "narration");
  if (!fs.existsSync(outDir)) return true;
  const mdNew = newestMtime(path.join(process.cwd(), "md", "blog"));
  const jsonNew = newestMtime(outDir);
  // if md newer than latest narration json, regenerate
  return mdNew > jsonNew;
}

// Velite, awaited, before anything else. lib/md.ts imports `.velite/*.json` at
// module load, so the content layer has to exist before Next resolves a single
// module — and `clean` in velite.config.ts deletes the directory before
// rewriting it. Starting this from next.config.ts instead left that window
// unguarded on every build: nothing awaited it, and a cold Velite run measured
// ~13.6s against a compile that finishes in ~7s.
// In-process rather than spawning node_modules/.bin/velite: Node refuses to
// spawn a .cmd shim without a shell on Windows (EINVAL), and awaiting the API
// is what this needs anyway.
async function runVelite() {
  const { build } = await import("velite");
  await build({ clean: true });
}

const t0 = Date.now();
console.log(
  `[pipeline] mode=${isDev ? "dev" : isBuild ? "build" : "default"}${force ? " --force" : ""}`
);
console.log("[pipeline] velite (serial, content layer)...");
await runVelite();
console.log("[pipeline] update-blog-dates (serial, mutates md)...");
await run("scripts/update-blog-dates.mjs");
console.log(
  `[pipeline] update-blog-dates done in ${((Date.now() - t0) / 1000).toFixed(1)}s`
);

let toRun = [...fastScripts];
let heavy = [];

if (isDev) {
  if (needsProjectImages()) heavy.push("scripts/generate-project-images.mjs");
  else console.log("[pipeline] skip generate-project-images (up to date)");
  if (needsMirror()) heavy.push("scripts/mirror-blog-images.mjs");
  else console.log("[pipeline] skip mirror-blog-images (up to date)");
  if (needsNarrations()) heavy.push("scripts/generate-narrations.mjs");
  else console.log("[pipeline] skip generate-narrations (up to date)");
  toRun.push(...heavy);
} else {
  // build or default: run all (prebuild stays full)
  toRun.push(...heavyScripts);
}

const t1 = Date.now();
console.log(`[pipeline] running ${toRun.length} scripts in parallel...`);
try {
  await Promise.all(toRun.map(run));
  console.log(
    `[pipeline] parallel batch done in ${((Date.now() - t1) / 1000).toFixed(1)}s`
  );
  console.log(
    "[pipeline] align-narrations (serial, reads narration output)..."
  );
  await run(afterNarration);
  console.log(`[pipeline] total ${((Date.now() - t0) / 1000).toFixed(1)}s`);
} catch (err) {
  console.error("[pipeline] failed", err);
  process.exit(1);
}
