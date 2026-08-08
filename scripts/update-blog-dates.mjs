// Keeps the `updated` frontmatter field in step with real edits to a post.
//
// Runs from predev/prebuild. For every post git reports as changed, it compares
// the working copy against the committed one and stamps `updated` only when the
// body or the metadata actually differs.
//
// Two things this script has to be careful about, both learned the hard way
// during the Astro migration:
//
//   1. A moved file is not an edited file. When md/blog was renamed to
//      src/content/blog, `git show HEAD:<new path>` failed for all 45 posts, so
//      every one of them looked brand new and got a fresh `updated` stamp. The
//      guard is now content-based: if a file's blob hash appears anywhere in
//      HEAD, its bytes are already committed somewhere and nothing was edited,
//      whatever its path is now.
//
//   2. Rewriting frontmatter through matter.stringify() re-serialises the whole
//      YAML block -- it re-quotes strings and reflows long ones -- so a
//      one-field change produced a diff touching every line of every header.
//      Writes are line-level now: only the `updated:` line is touched, and the
//      rest of the file is returned byte for byte.

import { execSync } from "node:child_process";
import fs from "node:fs";
import matter from "gray-matter";

const BLOG_DIR = "src/content/blog";

function git(command, options = {}) {
  return execSync(command, { encoding: "utf8", ...options });
}

try {
  git("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
} catch {
  console.log("Not a git repository. Skipping automatic blog update checks.");
  process.exit(0);
}

/** Metadata comparison that ignores key order. */
function stableStringify(value) {
  if (!value || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`)
    .join(",")}}`;
}

/**
 * Every blob hash reachable from HEAD. Membership means "these exact bytes are
 * already committed", which is what distinguishes a move from an edit.
 */
function headBlobHashes() {
  const out = git("git ls-tree -r HEAD --format=%(objectname)");
  return new Set(out.split("\n").map((l) => l.trim()).filter(Boolean));
}

function blobHash(file) {
  return git(`git hash-object -- "${file}"`).trim();
}

/**
 * Paths git reports as changed under BLOG_DIR. Porcelain v1 pads the status to
 * two columns, so the line must not be trimmed before slicing, and a rename is
 * reported as `old -> new` -- we want the destination.
 */
function changedPaths() {
  const out = git(`git status --porcelain -- ${BLOG_DIR}`);
  const paths = [];
  for (const line of out.split("\n")) {
    if (!line.trim()) continue;
    const status = line.slice(0, 2);
    if (status.includes("D")) continue;

    let file = line.slice(3).trim();
    const arrow = file.indexOf(" -> ");
    if (arrow !== -1) file = file.slice(arrow + 4).trim();
    if (file.startsWith('"') && file.endsWith('"')) file = file.slice(1, -1);

    if (/\.mdx?$/.test(file) && fs.existsSync(file)) paths.push(file);
  }
  return paths;
}

/**
 * Sets, replaces or (with `value === null`) removes a single scalar key inside
 * the frontmatter block, leaving every other byte of the file alone. Returns
 * null if the file has no frontmatter block to edit.
 */
function editFrontmatterLine(raw, key, value) {
  const newline = raw.includes("\r\n") ? "\r\n" : "\n";
  const lines = raw.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return null;

  const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (end === -1) return null;

  const keyPattern = new RegExp(`^${key}\\s*:`);
  const index = lines.findIndex((l, i) => i > 0 && i < end && keyPattern.test(l));

  if (value === null) {
    if (index === -1) return raw;
    lines.splice(index, 1);
  } else if (index === -1) {
    // New key goes directly under `date:`, where a reader expects to find it.
    const dateIndex = lines.findIndex((l, i) => i > 0 && i < end && /^date\s*:/.test(l));
    lines.splice(dateIndex === -1 ? 1 : dateIndex + 1, 0, `${key}: "${value}"`);
  } else {
    // Keep whichever quote style the file already uses on this line.
    const quote = /:\s*'/.test(lines[index]) ? "'" : '"';
    lines[index] = `${key}: ${quote}${value}${quote}`;
  }

  return lines.join(newline);
}

const today = new Date();
const todayString = today.toISOString().slice(0, 10);

let stamped = 0;
let cleared = 0;
let skippedAsMoved = 0;

try {
  const paths = changedPaths();
  if (paths.length === 0) {
    console.log("No blog posts modified. Skipping update checks.");
    process.exit(0);
  }

  const committedBlobs = headBlobHashes();

  for (const file of paths) {
    // A move, a copy, or a re-add of already-committed bytes. Not an edit.
    if (committedBlobs.has(blobHash(file))) {
      skippedAsMoved++;
      continue;
    }

    const raw = fs.readFileSync(file, "utf8");
    let current;
    try {
      current = matter(raw);
    } catch (error) {
      console.warn(`[Warning] Unparseable frontmatter in ${file}: ${error.message}`);
      continue;
    }

    // Compare against the same path in HEAD when it exists. A file that is
    // genuinely new has no HEAD copy and counts as changed.
    let headRaw = null;
    try {
      headRaw = git(`git show HEAD:${file.replace(/\\/g, "/")}`, {
        stdio: ["pipe", "pipe", "ignore"],
      });
    } catch {
      /* not in HEAD at this path */
    }

    let changed = true;
    if (headRaw !== null) {
      try {
        const head = matter(headRaw);
        const a = { ...current.data };
        const b = { ...head.data };
        delete a.updated;
        delete b.updated;
        changed =
          stableStringify(a) !== stableStringify(b) ||
          current.content.trim() !== head.content.trim();
      } catch {
        changed = true;
      }
    }
    if (!changed) continue;

    const published = new Date(current.data.date);
    if (!current.data.date || Number.isNaN(published.getTime())) {
      console.warn(`[Warning] Missing or invalid 'date' in frontmatter for: ${file}`);
      continue;
    }

    if (published.toISOString().slice(0, 10) === todayString) {
      // Published today: an `updated` stamp would be noise.
      if (current.data.updated === undefined) continue;
      const next = editFrontmatterLine(raw, "updated", null);
      if (next === null || next === raw) continue;
      fs.writeFileSync(file, next, "utf8");
      cleared++;
      console.log(`[Updated] Cleared 'updated' on today's post: ${file}`);
      continue;
    }

    const existing = current.data.updated ? new Date(current.data.updated) : null;
    const alreadyToday =
      existing && !Number.isNaN(existing.getTime()) &&
      existing.toISOString().slice(0, 10) === todayString;
    if (alreadyToday) continue;

    const next = editFrontmatterLine(raw, "updated", today.toISOString());
    if (next === null) {
      console.warn(`[Warning] No frontmatter block to edit in: ${file}`);
      continue;
    }
    fs.writeFileSync(file, next, "utf8");
    stamped++;
    console.log(`[Updated] Set 'updated' to ${today.toISOString()} for: ${file}`);
  }

  const parts = [`${stamped} stamped`, `${cleared} cleared`];
  if (skippedAsMoved) parts.push(`${skippedAsMoved} unchanged (moved, not edited)`);
  console.log(`Blog dates: ${parts.join(", ")}.`);
} catch (error) {
  console.error("Error executing update-blog-dates script:", error);
  process.exit(1);
}
