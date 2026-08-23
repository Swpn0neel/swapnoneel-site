# Content maintenance instructions for coding agents

When changing public content, routes, profile facts, evidence, or agent-facing
resources, follow the synchronization contract in `CONTENT_SYSTEM.md`.

## Required workflow

1. Edit the canonical source. Never edit `public/llms.txt`,
   `public/llms-full.txt`, or `public/agent-instructions.md` directly.
2. Run `pnpm content:doctor`. It regenerates derived agent files, validates the
   route registry against the App Router filesystem, and type-checks Markdown
   handler coverage.
3. Run `pnpm test` after any repair.
4. Commit canonical changes and regenerated public files together.

For machine-readable diagnostics, run `pnpm content:doctor:json`.

## Failure handling

- A stale generated file is repaired automatically. Do not hand-edit it.
- An unregistered static page requires an entry in `lib/site-manifest.ts`.
- A registered `markdown: true` page requires a handler in
  `lib/markdown-representations.ts`.
- A removed page must also be removed from `lib/site-manifest.ts` and its
  Markdown handler map.
- A developer resource must point to a registered page, a registered machine
  file, or an intentional external URL.

Do not invent claims, credentials, testimonials, prices, client outcomes, or
page copy to make a check pass. Stop and request product input when a repair
requires new factual content or a user-facing decision.
