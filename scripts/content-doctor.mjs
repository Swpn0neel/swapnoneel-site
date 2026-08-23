import { spawnSync } from "node:child_process";
import path from "node:path";

const jsonOutput = process.argv.includes("--json");

const steps = [
  {
    key: "generate",
    description: "Regenerate agent-facing files from canonical sources",
    command: process.execPath,
    args: ["--experimental-strip-types", "scripts/generate-agent-files.mjs"],
  },
  {
    key: "manifest",
    description: "Validate route, resource, and filesystem synchronization",
    command: process.execPath,
    args: [
      "--experimental-strip-types",
      "--test",
      "tests/site-manifest.test.ts",
    ],
  },
  {
    key: "types",
    description: "Require a Markdown handler for every registered page",
    command: process.execPath,
    args: [
      path.join("node_modules", "typescript", "bin", "tsc"),
      "--noEmit",
      "--incremental",
      "false",
    ],
  },
];

const results = [];

for (const step of steps) {
  const result = spawnSync(step.command, step.args, {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: false,
  });
  const record = {
    key: step.key,
    description: step.description,
    status: result.status ?? 1,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
  results.push(record);

  if (!jsonOutput) {
    console.log(
      `[content-doctor] ${record.status === 0 ? "ok" : "failed"}: ${step.description}`
    );
    if (record.stdout) console.log(record.stdout);
    if (record.stderr) console.error(record.stderr);
  }

  if (record.status !== 0) break;
}

const ok =
  results.length === steps.length && results.every((step) => step.status === 0);

if (jsonOutput) {
  const repaired = /^Updated \d+ agent file/m.test(results[0]?.stdout ?? "");
  console.log(JSON.stringify({ ok, repaired, steps: results }, null, 2));
}

process.exit(ok ? 0 : 1);
