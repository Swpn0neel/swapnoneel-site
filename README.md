# swapnoneel saha — personal site

A minimal personal portfolio built with **Next.js 15**, **Tailwind CSS v4**, and **shadcn/ui**. Content is managed through Markdown files in the `md/` folder — no CMS, no database.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (new-york, neutral) |
| Content | Markdown files parsed with `gray-matter` + `next-mdx-remote` |
| Package manager | pnpm |
| Carousel | embla-carousel-react |
| Syntax highlighting | rehype-highlight |
| Deployment | Vercel (recommended) |

---

## Prerequisites

Make sure you have these installed:

- **Node.js** v18 or higher — [install here](https://nodejs.org/)
- **pnpm** — install with `npm install -g pnpm`
- **Git** — [install here](https://git-scm.com/)

---

## Setup & Running Locally

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# 2. Install dependencies
pnpm install

# 3. Run the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## File Structure

```
swapnoneel-site/
├── app/                        # Next.js App Router pages
│   ├── globals.css             # Global styles + Tailwind
│   ├── layout.tsx              # Root layout (navbar, footer)
│   ├── page.tsx                # Home page
│   ├── not-found.tsx           # 404 page
│   ├── blog/
│   │   ├── page.tsx            # Blog listing (grouped by year)
│   │   └── [slug]/
│   │       └── page.tsx        # Individual blog post
│   └── work/
│       ├── page.tsx            # Work page (experience + projects)
│       └── [slug]/
│           └── page.tsx        # Individual work/project detail
│
├── components/
│   ├── navbar.tsx              # Top navigation bar
│   └── carousel.tsx            # Auto-scrolling image carousel
│
├── lib/
│   ├── md.ts                   # Markdown reading utilities
│   └── utils.ts                # shadcn cn() helper
│
├── md/                         # ← ALL YOUR CONTENT LIVES HERE
│   ├── blog/                   # Blog post .md files
│   │   ├── getting-started-with-python.md
│   │   ├── what-is-rag.md
│   │   └── ...
│   ├── work/                   # Experience entries
│   │   ├── keploy.md
│   │   ├── tutorials-point.md
│   │   └── ...
│   └── projects/               # Project entries
│       ├── toile.md
│       ├── get-response.md
│       └── ...
│
├── public/
│   └── img/
│       └── pfp.png             # ← Add your profile photo here
│
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts (auto-detected by v4)
├── tsconfig.json
├── components.json             # shadcn/ui config
└── .prettierrc.json
```

---

## Customising Content

### Adding / Editing Your Profile Photo

Replace `public/img/pfp.png` with your own photo. Keep it square, ~200×200px minimum.

### Adding a Blog Post

Create a new `.md` file in `md/blog/`:

```md
---
title: "Your Post Title"
date: "2025-01-15"
description: "A short description shown in previews."
---

Your content here in **Markdown**.
```

The blog listing page automatically picks it up and groups it by year.

### Adding a Work Experience Entry

Create a new `.md` file in `md/work/`:

```md
---
title: "Role — Company (Read more)"
date: "Jan 2025 - Present"
description: "Short description of what you did."
cover: "https://link-to-company-logo.png"
---

## Company Name — Your Role

Full description in Markdown...
```

If the experience should link to an external site instead of a detail page, add:

```md
link: "https://company-website.com"
```

### Adding a Project

Create a new `.md` file in `md/projects/`:

```md
---
title: "project-name"
date: "2024-06-01"
description: "One-line description."
cover: "https://image-url.com/preview.jpg"
link: "https://github.com/you/project"   # optional, links externally
---

Full writeup in Markdown...
```

### Updating Personal Info & Links

Edit these files:
- **`app/page.tsx`** — bio text, contact email, links section
- **`app/layout.tsx`** — site metadata (title, description for SEO)
- **`components/navbar.tsx`** — your name in the nav

---

## Building for Production

```bash
pnpm build
pnpm start
```

---

## Deploying to Vercel (Recommended)

1. Push your repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. Vercel auto-detects Next.js — just click **Deploy**
4. Your site will be live at `https://your-project.vercel.app`

To add a custom domain, go to **Settings → Domains** in your Vercel project.

---

## Adding Embla Carousel Autoplay

The carousel uses `embla-carousel-autoplay`. Install it:

```bash
pnpm add embla-carousel-autoplay
```

It's already set up in `components/carousel.tsx`.
