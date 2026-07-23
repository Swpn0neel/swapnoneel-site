---
title: 'GEO for Developers: Get Cited by ChatGPT and Perplexity'
date: '2026-07-08T00:00:00.000Z'
description: >-
  GEO for developers, minus the agency fluff. Here's what actually matters if
  you want ChatGPT and Perplexity to cite your blog posts in 2026.
slug: geo-for-developers
primary_keyword: GEO for developers
link: >-
  https://dev.to/swapnoneel123/geo-for-developers-get-cited-by-chatgpt-and-perplexity-34mf
canonical: 'https://www.swapnoneel.site/blog/geo-for-developers'
cover: >-
  https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/gx9dls1426tvj4bknw4l.png
updated: '2026-07-23T13:07:48.942Z'
tags:
  - seo
  - geo
  - ai
  - devrel
---

Have you ever asked ChatGPT or Perplexity a coding question and get a suspiciously specific, correct answer, with zero link back to whoever actually wrote it?

Yeah, that's been happening to my blog too, and I finally sat down to fix it.

So here's the real answer: GEO for developers doesn't need an agency or a 40-page audit. It just needs three simple things: a properly structured content so a model can lift one paragraph and have it make sense on its own, real evidence instead of vague claims, and let the right bots get into your `robots.txt`. That's genuinely most of it, and in this blog I'll walk you through exactly how!

![Dot the Debugger re-inking a return-address stamp as developer writing slides into an AI answers sack with missing source labels.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/a877ztvlh1in45i8vcxu.png)

## What is GEO, actually?

GEO stands for Generative Engine Optimization, and it's the practice of writing content so AI answer engines (ChatGPT, Perplexity, Google's AI Overviews) quote it directly instead of just ranking it in ten blue links.

It's pretty self-explanatory, and it sits right next to SEO (Search Engine Optimization). We used to optimize purely for search engines like Google, but the times have changed, so now you're writing for generative engines too, Perplexity, Gemini, ChatGPT, all of them.

The term comes from an actual peer-reviewed study, presented at KDD 2024 by researchers from Princeton, Georgia Tech, and IIT Delhi, and it's become its own line item in 2026 marketing budgets. [The paper's numbers are wild](https://www.omnibound.ai/blog/generative-engine-optimization-statistics): adding statistics to a page boosted its visibility in AI answers by 41%, and content optimized for generative engines improved visibility by up to 40% overall.

## Why doesn't most GEO advice fit a dev blogger?

Here's the thing though, and I say this as someone who's done SEO freelancing and used Semrush since my first year of college: almost every GEO guide I found while researching this is written for a marketing team running brand-mention trackers across a hundred pages. That's not you if you're publishing one post a week on your own domain, or worse, on Hashnode.

You don't need consensus-signal dashboards. You need to know which five things to do to your next post, and that's what I'm giving you.

## What actually works in GEO?

**Answer the question in your first 40-60 words, standalone.** [Roughly 44% of everything AI engines quote comes from the first third of a page](https://www.omnibound.ai/blog/generative-engine-optimization-statistics), so don't bury your point under three paragraphs of throat-clearing. Say the thing, then explain it. If you notice carefully, I have already mentioned the three GEO optimisation steps in the introduction itself.

**Phrase your headings as questions.** Not "Benefits of X", but "Why does X matter?" or "What is X?". This is also just a more natural way to write, so it's a rare case where the AI-friendly move and the human-friendly move are the same move. Check how I have framed the headings of each section =]

**Every section has to make sense if someone rips it out of the page.** AI engines lift paragraphs, not entire posts. If your section starts with "This also means...", restate what "this" is. Small habit, big difference.

**Put real numbers in, with sources.** Not "many developers prefer X", but "X handles 50,000 requests per second, per their own benchmark, published in June 2026". Vague claims don't get quoted. Specific, sourced ones do. You will find multiple such statements in this blog itself, and also with linked citations.

**Fix your `robots.txt`.** This one's just a config file, and most bloggers never touch it (yes, that's a real file sitting on your domain right now, doing nothing). [The bots you want to allow for citations are different from the bots that scrape for training data](https://www.mersel.ai/blog/how-to-block-or-allow-ai-bots-on-your-website): `OAI-SearchBot` and `PerplexityBot` are the ones fetching pages to answer live questions, while `GPTBot` and `ClaudeBot` are the training crawlers. You can allow the first pair and still block the second, if that's the line you want to draw.

## Should you bother with llms.txt?

Honestly? Probably not yet, and I want to be straight with you about this because most GEO posts won't be.

The idea is simple: drop a markdown file at `/llms.txt` summarizing your site so a model doesn't have to parse your HTML. [Over 844,000 sites have added one already](https://www.mintlify.com/blog/what-is-llms-txt), including Anthropic's own docs. But no major AI company has confirmed they actually read it, and Google's John Mueller called it a "temporary crutch" that isn't done for search at all.

So add one if you want, it costs you ten minutes and can't hurt. Just don't mistake it for the thing that's going to get you cited. That's the structure and the sourcing, not the file.

![Professor Kernel comparing a light llms.txt scroll against heavier evidence tablets labeled stats, sources, and structure.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/gvsazrctmc8kc6t6lrub.png)

## What if you don't even own your blog?

If you cross-post to Hashnode or Dev.to like I do, you don't control the `robots.txt` on that domain, and you can't add schema markup either. That's the platform's call, not yours.

What you can still control everywhere: the content structure itself, and your canonical URL. Always point the canonical tag back to your personal site, always write the answer-first paragraphs regardless of platform, and let the schema/`robots.txt` tactics apply fully only where you actually own the domain.

![Milo the Micro-Archivist carrying a portable structure case between an owned site shelf and a locked platform rules shelf.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/xobsofohyefwrq57pkq2.png)

## Is GEO worth your time?

Yes, but not the version most people are selling you. I recently rebuilt my own blog-writing process around exactly this, direct-answer blocks first, real stats with sources, extractable sections, and it's honestly made the drafts read better for humans too, not just for whichever bot happens to crawl them. I wrote up [the whole build here](https://www.swapnoneel.site/blog/make-ai-write-in-your-voice), if you want the longer version.

## FAQ

**Do I need to block GPTBot to protect my writing?**
That's a separate decision from GEO. Blocking `GPTBot` stops your content from training future models, but blocking `OAI-SearchBot` too would also stop you from showing up in ChatGPT's live search results. Decide which trade-off you actually want.

**Will GEO replace SEO for blogs?**
No, they overlap more than they compete. Structuring for extraction and citing real sources helps you rank in Google too. Think of GEO as SEO with an extra, stricter bar for evidence and standalone clarity.

**How long before I see actual citations?**
I don't have a clean number for this yet, since I only rebuilt my own process around it in mid-2026. Perplexity re-crawls constantly, so that's the faster feedback loop; ChatGPT search is slower and more selective about which pages it trusts.

**Do I need schema markup if I only publish on Hashnode or Dev.to?**
Not directly, since the platform controls that layer. Focus your energy on content structure and canonical URLs instead, those travel with you no matter where you publish.

![Thanks for reading about GEO for Developers](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/u9xplxu74ikwfrltmxfi.png)

If you're building or rebuilding your own writing process around this, I'd genuinely love to hear what worked for you, drop it in the comments. You can also find me on [X (swapnoneel123)](https://x.com/swapnoneel123) or check out more of my work at [swapnoneel.site](https://www.swapnoneel.site).
