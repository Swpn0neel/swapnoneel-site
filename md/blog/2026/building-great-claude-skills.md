---
title: Three Insights for Building Great Claude Skills
date: "2026-09-08T18:32:06.000Z"
description: >-
  The three things that separate Claude skills that work from ones that never
  trigger: a clear description, a lean SKILL.md, and putting fragile steps into
  scripts.
slug: building-great-claude-skills
link:
  - 'https://swapnoneel123.substack.com/p/building-great-claude-skills'
  - 'https://swapnoneel.medium.com/building-great-claude-skills-36965bffd877'
  - 'https://dev.to/swapnoneel123/three-insights-for-building-great-claude-skills-47o1'
canonical: "https://www.swapnoneel.site/blog/building-great-claude-skills"
brand: maxim
cover: >-
  https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/0b26aun3ymuigydo8d7e.png
tags:
  - ai
  - productivity
  - programming
  - webdev
---

Most Claude skills that never fire are not broken. Their description is.

That one fact is behind almost every "why won't my skill trigger" post you'll find. Three things separate a working skill from one that sits there ignored: a description written like a routing rule, a `SKILL.md` kept short on purpose, and pushing fragile steps into scripts instead of long instructions. Get those three right, and everything else gets much easier.

## First, what a Claude skill actually is

A skill is a folder with a `SKILL.md` file in it. At the top of that file, you have a small YAML header with a name and a description, followed by instructions written in markdown. That's the whole concept. Anthropic launched skills in October 2025 and [made the format an open standard](https://venturebeat.com/ai/anthropic-launches-enterprise-agent-skills-and-opens-the-standard) in December, so Claude Code, the API, and claude.ai all use the exact same folder structure.

The interesting part is how skills load. Claude doesn't read your entire skill upfront. When it starts up, it reads only the name and description of every installed skill, costing around 100 tokens each. Claude loads the main instructions only when it decides your skill fits what you asked for. And it reads extra helper files only when those instructions specifically point to them. Anthropic calls this [progressive disclosure](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview). Two of the three insights below come down to working with this design instead of fighting it.

![A folder reveals a skill’s metadata, instructions, and helper script loading in stages.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/qpfssqij5pizxiple4ef.png)

This means skills are cheap to keep around, costing you tokens only when they actually run. That single design choice shapes what makes a skill good or bad.

## Insight 1: Your description is a routing rule, not a summary

Here is where people get confused. Your description isn't a friendly summary for humans browsing your repository. It is a routing rule Claude uses to pick your skill out of the pile.

![Prompt paths enter a routing switch; precise triggers pass and vague descriptions stop.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/0qb993dvkxs1ylwkf0oz.png)

Remember what Claude actually sees at startup: only the name and description of each skill. Nothing else. When you send a prompt, Claude decides whether to open your skill's full text based purely on that description. If the description is vague, Claude never reads the instructions. The best instructions in the world won't help if your skill never triggers.

That's why a skill that won't trigger is almost never a code bug. It just means your description doesn't explain when to trigger using the words you actually type.

A good description handles two jobs: what the skill does, and when Claude should run it. Write it in the third person (like "Reviews pull requests" instead of "I review" or "Review this"). Because Claude reads this inside its system prompt, mixing perspectives can confuse the model. You have up to 1,024 characters, so use that space for the exact phrases you would normally type.

```yaml
---
name: reviewing-pull-requests
description: Reviews pull request diffs against the team's checklist and flags risky changes. Use when the user asks to review a PR, review a diff, or check staged changes before merging.
---
```

Notice that the description names the triggers out loud: "review a PR", "review a diff", "check staged changes". Compare that to "Helps with code review", which competes with everything Claude already knows about code review and loses.

The name matters less than the description, but it has strict rules that catch people off guard. It must use only lowercase letters, numbers, and hyphens, capped at 64 characters. It cannot include the words "anthropic" or "claude". Anthropic recommends names ending in -ing (`reviewing-pull-requests`, `analyzing-spreadsheets`) to clearly show what action the skill takes. A name like `claude-pr-helper` breaks two rules at once, while a generic name like `helper` gives no useful information.

There is real data behind this. One developer ran [650 activation trials](https://medium.com/@ivan.seleznov1/why-claude-code-skills-dont-activate-and-how-to-fix-it-86f679409af1) on the same skills. They found that passive descriptions triggered far less reliably than direct instructions starting with "Use this skill when." While this isn't an official benchmark from Anthropic, the takeaway matches both the official documentation and real-world use: name the specific situation where Claude should trigger, not just what it can do.

Also, keep your scope realistic. If it's too broad ("helps with frontend"), Claude will pick its own built-in knowledge instead. If it's too narrow ("fixes React 18 hydration errors in Next.js 14 app router"), it won't run if you phrase your prompt slightly differently. You are describing a general task, not a specific bug ticket.

## Insight 2: Progressive disclosure is a token budget you spend

Once a skill triggers, its `SKILL.md` body loads into the same context window as your conversation, your files, and every other skill's metadata. Anthropic makes a great point in their [authoring guide](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices): the context window is shared space. Every token you waste in your instruction file is memory the model can't use for your actual work.

This means your main skill file should be smaller than you might expect. The official recommendation is to keep `SKILL.md` under 500 lines. Move anything longer into separate files that load only when Claude needs them. Loading happens in stages, and each stage has a different cost:

| Level                     | When it loads           | Rough cost            |
| ------------------------- | ----------------------- | --------------------- |
| Name and description      | Always, at startup      | ~100 tokens per skill |
| SKILL.md body             | When the skill triggers | Under 5k tokens       |
| Bundled files and scripts | Only when referenced    | Nothing until read    |

![Instruction pages narrow through a funnel so only the needed context reaches the working window.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/cdsfsn8vb8rqw6avn3d7.png)

That third row is the real secret. You can include a 2,000-line API guide, datasets, or code examples, and they cost zero tokens until Claude actually needs them. So the best approach is a lean `SKILL.md` that acts like a table of contents, pointing Claude to larger files when necessary:

```plaintext
reviewing-pull-requests/
  SKILL.md          # short: the workflow and when to read what
  checklist.md      # loaded only when reviewing
  examples.md       # loaded only when Claude wants a sample
  scripts/
    diff_stats.py   # executed, never loaded into context
```

The documentation highlights two practical rules here. First, keep linked files only one level deep and link them directly inside `SKILL.md`. If you bury files inside subfolders, Claude often previews just the first 100 lines and misses the rest. Second, don't explain concepts Claude already understands. Anthropic uses a straightforward example: a good instruction to extract PDF text is about 50 tokens of code. A bad one uses 150 tokens because it starts by explaining what a PDF is. Claude already knows what a PDF is!

Notice what I'm doing here, too. I'm not explaining what a token is or how context windows work. If you're building skills, you already understand those basics. That's the exact same mindset your skills need: only write what the model doesn't already know.

I care about this point a lot because of my work building [ANRL](https://anrl-site.vercel.app). It's a compact data format created to cut token waste and context fragmentation, and it reduced formatting overhead by more than 40%. When you spend weeks fighting to save 40% on tokens, watching someone waste 3,000 tokens in `SKILL.md` re-explaining JSON is painful. Keeping your skills lean isn't just about clean formatting—it protects the model's working memory.

## Insight 3: Let code do the deterministic work

The last one separates skills that feel reliable from skills that mostly work.

If a step is deterministic (parse this file, validate this schema, sort these rows), do not write instructions asking Claude to be careful. Write a script and tell Claude to run it. When Claude runs a script through bash, only the output comes back into context, not the code. So a bundled `validate.py` is cheaper than asking Claude to generate the same validation every time, and it does the exact same thing on every run instead of a slightly different thing.

![A plan crosses a guarded script bridge, passes validation, and reaches a stable output.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/sescauz6xlvbfj8wgbv1.png)

Anthropic uses a great phrase for writing these helper scripts: "solve, don't defer." If a file might be missing, handle that check right inside the script. Don't let the script crash and force Claude to guess a fix, because improvised fixes break reliability. The same rule applies to unexplained settings: setting a 30-second timeout with an explanatory comment is much better than leaving a random number like `47` that no one can explain later.

The bigger idea is giving Claude freedom only when the task allows it. Anthropic's docs share a helpful comparison:
Some tasks are like a narrow bridge with steep drops on both sides, like running database migrations in a strict order. For those, give Claude a single script and tell it not to alter the command. Other tasks are like an open field with no dangers, like reviewing code where the best feedback depends on what Claude finds. For those, give general guidelines and trust the model to choose the right path. Making mistakes here hurts in both directions: adding too many rigid rules in an open field makes the skill inflexible, while giving too little direction on a narrow bridge leads to errors.

For bulk edits or risky actions, the documentation suggests a three-step pattern: plan, validate, and execute. Have Claude write its planned changes to a file first. Next, run a script that checks that plan for mistakes. Finally, apply the changes only if the check passes. It might sound like extra work, but it's the difference between catching an error in a safe file and catching it after it breaks your database.

## When one skill becomes twenty

Those three insights help you build a solid individual skill. But developers rarely stop at just one. Once your team starts collecting dozens of skills, two quiet problems start showing up.

First, skills can connect to external tools through MCP (if you haven't used MCP yet, check out my [beginner's guide to MCP servers](https://www.swapnoneel.site/blog/what-is-an-mcp-server)). The easiest way to think about the difference: MCP provides the tool, while the skill teaches Claude how to use it for your specific workflow. But pay close attention to Anthropic's security warning: a skill can tell Claude to run tools in ways the author never mentioned. That's why they recommend checking every file inside any skill you didn't write yourself.

Second, it's best practice to test skills across different models like Haiku, Sonnet, and Opus. A skill is only as reliable as the model running it. In a team environment, that means your skills end up calling different models across different API providers.

Combine that with several teammates installing community skills from GitHub, and you aren't just managing simple markdown files anymore. You have unmonitored tool calls and model requests running across your team. That's an entirely different problem.

![A shelf of skills expands into a connected ecosystem inspected for hidden tool risk.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/8hu0md48n2dqt5acghor.png)

## Do you need a gateway for your skills?

If you're running just two skills on your laptop, you don't. Seriously, skip this section and go write your skills instead of setting up infrastructure. A gateway won't make an individual skill better, and it won't fix a bad description.

A gateway starts to matter when you can no longer answer simple questions: Who is allowed to run which tool? Which skill triggered this request? Whose API budget is paying for it? When you hit that point, routing all that traffic through one place makes life much easier. That place is an AI gateway, and the one I keep returning to is [Bifrost (by Maxim AI)](https://www.getmaxim.ai/bifrost), an open-source AI gateway and control plane for LLMs, MCP tools, and agents ([repo here](https://github.com/maximhq/bifrost)).

![A small setup runs directly while a growing team routes tools and models through one gateway.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/1d5dafilojaeqhim8tnp.png)

Two of its core features line up directly with the scaling problems above.

To secure tool calls, Bifrost acts as an [MCP gateway with deny-by-default tool filtering](https://docs.getbifrost.ai/mcp/filtering). Without explicit permissions, zero tools are accessible. You define what to unlock across client settings, request headers, and virtual key configurations. This means a skill could ask for a filesystem MCP server, but its key can restrict execution strictly to `read_file`, completely blocking destructive actions like `delete_file`. You don't have to depend on plain text instructions in a prompt to keep your systems safe. (It even has an MCP Code Mode that runs tool workflows inside a sandbox instead of dumping every tool schema into your context, cutting token usage by over 92% across large tool sets.)

To manage model access, Bifrost provides [virtual keys and governance rules](https://docs.getbifrost.ai/features/governance). Each key gets its own list of approved models (across 25+ providers and 10,000+ models), an automatic budget cap with reset periods, and custom rate limits. So when you want your team to test a skill across Haiku, Sonnet, and Opus, you give them one key with an allow-list and a spending cap instead of juggling five API keys in a spreadsheet. Provider fallback and retries are built in, so a skill doesn't fall over if one provider has an outage.

Performance is where this actually holds up. If a gateway is slow, developers route around it. Bifrost is written in Go with memory pooling and pre-warmed connections, keeping added gateway overhead to about 11 microseconds at 5,000 requests per second on a single t3.xlarge instance. In Maxim's published benchmarks against LiteLLM (tested with 500 concurrent users on AWS), Bifrost delivered 9.5x higher throughput (424 req/s vs 44.84 req/s) and roughly 50x lower P50 latency (804 ms vs 38.65 s). Those are vendor benchmarks, so treat them as such, but the main point holds: the gateway manages your traffic without becoming the slow part.

None of this is about writing an individual skill. It's just what helps once your skills work well and you start scaling up.

## So what actually makes a Claude skill great?

It's not about making a giant `SKILL.md` file. It's much simpler than that.

Write your description like a clear routing rule in the third person, using the exact words you'd naturally type in a prompt. Keep the main instructions short and let extra reference files handle the heavy lifting, because context memory isn't free. And move fragile, repetitive tasks into code scripts so they run consistently every single time instead of guessing. Those three habits make the difference between a skill that runs reliably and one that sits forgotten in a folder.

![Three rising habits—routing, lean instructions, and deterministic code—build a reliable skill.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/noxgvap6bfhk954kxr02.png)

Using an AI gateway matters as well, but only later on. Don't worry about it until you have more skills and tools than you can easily keep track of in your head. You'll know when you cross that line. Until then, setting up a gateway is just extra work you don't need.

If you've built skills that trigger reliably, I'd love to hear how you wrote your descriptions to make them work. That's still the area where most people spend the least effort. Come share your thoughts on [X](https://x.com/swapnoneel123), or check out my other posts at [my site](https://www.swapnoneel.site).
