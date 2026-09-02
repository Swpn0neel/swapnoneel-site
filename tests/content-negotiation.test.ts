import assert from "node:assert/strict";
import test from "node:test";
import {
  acceptsMarkdownOnly,
  canonicalPathFromMarkdown,
  isNegotiablePagePath,
  markdownSiblingPath,
} from "../lib/content-negotiation.ts";

test("browsers and unconstrained clients keep HTML", () => {
  assert.equal(acceptsMarkdownOnly(null), false);
  assert.equal(acceptsMarkdownOnly("*/*"), false);
  assert.equal(
    acceptsMarkdownOnly(
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
    ),
    false
  );
});

test("clients asking only for Markdown get Markdown", () => {
  assert.equal(acceptsMarkdownOnly("text/markdown"), true);
  assert.equal(acceptsMarkdownOnly("text/markdown, */*;q=0.1"), true);
  assert.equal(acceptsMarkdownOnly("text/markdown;q=0.9, text/plain"), true);
});

test("a client that also lists HTML gets HTML", () => {
  assert.equal(acceptsMarkdownOnly("text/markdown, text/html;q=0.8"), false);
  assert.equal(acceptsMarkdownOnly("text/html, text/markdown"), false);
});

test("q=0 rejects a representation", () => {
  // Markdown explicitly rejected: HTML even though the token appears.
  assert.equal(acceptsMarkdownOnly("text/markdown;q=0, */*;q=1"), false);
  assert.equal(acceptsMarkdownOnly("text/markdown;q=0.0, text/html"), false);
  // HTML explicitly rejected: Markdown, whether asked for by name or wildcard.
  assert.equal(acceptsMarkdownOnly("text/markdown, text/html;q=0"), true);
  assert.equal(acceptsMarkdownOnly("text/html;q=0, text/markdown"), true);
  assert.equal(acceptsMarkdownOnly("text/html;q=0, */*;q=1"), true);
  assert.equal(acceptsMarkdownOnly("text/html;q=0, text/*"), true);
  // Both rejected, or nothing usable: HTML, the default representation.
  assert.equal(
    acceptsMarkdownOnly("text/html;q=0, text/markdown;q=0, */*;q=0"),
    false
  );
  // A low but non-zero q is still acceptance.
  assert.equal(acceptsMarkdownOnly("text/markdown;q=0.01, text/html"), false);
  assert.equal(acceptsMarkdownOnly("text/html;q=0.01, */*"), false);
});

test("q=0 is recognised after media-type parameters", () => {
  // The weight follows any parameters on the range (RFC 9110 §12.4.2).
  assert.equal(
    acceptsMarkdownOnly("text/markdown;charset=utf-8;q=0, */*;q=1"),
    false
  );
  assert.equal(
    acceptsMarkdownOnly("text/markdown, text/html;charset=utf-8;q=0"),
    true
  );
  assert.equal(
    acceptsMarkdownOnly("text/html;level=1;charset=utf-8;q=0, */*"),
    true
  );
  // Anything after the weight is an accept extension, not a parameter.
  assert.equal(acceptsMarkdownOnly("text/markdown;q=0;ext=1, */*"), false);
  // A parameter with no weight is still plain acceptance.
  assert.equal(
    acceptsMarkdownOnly("text/markdown;charset=utf-8, text/html;q=0.5"),
    false
  );
  assert.equal(acceptsMarkdownOnly("text/markdown;charset=utf-8"), true);
});

test("negotiation applies to page paths only", () => {
  assert.equal(isNegotiablePagePath("/about"), true);
  assert.equal(isNegotiablePagePath("/work/bifrost"), true);
  assert.equal(isNegotiablePagePath("/blog/some-post"), true);
  assert.equal(isNegotiablePagePath("/api/markdown"), false);
  assert.equal(isNegotiablePagePath("/_next/static/chunks/a.js"), false);
  assert.equal(isNegotiablePagePath("/robots.txt"), false);
  assert.equal(isNegotiablePagePath("/index.md"), false);
});

test("maps canonical pages to discoverable Markdown siblings", () => {
  assert.equal(markdownSiblingPath("/"), "/index.md");
  assert.equal(markdownSiblingPath("/about"), "/about.md");
  assert.equal(markdownSiblingPath("/credentials"), "/credentials.md");
  assert.equal(canonicalPathFromMarkdown("/index.md"), "/");
  assert.equal(canonicalPathFromMarkdown("/blog/example.md"), "/blog/example");
  assert.equal(canonicalPathFromMarkdown("/about"), null);
});
