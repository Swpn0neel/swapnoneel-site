---
title: Nobody's Testing AI Coding Agents Enough
date: '2026-07-24T00:00:00.000Z'
description: >-
  40-62% of AI-generated code ships with flaws. Testing AI coding agents stopped
  being optional, here's what I learned being paid to do it.
slug: testing-ai-coding-agents
link:
  - 'https://dev.to/swapnoneel123/nobodys-testing-ai-coding-agents-enough-4bo'
  - >-
    https://swapnoneel.medium.com/nobodys-testing-ai-coding-agents-enough-17f2f20eb44f
canonical: 'https://www.swapnoneel.site/blog/testing-ai-coding-agents'
cover: >-
  https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/gjnz7e2p554wi14eules.png
tags:
  - ai
  - agents
  - testing
  - security
updated: '2026-09-01T07:58:14.648Z'
---

Code review used to be the part everyone complained about. Slow, nitpicky, the thing standing between you and shipping.

And for a while, AI coding agents made it feel optional. The agent writes the code, the code compiles, the tests pass, ship it.

The industry-wide numbers are worse than what most developers see in their own repositories. Somewhere between 40 to 62% of AI-generated code got shipped with security or design flaws by March 2026, and roughly one in five breaches this year traces back to AI-written code, [according to industry analysis on the verification gap](https://futurumgroup.com/insights/why-ai-coding-agents-need-an-independent-review-layer-trust-not-output-is-the-bottleneck/). Code generation got really fast. Verification did not pick up the same pace. Testing AI coding agents properly is where that gap lives, whether your team has staffed for it or not.

## What's actually breaking?

In late June 2026, security researchers at Adversa AI disclosed something called GuardFall, a shell-interpretation bypass that worked against 10 of 11 popular open-source AI coding and computer-use agents, [including Aider, Cline, Goose, and OpenHands](https://securityaffairs.com/194546/ai/guardfall-flaw-hits-10-of-11-popular-open-source-ai-agents.html). The agents were checking the raw command text for danger before running it, but bash rewrites that text through quoting, substitution, and expansion before it actually executes. So a command that looks harmless to the safety check can still detonate once the shell gets its hands on it. And only one tool in the survey actually held up!

![The check reads the label. It never sees what the parcel turns into.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/4pd0cgpsjrqtwi6jdlro.png)

And it's not just an edge case for people running agents locally. A scan of 5,600 vibe-coded apps already in production [found 2,000 highly critical vulnerabilities and 400 exposed secrets](https://digitalbiztalk.com/article/vibe-coding-is-killing-open-source-the-2026-developer-crisis), some of them exposing medical records and payment information. Georgia Tech's Vibe Security Radar tracked the trend line getting worse, and not better: 6 confirmed AI-generated vulnerabilities in January 2026, 15 in February, 35 in March.

![Even Kernel doesn't like where this evidence is pointing.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/zsaehsmgv4kvekhp4cov.png)

## Why is this happening if the models got so much better?

Better models didn't remove the need for verification, they just moved the bottleneck. Generating a solution stopped being the hard part a while ago. Deciding whether you can actually trust that solution is the hard part now, and [55.4% of enterprise decision-makers already name agent reliability and hallucination management as their top production challenge](https://futurumgroup.com/insights/why-ai-coding-agents-need-an-independent-review-layer-trust-not-output-is-the-bottleneck/). The code compiles, the tests pass, and reviewers still have to reconstruct what the change was even trying to do before they can tell if it's safe.

## I've actually had this job, and it's not glamorous

I recently worked with an early-stage startup testing a self-evolving agent. My job was to catch failures before its core users saw them.

I also built an internal evaluation chain that pulled the agent's logs and checked whether its learning from feedback matched real scenarios, whether it hallucinated improvements, and whether it tried to work around its own guidelines. The same tool reported latency and likely slowdowns. "It seems to be working" was not enough; I needed numbers.

![Someone has to stand between the output and the door. That someone had a job title.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/9hvhj0y9fidrjdbapalx.png)

Before that, I spent time at Keploy building and improving sample apps specifically to demo API testing. So when I say testing agent output is a real, staffable job and not a checkbox, that's not a hot take pulled from a headline, it's what I got paid to do.

And to be fair to the agents themselves: they are genuinely fast, and genuinely useful. I use Claude Code, Antigravity and Codex daily, and I'm not about to pretend otherwise. The problem was never that the code they write is bad on average. The problem is that "on average" is exactly the wrong bar for security and correctness, because the failures cluster in the 5-10% you didn't specifically check.

(And yes, this post was drafted by an agent skill I built, and I'm going to go through and edit it before it goes anywhere near publish. That's not irony, that's the actual point: the draft can get the facts and the structure right, but deciding which of my receipts actually belong here, and how hard to steelman the agents, is still a job for a human. Mine, in this case.)

## What should you actually do differently?

Stop reviewing agent output the way you review your own code, and start reviewing it the way you'd review a fast junior developer's very first PR: assume competence, verify everything, especially the parts that touch execution.

Concretely: never let an agent pipe raw, unreviewed strings into a shell without a real evaluator in between, GuardFall exists because teams assumed string-matching was enough. Budget actual human review time as a fixed cost of using these tools, not a nice-to-have. And track your own vulnerability trend line the way Georgia Tech tracked the industry's, because "it hasn't broken yet" is not the same thing as "it's fine."

And testing an agent isn't only about catching bugs before they ship, it's also about watching what the agent quietly costs you over time. That's exactly why I built that internal latency-tracking tool in the first place, numbers on slowdowns catch problems long before a user ever complains.

[Bifrost](https://docs.getbifrost.ai/overview) is Maxim AI's high-performance, [open-source AI gateway](https://github.com/maximhq/bifrost) that unifies access to 20+ providers through a single OpenAI-compatible API. For agent testing, that gateway position creates one record of requests and responses across models and providers. Its [built-in observability](https://docs.getbifrost.ai/features/observability/default) records inputs, outputs, provider, model, tokens, cost, latency, errors, and status for each call, so teams can compare agent behavior and operational cost without building a different logging path for every provider integration.

I use these agents in my own workflow, but testing them is part of the work. Teams need to staff and plan for it instead of treating it as a final checkbox.

If you're building your own testing layer for an AI tool, or you've been burned by one that didn't have one, I'd genuinely like to hear about it, drop it in the comments. I write more about agent tooling and building with AI at [swapnoneel.site](https://www.swapnoneel.site), including [how I built a self-improving writing agent](https://www.swapnoneel.site/blog/make-ai-write-in-your-voice), and you can find me on [X (swapnoneel123)](https://x.com/swapnoneel123).

![Your turn. What did your testing layer catch?](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/vr4zw9hox2yybrgbhzqs.png)
