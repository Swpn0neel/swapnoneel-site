// Captures the heading-id contract from the LIVE production site into
// scripts/heading-ids.fixture.json.
//
// Every `#anchor` that works on www.swapnoneel.site today is a URL that search
// engines have indexed and that other people's links point at. The Astro
// migration changes how those ids are generated — from a hand-rolled
// generateSlug() to github-slugger, which Astro applies automatically — so the
// fixture is what turns "I measured it once and it matched" into a build-time
// guarantee. scripts/verify-heading-ids.mjs asserts against it.
//
// Deliberately scraped from production rather than re-derived from the
// markdown: a re-derivation can only prove that two implementations of my own
// understanding agree, which is not the same as matching what is live.
//
// Only re-run this when the contract is intentionally being reset (i.e. you
// have decided some anchor should change). Re-running it after an accidental
// regression would silently bless the regression.
//
//   node scripts/capture-heading-ids.mjs

import fs from "node:fs";
import path from "node:path";

const BASE = "https://www.swapnoneel.site";
const CONTENT = fs.existsSync("src/content/blog") ? "src/content/blog" : "md/blog";
const OUT = "scripts/heading-ids.fixture.json";

const slugs = fs
  .readdirSync(CONTENT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) =>
    fs
      .readdirSync(path.join(CONTENT, d.name))
      .filter((f) => /\.mdx?$/.test(f))
      .map((f) => f.replace(/\.mdx?$/, ""))
  )
  .sort();

const out = {};
let ok = 0;
const failed = [];

for (const slug of slugs) {
  const res = await fetch(`${BASE}/blog/${slug}`);
  if (!res.ok) {
    failed.push(`${slug} (${res.status})`);
    continue;
  }
  const html = await res.text();
  out[slug] = [...html.matchAll(/<h[1-6][^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
  ok++;
  process.stderr.write(`\r  fetched ${ok}/${slugs.length}`);
}
process.stderr.write("\n");

if (failed.length) {
  console.error(`refusing to write a partial fixture; failed: ${failed.join(", ")}`);
  process.exit(1);
}

const total = Object.values(out).reduce((n, a) => n + a.length, 0);
fs.writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
console.error(`wrote ${OUT}: ${ok} posts, ${total} heading ids`);
