import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  developerResources,
  machineFiles,
  markdownSitePages,
  sitePages,
} from "../lib/site-manifest.ts";

function assertUnique(values: readonly string[], label: string) {
  assert.equal(new Set(values).size, values.length, `${label} must be unique`);
}

async function findStaticAppPages(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const routes: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("[") || entry.name.startsWith("(")) continue;

    const child = path.join(directory, entry.name);
    const childEntries = await readdir(child, { withFileTypes: true });
    if (childEntries.some((candidate) => candidate.name === "page.tsx")) {
      routes.push(
        `/${path.relative(path.join(process.cwd(), "app"), child).replaceAll("\\", "/")}`
      );
    }
    routes.push(...(await findStaticAppPages(child)));
  }

  return routes;
}

test("site manifest has unique page and resource identities", () => {
  assertUnique(
    sitePages.map((page) => page.key),
    "page keys"
  );
  assertUnique(
    sitePages.map((page) => page.path),
    "page paths"
  );
  assertUnique(
    developerResources.map((resource) => resource.key),
    "resource keys"
  );
  assertUnique(
    developerResources.map((resource) => resource.href),
    "resource URLs"
  );
});

test("every static app page is registered and every registered Markdown page exists", async () => {
  const appDirectory = path.join(process.cwd(), "app");
  const discovered = ["/", ...(await findStaticAppPages(appDirectory))].sort();
  const registered = markdownSitePages.map((page) => page.path).sort();
  assert.deepEqual(discovered, registered);
});

test("every internal developer resource points to a registered page or machine file", () => {
  const knownPaths: Set<string> = new Set([
    ...sitePages.map((page) => page.path),
    ...machineFiles.map((resource) => resource.href),
  ]);

  for (const resource of developerResources) {
    if (resource.href.startsWith("/")) {
      assert.ok(
        knownPaths.has(resource.href),
        `Unregistered resource: ${resource.href}`
      );
    }
  }
});
