import { execSync } from "child_process";
import fs from "fs";
import matter from "gray-matter";

// Determine if we are inside a git repository
try {
  execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
} catch {
  console.log(
    "Not a git repository or git is not installed. Skipping automatic blog update checks."
  );
  process.exit(0);
}

// Custom stable stringifier to compare metadata regardless of key order
function stableStringify(obj) {
  if (!obj || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return "[" + obj.map(stableStringify).join(",") + "]";
  }
  const keys = Object.keys(obj).sort();
  const parts = keys.map(
    (k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`
  );
  return "{" + parts.join(",") + "}";
}

try {
  // Get git status of files in md/blog
  const statusOutput = execSync("git status --porcelain -- md/blog", {
    encoding: "utf8",
  });
  const lines = statusOutput
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    console.log("No blog posts modified. Skipping update checks.");
    process.exit(0);
  }

  const currentDate = new Date();
  const currentDateString = currentDate.toISOString().slice(0, 10); // YYYY-MM-DD

  for (const line of lines) {
    const status = line.slice(0, 2);
    let relativePath = line.slice(2).trim();
    if (relativePath.startsWith('"') && relativePath.endsWith('"')) {
      relativePath = relativePath.slice(1, -1);
    }

    // Ignore deleted files
    if (status.includes("D")) continue;
    if (!relativePath.endsWith(".md") && !relativePath.endsWith(".mdx"))
      continue;

    if (!fs.existsSync(relativePath)) continue;

    const currentRaw = fs.readFileSync(relativePath, "utf8");
    let parsedCurrent;
    try {
      parsedCurrent = matter(currentRaw);
    } catch (e) {
      console.warn(
        `[Warning] Failed to parse frontmatter of ${relativePath}: ${e.message}`
      );
      continue;
    }

    const currentData = { ...parsedCurrent.data };
    const currentBody = parsedCurrent.content.trim();

    // Check if the file exists in HEAD to compare changes
    let headContent = null;
    try {
      // Normalize slashes for git on Windows
      const gitPath = relativePath.replace(/\\/g, "/");
      headContent = execSync(`git show HEAD:${gitPath}`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
    } catch {
      // File doesn't exist in HEAD (untracked/newly added)
    }

    let hasChanged = false;

    if (headContent === null) {
      // New file is considered changed
      hasChanged = true;
    } else {
      let parsedHead;
      try {
        parsedHead = matter(headContent);
      } catch {
        // If HEAD can't be parsed, treat as changed
        hasChanged = true;
      }

      if (parsedHead) {
        const headData = { ...parsedHead.data };
        const headBody = parsedHead.content.trim();

        // Exclude the 'updated' parameter from comparison
        delete currentData.updated;
        delete headData.updated;

        const metadataChanged =
          stableStringify(currentData) !== stableStringify(headData);
        const bodyChanged = currentBody !== headBody;

        hasChanged = metadataChanged || bodyChanged;
      }
    }

    // If there are actual changes to content/metadata
    if (hasChanged) {
      const publishedDateVal = parsedCurrent.data.date;
      if (!publishedDateVal) {
        console.warn(
          `[Warning] Missing 'date' (published date) in frontmatter for: ${relativePath}`
        );
        continue;
      }

      const pubDate = new Date(publishedDateVal);
      if (isNaN(pubDate.getTime())) {
        console.warn(
          `[Warning] Invalid 'date' in frontmatter for: ${relativePath} (${publishedDateVal})`
        );
        continue;
      }

      const pubDateString = pubDate.toISOString().slice(0, 10); // YYYY-MM-DD

      if (pubDateString === currentDateString) {
        // If published today, remove/clear 'updated' parameter to keep clean
        if (parsedCurrent.data.updated) {
          delete parsedCurrent.data.updated;
          const updatedFileContent = matter.stringify(
            parsedCurrent.content,
            parsedCurrent.data
          );
          fs.writeFileSync(relativePath, updatedFileContent, "utf8");
          console.log(
            `[Updated] Cleared 'updated' parameter for today's new post: ${relativePath}`
          );
        }
      } else {
        // Published on a different day. We should check if 'updated' date is not already today.
        const currentUpdated = parsedCurrent.data.updated;
        let currentUpdatedDateString = null;
        if (currentUpdated) {
          const updDate = new Date(currentUpdated);
          if (!isNaN(updDate.getTime())) {
            currentUpdatedDateString = updDate.toISOString().slice(0, 10);
          }
        }

        if (currentUpdatedDateString !== currentDateString) {
          // Update timestamp to the current ISO timestamp
          parsedCurrent.data.updated = currentDate.toISOString();
          const updatedFileContent = matter.stringify(
            parsedCurrent.content,
            parsedCurrent.data
          );
          fs.writeFileSync(relativePath, updatedFileContent, "utf8");
          console.log(
            `[Updated] Set 'updated' timestamp to ${parsedCurrent.data.updated} for: ${relativePath}`
          );
        }
      }
    }
  }
} catch (error) {
  console.error("Error executing update-blog-dates script:", error);
  process.exit(1);
}
