---
title: "What Is Granular Access Control? RBAC, ABAC, and AI"
date: "2026-09-09T17:25:41.000Z"
description: >-
  What is granular access control? The five dimensions a permission can narrow
  on, how it differs from RBAC and ABAC, and where AI agents break it.
slug: what-is-granular-access-control
link:
  - 'https://swapnoneel123.substack.com/p/what-is-granular-access-control'
  - 'https://medium.com/@swapnoneel/what-is-granular-access-control-68870c925e53'
  - 'https://dev.to/swapnoneel123/what-is-granular-access-control-rbac-abac-and-ai-54eo'
canonical: "https://www.swapnoneel.site/blog/what-is-granular-access-control"
cover: >-
  https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/1bdcwewx8ia7x11uym7b.png
brand: maxim
tags:
  - webdev
  - security
  - ai
  - beginners
---

"Can this person use the AI API?" is one question.

"Can this service call gpt-5, at most 200 times an hour, with a 50 dollar cap this month, with no file system tools attached, and only until Friday?" is a completely different question.

Granular access control is what turns the first question into the second one. It means defining permissions at the smallest useful unit, so an identity can take exactly one action, on exactly one resource, within exactly one budget, under exactly one set of conditions, and nothing else.

That idea has a name, the principle of least privilege, and it just means giving each caller the minimum access it needs. Granular access control is how you actually write that down.

And the reason it stopped being a nice-to-have this year is that most of the things asking for permission are no longer people.

## Access control is a dial, not a switch

Strip a permission down and it is three things: a **subject** (who is asking), an **action** (what they want to do), and a **resource** (what they want to do it to). Every access control system you have ever used is just a way of writing those three things down and checking them.

Coarse-grained access control leaves all three parts wide open. "Engineers can use the database" is one permission covering forty people, six verbs, and every table you own. It is one line of config, and it is fast to write, which is exactly why it survives so long.

Granular access control narrows the same three parts instead. "The reporting service can run SELECT on the `orders` table, and nothing else." One caller, one verb, one table.

Think of a house key against a hotel keycard. The house key opens everything you own, forever, and the only way to take it back is to change the lock. The keycard opens room 402, on floor 4, until Friday at 11 in the morning, and the front desk can kill it from the lobby without touching a single door.

Both are access control. The keycard is granular.

![Granular access control illustrated as a hotel keycard](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/hnm88ok73kltdi8mcuu7.png)

So granularity is not a product you buy or a model you adopt. It is how far down you are willing to turn the dial, and how much extra work you are willing to do in exchange. Turn it too far and you get a permissions table nobody can read. Leave it too coarse and one leaked credential owns the whole system.

## The five dimensions you can narrow a permission on

Most explanations of granular access control stop at "give people less access", which is true and completely useless as advice. The useful version is that a permission can be narrowed along five separate axes, and you can turn each one independently.

![The five dimensions of granular access control](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/1s1helwzy5pt4fwewzsa.png)

Here they are, from the one everybody already does to the one almost nobody does.

### 1. Who is asking

The identity. This is the axis every system starts with, and the one that changed the most recently.

For a long time a subject meant a person, or a service account somebody created once and forgot about. Now a subject is just as likely to be a coding agent, a CI job, a background worker, or a chain of three agents where the last one has no idea which human started the request.

These are called non-human identities, and they are the ones quietly holding most of the over-permissioned access. Sonrai's cloud access research, published in May 2026, found that [92% of identities with sensitive permissions](https://sonraisecurity.com/blog/why-92-percent-cloud-permissions-never-used/) did not use them once in 90 days, and 87% of that group were machine identities. That is a vendor scanning its own customers and not an independent audit, so take the exact number lightly.

The fix here is easy to say and annoying to do: one identity per caller, never one shared credential per team.

### 2. What action they want to take

Read, write, update, delete. List versus fetch. Call a model versus look at what models exist.

Coarse systems have two levels here, usually named something like read and admin. Granular systems split up the verbs that can do different amounts of damage. Being able to view a log line and being able to export the whole log table are not the same permission, even though both are "reading".

### 3. Which resource, exactly

This is where granularity gets real, because a resource is rarely one flat thing.

A database can be scoped at the server, the database, the table, the column, or the row. An AI setup can be scoped at the provider, the model, or a single tool that a model is allowed to invoke. Each step down that ladder means less damage if the key leaks, and one more thing to maintain.

Row-level scoping is the one worth knowing by name. It answers "which of these records can you see", which is a different question from "can you see this table", and it is the difference between a support agent seeing their own tickets and a support agent seeing everybody's.

### 4. How much they can consume

Here is the axis classic access control mostly ignores, and it is the one that bites hardest with AI.

Permission has traditionally been a boolean. You can call this endpoint, or you cannot. But when a single call can cost real money and a loop can make ten thousand of them, "yes" without a ceiling is not a permission, it is an open tab.

So the granular version attaches quantity to the grant. This key may spend 200 dollars a month. This key may burn 10,000 tokens an hour. This key may make 100 requests a minute. Developers have been asking providers for exactly this for years, and OpenAI's own developer forum carries a [feature request for per-key spending limits](https://community.openai.com/t/api-key-specific-rate-and-spending-limits-would-be-good/1374358) with people piling into it.

### 5. Under what conditions

The context around the request. Time of day, source IP, environment, device posture, whether the key has expired yet.

Expiry is the underrated one. A permission with no end date is a permission you will forget you granted, and every "how did this old key still work" incident starts there.

## Is granular access control the same as RBAC?

No, and this trips up a lot of people, so it is worth separating properly.

![RBAC, ABAC, and ReBAC compared](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/lhlbqhdkv87js27zudwx.png)

**RBAC** (role-based access control) groups permissions into roles and hands roles to identities. It is the most common model in the world because it maps onto how companies actually think. You are a developer, developers get the developer role, done.

RBAC can be granular or coarse depending entirely on how you write the roles. That is the part people miss. A role called `admin` with every permission attached is RBAC and it is not granular at all.

The trouble shows up when you try to push RBAC down the dial. Every new condition needs its own role, so you get `developer-staging`, `developer-staging-eu`, `developer-staging-eu-readonly`, and pretty soon nobody can tell you what any of them do. The industry name for this is [role explosion](https://www.osohq.com/learn/rbac-vs-abac), and it is the standard failure mode of a team that discovered granularity and only had roles to express it with.

**ABAC** (attribute-based access control) fixes that by evaluating attributes at request time instead of pre-baking roles. Department, clearance, resource classification, time, location. It gets you much finer control without the role count exploding, and the price you pay is that when a request gets denied, you have to trace which attribute failed instead of just reading a role name.

**ReBAC** (relationship-based access control) asks a third question: how is this subject related to this resource? You can edit the doc because you created it. You can see the profile because you manage that person. Google Drive works this way, and so does every app where ownership is the real rule.

Well, which one should you use? Honestly, most real systems end up with RBAC for the broad strokes and one of the other two layered on for the cases roles cannot express. Granularity comes from the rules you write, and not from the model you picked. You can write a terrible coarse ABAC policy. Plenty of people have.

## Why AI made this urgent

I run Claude Code and GPT Codex daily, and both of them do things a normal API consumer never did. They read files and call tools. And they chain several model calls together off one instruction I typed half-awake.

That breaks the two assumptions most permission systems were built on: that whoever is asking is a person, and that every request is something a person actually asked for.

![AI agents expand access control risk](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/b4iz8a40bn41yzz76ga2.png)

The numbers back this up. 1Password surveyed 1,000 security and engineering staff at large US firms in late May and early June 2026, and found that agents in production reached [roughly twice as much data](https://www.helpnetsecurity.com/2026/07/29/1password-ai-agent-governance/) as had actually been approved. In the same survey, 33% of developers running agents reported a breach or security incident tied to an over-privileged non-human identity, and 40% said they leave agents holding persistent access to systems and secrets after the task is finished.

None of that is an AI-specific vulnerability. It is the same over-permissioning problem as always, running at a speed and volume that humans never generated.

## Where granular access control breaks in practice

Everybody agrees with least privilege. Almost nobody has it. So it is worth being specific about where the plan falls apart, because the reason is usually the setup, and not laziness.

**A provider key cannot be narrowed.** Your OpenAI or Anthropic key is a single credential with your whole account behind it. There is no version of it that means "gpt-4o only, 50 dollars, no tool calls". So the moment more than one service needs model access, you either share one key and lose all attribution, or you mint several and lose all central control.

**Enforcement lives in the wrong place.** If the permission check is inside your application code, then every new service, notebook, cron job, and intern's side script has to re-implement it correctly. One of them will not. And the ones that skip it will not show up in any policy list, because they never registered with the policy system in the first place.

**You cannot enforce what you cannot attribute.** At Zonko Labs I built an internal tool that captured our AI product's data logs and generated reports on latency and probable slowdowns, and the thing that made it useful was that every log line could be traced back to a specific caller. Without that, a spend spike is just a number going up. You cannot tighten a permission when you do not know which caller needs loosening.

![Common granular access control failure modes](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/sca2l1cfdi41lpzjhyar.png)

So the pattern behind all three is the same. Granular access control needs a place in the request path that sees every call, knows who made it, and can say no before the call leaves your network.

## Where the gateway comes in

Let me be honest about where this actually helps first. If you are one person with one API key on one machine, you do not need any of this, and a gateway will not make your side project safer. It also cannot fix a permission model you have not thought about. A gateway enforces the rules you write, so if you write "allow everything", you get everything, faster.

But the moment there are several services, several models, and a few agents in the mix, the check has to sit in the traffic path. That is what an AI gateway is: a proxy that every model call goes through. Which makes it the one place you can check a permission once, instead of in every service.

![AI gateway enforcing permissions on model calls](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/0bpbcye3j3npblkge18e.png)

[Bifrost](https://www.getmaxim.ai/bifrost) is the open-source one I keep pointing people at, partly because the whole thing sits in [a public GitHub repo](https://github.com/maximhq/bifrost), so you can read exactly what it enforces rather than trusting a feature list.

The thing you hand out is a **virtual key**. Your real provider credentials sit inside the gateway, and each caller gets its own scoped key instead. And the things you can scope that key on are almost exactly the five dimensions above.

Take the rule in plain words first:

> This key belongs to the support team. It can only use OpenAI, only the `gpt-4o` model, and it stops working on the first of next year.

Written out in Bifrost's [governance config](https://docs.getbifrost.ai/features/governance), that is:

```json
{
  "id": "vk-support-bot",
  "is_active": true,
  "allow_all_providers": false,
  "expires_at": "2027-01-01T00:00:00Z",
  "provider_configs": [
    {
      "provider": "openai",
      "allowed_models": ["gpt-4o"],
      "blacklisted_models": []
    }
  ],
  "team_id": "team-support"
}
```

Reading that back: `allow_all_providers` set to false means any provider not listed here is denied, including ones added to the gateway later. `allowed_models` narrows dimension three to a single model. `expires_at` is dimension five, so the key dies on its own without anybody remembering to revoke it. And `team_id` attaches it to a team, which is where the budget lives.

A few more things worth knowing:

**Spending and rate caps sit on the key itself.** A budget is `max_limit` plus a `reset_duration` of `1m`, `1h`, `1d`, `1w`, `1M`, `1Q` or `1Y`, and rate limits are separate `token_max_limit` and `request_max_limit` counters. Blowing through them returns real status codes rather than a generic failure: 402 for `budget_exceeded`, 429 for `token_limited`, 403 for `model_blocked`. That distinction sounds small until you are the one reading the error at 2 in the morning.

**Tool access is deny-by-default.** If you have wired up MCP servers, a virtual key with no MCP configuration gets no tools at all. Where tools are granted, they are listed explicitly in `tools_to_execute`, and the key's list acts as a ceiling that a request cannot widen. That is dimension three pushed all the way down to individual tools, which matters a lot given how much damage one file system tool can do inside an agent loop! (If MCP is new to you, I wrote [a beginner's guide to MCP servers](https://www.swapnoneel.site/blog/what-is-an-mcp-server) first.)

**Seeing the dashboard is a separate grant from calling a model.** Bifrost ships three system roles, Admin, Developer and Viewer, carrying 42, 27 and 14 permissions, and you can build custom ones by toggling resource and operation pairs. On top of that sits data access control, which decides which rows a user sees at all: `own-data`, `team-data`, or `all-data`. Being allowed to open the logs page and being allowed to see everybody's logs are two different grants.

**Write the policy once, not once per person.** [Access profiles](https://docs.getbifrost.ai/enterprise/access-profiles) let you define one policy and auto-issue a per-user virtual key from it, each with its own budget counter. Edit the template, propagate, and every key follows. Keys can rotate on a schedule from `1h` up to `365d`. This is the part that decides whether any of it survives the team getting bigger. If every new engineer needs a hand-written policy, somebody will quietly hand out a shared key by month three.

**Audit logs are signed.** Administrative events can be HMAC-signed and exported as JSON, JSON Lines, or syslog in the RFC 5424 format that SIEM tools ingest. Knowing who did something and being able to prove it later are the same job, and homegrown setups usually only manage the first half.

Bifrost publishes its own benchmarks (roughly 20 microseconds of added latency at 5,000 requests per second), and those are vendor benchmarks run on a vendor harness, so measure your own. The point holds whichever gateway you use: the check belongs on the path, and not copy-pasted into fifteen codebases.

If governance at this layer is the actual problem you are solving, I also went through [the tools in this space](https://www.swapnoneel.site/blog/top-5-ai-agent-governance-platforms) in more detail.

## Where should you set the dial?

The floor is not RBAC, and it is not ABAC either. The floor is being able to answer one question about your own system right now:

**If a credential leaked this minute, what exactly could someone do with it, and how much could they spend before anyone noticed?**

If the honest answer is "everything, and I have no idea", the fix is not a bigger access control model. It is a first cut at all five dimensions, in this order: one identity per caller, then a spending cap on each one, then an expiry date, then a model or resource allowlist, then conditions. That order is deliberate, because knowing who called and capping what they spend buy you the most safety for the least work, and conditions buy you the least.

![Recommended order for setting granular access controls](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/61eygqjuow0cu6nh8hzp.png)

You will not get to per-row, per-tool, per-hour granularity, and you should not try. Nobody is running the theoretically correct permission model. The teams doing well are the ones who pushed the dial two notches past a shared key and then actually maintained it.

Anyway, I am curious where other people drew this line. If you have a permission setup that survived a team getting bigger, or one that collapsed into a shared key by month three, tell me in the comments, I want to hear the failure stories more than the success ones.

You can find me on [X](https://x.com/swapnoneel123), or read the rest of my writing on [my site](https://www.swapnoneel.site).
