---
title: "GTM Engineer • Bifrost"
date: "Jul 2026 - Present"
description: "Running technical go-to-market for Bifrost: growing GitHub stars from 6.4K to 10K+, raising domain authority and AI search visibility, building the GTM team's internal tools, and running content, creator, and community programs."
cover: "/work/bifrost.webp"
---

[Bifrost](https://getbifrost.ai) (by Maxim AI) is a high-performance, [open-source AI gateway](https://github.com/maximhq/bifrost) that unifies access to 20+ providers through a single OpenAI-compatible API, featuring adaptive routing, guardrails, governance, and observability.

**In numbers:** 6.4K to 10K+ GitHub stars · getbifrost.ai from DR 32 to 58 · getmaxim.ai at DR 72 · AI visibility up 23% · 100K+ monthly visits on 3 new publication sites · 3,000+ hackathon registrations

## What I am doing

### Open-source growth

- Helped grow [Bifrost's GitHub stars](https://github.com/maximhq/bifrost) from **6.4K to 10K+** in four months ([star history](https://www.star-history.com/#maximhq/bifrost&Date), [Trendshift](https://trendshift.io/repositories/14529)).
- Our hackathon collaboration with Geek Room brought in **500+ GitHub stars**.
- Raised [**160+ pull requests**](https://github.com/search?q=is%3Apr+author%3ASwpn0neel+bifrost+-org%3Amaximhq+-org%3AMaxim-GTM+-user%3ASwpn0neel+-org%3Aai-gateways+-org%3Abuild-with-ai-hq+-user%3Adskuldeep&type=pullrequests) to curated "Awesome" lists, repos that list AI gateways, and popular skill repos. Merged ones include lists maintained by [EthicalML](https://github.com/EthicalML/awesome-production-machine-learning/pull/805) (21K stars), [TensorChord](https://github.com/tensorchord/Awesome-LLMOps/pull/728) (6K stars), [Akash Network](https://github.com/akash-network/awesome-akash/pull/846), [E2B](https://github.com/e2b-dev/awesome-mcp-gateways/pull/83), [Palo Alto Networks](https://github.com/PaloAltoNetworks/prisma-airs-integrations/pull/65), and [Backblaze](https://github.com/backblaze-labs/awesome-agent-infrastructure/pull/25).
- Built **9 skills** with Bifrost in the stack, published them on skills.sh and other skill hubs, and promoted them across forums and discussion groups.
- Created **11 GitHub repos**, including "best AI gateways", "best MCP gateways", and "best agent gateways" lists and 5 repos comparing Bifrost with Cloudflare, Kong, and LiteLLM. One is already close to 50 stars.
- Ran GitHub-star campaigns through Trendshift features and ads, and daily.dev boosted posts and ads.

### SEO, AI search, and backlinks

- Raised getbifrost.ai from **DR 32 to DR 58** and getmaxim.ai to **DR 72** ([check on Ahrefs](https://ahrefs.com/website-authority-checker?input=getbifrost.ai)).
- Raised our AI visibility across AI Overviews, ChatGPT, and Claude by **23%**.
- Reached out to **200+ publications** and closed **40+ link exchanges** and **20+ listicle inclusions**, working with several partner agencies and a guerrilla agency I set up myself.
- Listed and launched Bifrost on **40+ high-DR sites** (all DR 50+, most of them DR 70+).
- Fixed technical SEO across our site: post-migration issues, JSON-LD on product pages, missing OG images, heading tags in the article theme, broken docs links, second-party links, and 404s inside published articles.
- Pruned underperforming pSEO pages, shipped the fixes from a site RCA, and ran the RCA on a bot-traffic surge.
- Prepared the site for AI search with content signals in robots.txt and an llms.txt Link header, and used Profound to check whether new articles appear in AI Overviews.
- Linked the AI gateway, LLM gateway, and MCP gateway article cohorts to their landing pages and revamped the resources pages to point to them.

### Dashboards and internal tools

- Built a **unified hub for all our GTM dashboards**: one Google sign-in limited to company accounts, role-based access that admins grant per dashboard, a health check on every app each minute, and an Ask page that answers questions about the dashboards' data with charts and numbers.
- Gave every dashboard the **same design language and theme**, built on shadcn/ui with light and dark modes and Recharts charts.
- Rebuilt the dashboards that were already there, covering demo bookings and lead quality, MQLs, weekly metrics, and keyword and AI-prompt rankings. Added new ones for GitHub growth (four snapshots a day), listicle inclusions, and influencer analysis.
- Automated creator outreach with a pipeline that finds technical authors on DEV.to and Medium every day, qualifies them with Claude, finds and verifies their emails, writes an opening line based on their latest post, and sends approved leads to Instantly.
- Automated listicle outreach with a dashboard that reads each listicle, decides whether Bifrost belongs in it, drafts the pitch, runs Instantly campaigns for AI-cited pages and backlink-gap targets, and answers replies from one inbox.
- Built content tools: bulk keyword-link insertion across our Ghost articles with review, dry runs, backups, and revert; a hero-image generator that combines a Gemini illustration, our logo, and a two-tone title; a Claude-assisted Instagram and LinkedIn carousel editor; and a DEV.to autoblogger.
- Extended our crawler analytics to track AI agents such as Claude Code, and rebuilt its journey view.
- Co-built the GTM data pipeline on Airflow and dbt.
- After Railway's [October 21, 2026 security incident](https://blog.railway.com/p/preliminary-report-october-security-incident), **moved our whole GTM stack to AWS** with Terraform: EC2 hosts, RDS Postgres, ECR images with GitHub OIDC deploys, CloudTrail and GuardDuty, and a Cloudflare Tunnel in front of the apps.
- Stack: Next.js, TypeScript, Tailwind CSS, shadcn/ui, Recharts, Better Auth, Postgres (Neon and RDS), Python (Flask, Airflow, and dbt), the Claude API, Instantly, Docker, Terraform, AWS, and Cloudflare.

### Website performance and engineering

- Optimized LCP and FCP across our site. Pages that took 6, 7, 15, and 23 seconds to reach LCP now load **under 4 seconds**, and several load **under 2 seconds**.
- Migrated the landing, enterprise, and book-a-demo pages from Framer to Next.js.
- Built an **in-house CMS** for our content pages: a side-by-side MDX editor with a live preview at desktop, tablet, and phone widths, image uploads, content checks before publishing, drafts, and a full version history of who changed what. Later added an MCP server so AI assistants can work with the pages.
- Shipped new site sections ([/topics](https://www.getmaxim.ai/bifrost/topics), [/glossary](https://www.getmaxim.ai/bifrost/glossary), [/agent-gateway](https://www.getmaxim.ai/agent-gateway), /caio, and /ciso), revamped the [AI Guardrails page](https://www.getmaxim.ai/ai-guardrails), and set up Cloudflare staging environments.

### Content

- Wrote **85 new long-form articles** for getmaxim.ai/articles ([my author page](https://www.getmaxim.ai/articles/author/swapnoneel/)) and revamped **175 published articles** with Bifrost workflows, contextual backlinks, and current AI architecture practices.
- Published **300+ posts** across DEV.to, Medium, and publication sites we manage in-house.
- Wrote **10+ architecture deep-dives** on Bifrost (adaptive load balancing, guardrails, semantic caching, observability, virtual keys, and the MCP gateway) and syndicated them to [DEV.to](https://dev.to/swapnoneel123), [Medium](https://medium.com/@swapnoneel), [Substack](https://substack.com/@swapnoneel123), and [my blog](https://www.swapnoneel.site/blog).
- Started an Instagram channel whose first reels have **1,000+ views**.

### Publication websites

- Launched **3 publication websites** to build our presence in AI Overviews and ChatGPT for the keywords we own.
- One month in, they get **100K+ monthly visits** together, and each is already above DR 10.
- Set up Google Analytics, Bing Webmaster Tools, and Google Search Console for all three, and one of them was nominated on Awwwards.

### Creators, influencers, and PR

- Collaborated with **30+ creators** after auditing 700+ profiles, and run the weekly blog-creator program from sourcing and content review to payments.
- Identified **8 creators** whose articles consistently appear in AI Overviews, get cited, and mention Bifrost.
- Built a pipeline of **250+ guest-posting platforms** and creators across YouTube, Medium, DEV.to, and Substack.
- Pitched VentureBeat writers and PR Newswire.

### Community and events

- Brought in Geek Room as our partner for the [Global AI Hackathon](https://hackculture.io/hackathons/ai-global-hackathon), which drew **3,000+ registrations** and **450+ submitted projects**. I also led the Bifrost workshop, shortlisted the finalists, and measured the impact on GitHub stars and social reach.
- Drove **300K+ impressions** across Reddit, daily.dev, Peerlist, and Hacker News, with top-ranking posts on `r/opencode` and discussions in `r/LocalLLM` and `r/mcp`.

### Product feedback and research

- Opened [4 GitHub issues](https://github.com/maximhq/bifrost/issues?q=is%3Aissue+author%3ASwpn0neel+created%3A%3E%3D2026-07-29) with product feedback for the core team after testing the gateway hands-on.
- Benchmarked Bifrost against LiteLLM's Rust implementation and audited the docs for benchmark discrepancies and AI-search gaps.
- Mapped Bifrost's positioning against LiteLLM, TrueFoundry, Kong AI Gateway, and Portkey.
