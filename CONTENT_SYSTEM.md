# Content synchronization system

The site uses canonical sources plus generated indexes. Do not manually copy a
claim, route, project, or article into several files.

## Canonical sources

| Content                                      | Edit here                         |
| -------------------------------------------- | --------------------------------- |
| Blog posts                                   | `md/blog/**/*.md`                 |
| Work history                                 | `md/work/*.md`                    |
| Projects                                     | `md/projects/*.md`                |
| Skills, identity, links, and contact copy    | `lib/config.ts` and `lib/i18n.ts` |
| About, Privacy, and developer-page prose     | `lib/public-page-content.ts`      |
| Credentials and evidence limitations         | `lib/trust-evidence.ts`           |
| Static public routes and developer resources | `lib/site-manifest.ts`            |
| Stable agent guidance                        | `lib/agent-profile.ts`            |

The files `public/llms.txt`, `public/llms-full.txt`, and
`public/agent-instructions.md` are generated outputs. Do not edit them directly.

## Normal edits

- Add, edit, rename, hide, or remove a blog post, work entry, or project in its
  `md/` folder. The visible indexes, dynamic routes, sitemap, Markdown responses,
  and agent files all read that content.
- Edit profile facts once in `lib/config.ts` or `lib/i18n.ts`.
- Edit evidence once in `lib/trust-evidence.ts`.
- Run `npm run generate-agent-files` if you want to refresh generated files
  without doing a full build. Development and production builds also refresh
  them automatically.

## Adding or removing a static page

1. Add or remove its `app/<route>/page.tsx` implementation.
2. Add or remove the matching entry in `lib/site-manifest.ts`.
3. If `markdown: true`, add or remove its typed handler in
   `lib/markdown-representations.ts`.

TypeScript requires a Markdown handler for every registered Markdown page. The
test suite also compares the App Router filesystem with the manifest, so a page
cannot be added or removed on only one side.

## Drift protection

- `npm test` automatically regenerates derived agent files before running tests.
- `npm run content:doctor` repairs generated files, validates the route registry,
  and type-checks Markdown handler coverage in one command.
- `npm run content:doctor:json` performs the same repair and returns structured
  diagnostics for coding agents and other automation.
- `npm run check:agent-sync` fails when any generated agent file is stale.
- `npm run build` regenerates the files before compiling.
- Manifest tests reject duplicate routes, duplicate resources, unregistered
  static pages, and developer links that point to unknown internal resources.
- `.github/workflows/agent-content-sync.yml` runs the doctor after canonical
  content changes are pushed and commits regenerated agent files back to that
  branch when repository permissions allow it.
- `AGENTS.md` gives coding agents the same repair procedure and tells them when
  a factual or product decision must be escalated instead of invented.

The intended workflow is: edit one canonical source and run `npm test`. The
generated files repair themselves; commit the canonical change and repaired
outputs together.
