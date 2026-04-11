import fs from "fs";
import assert from "node:assert";
import test from "node:test";
import path from "path";
import { readBySlug } from "../lib/md";

test("readBySlug prevents path traversal", () => {
  // We need to test if path traversal returns null
  // We also want to check if a valid file returns correctly, but we might not have guaranteed content in 'md/'
  // Let's create a dummy file for testing

  const testFolder = "test_folder";
  const testSlug = "test_file";
  const mdDir = path.join(process.cwd(), "md");
  const targetDir = path.join(mdDir, testFolder);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filePath = path.join(targetDir, `${testSlug}.md`);
  fs.writeFileSync(filePath, "---\ntitle: Test\n---\nHello World");

  // 1. Valid file should be read successfully
  const validResult = readBySlug(testFolder, testSlug);
  assert.ok(validResult, "Valid slug should return content");
  assert.strictEqual(
    validResult?.meta.title,
    "Test",
    "Frontmatter title should match"
  );

  // 2. Path traversal attack should return null
  const maliciousSlug = "../../../package";
  const invalidResult = readBySlug(testFolder, maliciousSlug);
  assert.strictEqual(
    invalidResult,
    null,
    "Path traversal slug should return null"
  );

  const maliciousFolder = "../";
  const invalidResult2 = readBySlug(maliciousFolder, "package");
  assert.strictEqual(
    invalidResult2,
    null,
    "Path traversal folder should return null"
  );

  // Cleanup
  fs.unlinkSync(filePath);
  fs.rmdirSync(targetDir);
});
