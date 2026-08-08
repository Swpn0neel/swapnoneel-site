// Asserts that every heading anchor that worked on the live site still works
// in the Astro build. Run after `astro build`.
//
//   node scripts/verify-heading-ids.mjs
//
// The check is set containment, not an exact match: every id in the fixture
// must exist in the built page. Gaining ids is fine (Astro's TOC surfaces
// headings the old regex-based one could not see); losing one is a broken
// inbound link and fails the build.
//
// KNOWN_EXTRA records the one place production is knowingly wrong. See below.

import fs from "node:fs";
import path from "node:path";

const FIXTURE = "scripts/heading-ids.fixture.json";
const DIST = "dist/blog";

/**
 * Production renders duplicate headings with duplicate ids — invalid HTML, and
 * every table-of-contents link for the repeats jumps to the first one. Astro
 * de-duplicates via github-slugger, so the 2nd and 3rd "Syntax" become
 * `syntax-1` and `syntax-2`.
 *
 * This is a fix, and it is safe: `#syntax` still resolves to the same first
 * heading it always did, so no existing inbound link changes destination. The
 * containment check passes unchanged; this note exists so the next person to
 * read a diff of this file knows the extra ids are intended.
 */
const KNOWN_NEW_IDS = {
  "the-3-most-powerful-functions-in-javascript": [
    "syntax-1",
    "syntax-2",
    "example-1",
    "example-2",
  ],
};

if (!fs.existsSync(DIST)) {
  console.error(`${DIST} not found — run \`astro build\` first.`);
  process.exit(1);
}

const fixture = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));
const problems = [];
let checked = 0;

for (const [slug, expected] of Object.entries(fixture)) {
  // Astro writes either dist/blog/<slug>/index.html or dist/blog/<slug>.html
  // depending on build.format; accept both.
  const candidates = [
    path.join(DIST, slug, "index.html"),
    path.join(DIST, `${slug}.html`),
  ];
  const file = candidates.find((p) => fs.existsSync(p));
  if (!file) {
    problems.push(`MISSING PAGE  /blog/${slug}`);
    continue;
  }

  const html = fs.readFileSync(file, "utf8");
  const actual = new Set(
    [...html.matchAll(/<h[1-6][^>]*\sid="([^"]+)"/g)].map((m) => m[1])
  );

  for (const id of new Set(expected)) {
    checked++;
    if (!actual.has(id)) {
      problems.push(`BROKEN ANCHOR /blog/${slug}#${id}`);
    }
  }

  const unexpected = [...actual].filter(
    (id) => !expected.includes(id) && !(KNOWN_NEW_IDS[slug] ?? []).includes(id)
  );
  if (unexpected.length) {
    console.warn(`  note: /blog/${slug} gained ${unexpected.join(", ")}`);
  }
}

if (problems.length) {
  console.error(`\n${problems.length} heading-id regression(s):\n`);
  problems.forEach((p) => console.error(`  ${p}`));
  process.exit(1);
}

console.log(
  `heading ids OK — ${checked} anchors across ${Object.keys(fixture).length} posts`
);
