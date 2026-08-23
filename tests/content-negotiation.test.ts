import assert from "node:assert/strict";
import test from "node:test";
import {
  appendVaryAccept,
  canonicalPathFromMarkdown,
  markdownSiblingPath,
  preferredContentType,
} from "../lib/content-negotiation.ts";

test("defaults browsers and unconstrained clients to HTML", () => {
  assert.equal(preferredContentType(null), "text/html");
  assert.equal(preferredContentType("*/*"), "text/html");
  assert.equal(
    preferredContentType(
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
    ),
    "text/html"
  );
});

test("honors Markdown preference, q-values, specificity, and q=0", () => {
  assert.equal(preferredContentType("text/markdown"), "text/markdown");
  assert.equal(
    preferredContentType("text/markdown, text/html;q=0.8"),
    "text/markdown"
  );
  assert.equal(
    preferredContentType("text/markdown;q=0.3, text/html;q=0.9"),
    "text/html"
  );
  assert.equal(preferredContentType("text/html;q=0, */*;q=1"), "text/markdown");
  assert.equal(
    preferredContentType("text/markdown;q=0, text/html"),
    "text/html"
  );
});

test("returns null when no available representation is acceptable", () => {
  assert.equal(preferredContentType("application/pdf"), null);
  assert.equal(
    preferredContentType("text/html;q=0, text/markdown;q=0, */*;q=0"),
    null
  );
});

test("adds Accept to Vary without dropping existing cache dimensions", () => {
  const headers = new Headers({ Vary: "RSC, Accept-Encoding" });
  appendVaryAccept(headers);
  assert.equal(headers.get("Vary"), "RSC, Accept-Encoding, Accept");
  appendVaryAccept(headers);
  assert.equal(headers.get("Vary"), "RSC, Accept-Encoding, Accept");
});

test("maps canonical pages to discoverable Markdown siblings", () => {
  assert.equal(markdownSiblingPath("/"), "/index.md");
  assert.equal(markdownSiblingPath("/about"), "/about.md");
  assert.equal(markdownSiblingPath("/credentials"), "/credentials.md");
  assert.equal(canonicalPathFromMarkdown("/index.md"), "/");
  assert.equal(canonicalPathFromMarkdown("/blog/example.md"), "/blog/example");
  assert.equal(canonicalPathFromMarkdown("/about"), null);
});
