import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { footerLinks } from "../lib/config.ts";
import { i18n } from "../lib/i18n.ts";
import {
  aboutPage,
  developersPage,
  privacyPage,
  publicPageToMarkdown,
} from "../lib/public-page-content.ts";
import {
  trustEvidence,
  trustEvidenceToMarkdown,
} from "../lib/trust-evidence.ts";

function visibleCharacterCount(value: string): number {
  return value
    .replace(/[#*`\[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim().length;
}

test("the visible footer contains only About and Privacy", () => {
  assert.deepEqual(
    footerLinks.map((link) => [link.key, link.href]),
    [
      ["about", "/about"],
      ["privacy", "/privacy"],
    ]
  );
});

for (const [route, page] of [
  ["/about", aboutPage],
  ["/privacy", privacyPage],
  ["/developers", developersPage],
] as const) {
  test(`${route} has a substantial, structured trust document`, () => {
    const markdown = publicPageToMarkdown(page);
    assert.match(markdown, new RegExp(`^# ${page.title}`));
    assert.ok(page.sections.length >= 2);
    assert.ok(visibleCharacterCount(markdown) >= 500);
  });
}

test("agent instructions include when-to-use and calling guidance", async () => {
  const instructions = await readFile(
    new URL("../public/agent-instructions.md", import.meta.url),
    "utf8"
  );
  assert.match(instructions, /^# Agent instructions/m);
  assert.match(instructions, /^## When to use this site/m);
  assert.match(instructions, /^## How to read the site/m);
  assert.match(instructions, /Accept: text\/markdown/);
  assert.match(instructions, /\/contact/);
  assert.match(instructions, /\/credentials/);
  assert.match(instructions, /absence of fraud or scam search results/i);
  assert.match(instructions, /self-reported or unverified/i);
});

test("credentials page separates evidence from unsupported claims", () => {
  const markdown = trustEvidenceToMarkdown();
  assert.match(markdown, /^# Credentials and verification/m);
  assert.ok(visibleCharacterCount(markdown) >= 1500);
  assert.ok(trustEvidence.some((item) => item.level === "official-record"));
  assert.ok(trustEvidence.some((item) => item.level === "platform-record"));
  assert.ok(trustEvidence.some((item) => item.level === "self-reported"));
  assert.ok(trustEvidence.every((item) => item.limitation.length >= 80));
  assert.match(markdown, /github\.com\/Swpn0neel/);
  assert.match(markdown, /keploy\.io\/blog/);
  assert.match(markdown, /devpost\.com\/software\/the-magnificent-seven/);
  assert.match(markdown, /kalyanipublicschool\.org/);
  assert.doesNotMatch(markdown, /^## Known gaps/m);
  assert.match(markdown, /^## Next steps/m);
  assert.match(markdown, /Review the résumé/);
});

test("contact page preserves its concise original copy", () => {
  assert.equal(
    i18n.contactPage.intro,
    "Have a question or want to work together? I'm currently available for freelance work and I'm also open to full-time opportunities. You can reach out to me using the form below."
  );
  assert.equal(
    i18n.contactPage.bookCall.description,
    "Prefer to chat directly? Let's hop on a 30-minute discovery call to discuss your project or ideas."
  );
});

test("llms.txt discovers trust pages and developer resources", async () => {
  const llms = await readFile(
    new URL("../public/llms.txt", import.meta.url),
    "utf8"
  );
  assert.match(llms, /^## When to Use This Site/m);
  assert.match(llms, /https:\/\/www\.swapnoneel\.site\/developers/);
  assert.match(llms, /https:\/\/www\.swapnoneel\.site\/credentials/);
  assert.match(llms, /https:\/\/www\.swapnoneel\.site\/agent-instructions\.md/);
  assert.match(llms, /https:\/\/www\.swapnoneel\.site\/sitemap\.xml/);
});
