---
title: "What Is an MCP Registry? Discovering & Governing MCP Servers"
date: "2026-09-03T17:01:44Z"
description: >-
  What is an MCP registry? It helps you discover MCP servers, but not govern them. How discovery works, why it isn't security, and where a gateway fits.
slug: what-is-an-mcp-registry
link:
  - "https://swapnoneel123.substack.com/p/what-is-an-mcp-registry"
  - "https://swapnoneel.medium.com/what-is-an-mcp-registry-f01042213324"
  - >-
    https://dev.to/swapnoneel123/what-is-an-mcp-registry-discovering-governing-mcp-servers-2dd3
canonical: "https://www.swapnoneel.site/blog/what-is-an-mcp-registry"
cover: >-
  https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/rn9r5gkpkapsxcflqcaf.png
brand: maxim
tags:
  - opensource
  - webdev
  - ai
  - security
---

Most people consider an MCP registry as "npm for MCP servers." It is a nice line to explain the concept, but it is partially true and extremely half-baked.

An MCP registry is a searchable catalog of MCP servers. It stores metadata, like a server's name, where to install it, and how a client should connect, so an AI agent or a developer can find servers to plug in. But here is the part the npm comparison hides: a registry is a discovery layer, not a trust layer. It tells you a server exists. It does not tell you the server is safe, or that your agents should be allowed to run it.

That gap between "I found it" and "I trust it" is where teams get burned. Discovering MCP servers and governing MCP servers are two different jobs, and a registry only does the first one. So let's get both straight.

> If you want to know more about what an MCP server is and how it works, I wrote a [beginner's guide to MCP servers](https://www.swapnoneel.site/blog/what-is-an-mcp-server) first. This post picks up where that one left off.

## What an MCP Registry Actually Is

An MCP registry is a metadata catalog. It does not hold the server's code. It holds a small record that describes the server and points to wherever the code actually lives.

![A searchable MCP registry catalog with server metadata cards.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/50ddyc6s28ybregird9b.png)

This trips people up, so let me separate the two clearly. Your code lives on a package registry: npm, PyPI, Docker Hub. That is where the actual bits get downloaded from. The MCP registry sits one level up and just stores a pointer. For example, a `weather-mcp` package can live on npm, and the MCP registry entry maps "weather v1.2.0" to `npm:weather-mcp`. The registry is the index card. npm is the shelf.

Each entry follows a standard shape called `server.json`. It records the server's unique name, where to find it (an npm package name, or a remote server URL), how to run it (command-line args, environment variables), and some discovery data like a description and what the server can do. That is it. A registry is a stack of these `server.json` cards, plus an API to search them.

And that is genuinely useful. Before any of this, finding an MCP server meant scrolling GitHub READMEs and random Discord links. A registry turns that into one queryable list. But notice what a stack of index cards can and cannot do for you, because that is where the trouble starts.

## The Official MCP Registry

The one most people mean by "the MCP registry" is the [official MCP Registry](https://registry.modelcontextprotocol.io), which launched in preview on [8 September 2025](https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/). It is open source, and it is backed by a serious group: Anthropic, GitHub, PulseMCP, Microsoft, and others.

Its job is deliberately narrow. In the maintainers' own framing, it is a centralized metadata repository, and the metadata it stores is intentionally unopinionated. It does not rank servers, and it does not review or rate them. It just holds the `server.json` records and serves them over a REST API.

![The official MCP Registry shown as a shared metadata source.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/i22v87okxx5uvd00vqpj.png)

Here is the design choice that matters most, and almost nobody mentions it. The official registry is not really built for your app to read directly. It expects to be consumed by "downstream aggregators", which pull its data on a schedule (say, once an hour) and then layer their own curation, ratings, or search on top. The registry is the wholesale source of truth. The nice front-ends you actually browse are meant to be built by other people.

And in practice, as of 2026, most MCP clients still do not read the registry directly as a built-in source. So for now you usually meet it through one of those aggregators, not through your agent going and querying it live.

Two more things worth knowing early. First, the official registry does not host private servers, so an internal `mcp.acme-corp.internal` server has no place there. Second, it is in preview, which means data can reset and the shape can still change. So treat it as a fast-moving foundation, not a finished product.

## MCP Registry vs Marketplace vs Gateway

This is the question I see confused most, so let me draw the lines hard. These are three different things doing three different jobs.

A **registry** is discovery in its rawest form. It answers one question: what servers exist, and how do I connect to them? It is a passive list.

A **marketplace** is discovery made pleasant. Sites like [Smithery](https://smithery.ai), Glama, and mcp.so give you search, categories, install buttons, and community ratings. Increasingly they read from the official registry underneath and add their own polish on top. A marketplace is a registry with a nice storefront and an opinion.

A **gateway** is something else entirely. It is not about finding servers, it is about controlling them at runtime. A gateway sits in the traffic path between your agents and your MCP servers, and it enforces the rules every time a call is made: who is allowed to use this tool, how often, at what cost, with what data. A registry is a directory. A gateway is a checkpoint.

![A registry directory, marketplace storefront, and runtime gateway checkpoint.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/uuwk5bjxm48xciuypotn.png)

The one line to remember: a registry without a gateway gives you discovery but no runtime governance. Your agents can find tools, but nothing stops an unauthorized call once they connect. Hold onto that, because it is the seam the rest of this post walks through.

## How Discovery Actually Works

So how does a client go from "I need a GitHub server" to a running connection? Through the registry API and the `server.json` record, and the interesting part is how it proves a server is who it claims to be.

![MCP server discovery from verified namespace to connection.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/zednfcf3a863ewj396eg.png)

Server names use a reverse-DNS format: `io.github.username/server-name`, or `com.example/server`. That name is not decorative. It ties the server to a namespace that the publisher had to prove they own, through GitHub or DNS verification. If you publish under `io.github.swpn0neel/*`, the registry made you show you actually control that GitHub account first. So a name is a small ownership claim, verified at publish time.

Here is the piece that makes the whole thing extensible. The registry ships an [open OpenAPI spec](https://modelcontextprotocol.io/registry/about), which means anyone can stand up their own registry that speaks the exact same interface. A public marketplace can implement it. A company can implement a private one for internal servers. Any MCP client that already knows how to talk to the official registry can talk to those too, with no extra work. One shape, many registries.

That design is genuinely clever, and it is also exactly why governance cannot live at this layer. A standard that lets anyone publish, and lets anyone run a compatible registry, is a standard optimized for reach, not for safety. Openness and vetting pull in opposite directions, and the registry picked openness on purpose.

## Discovery Is the Easy Half

So that is discovery, more or less solved. You have a standard catalog, verified namespaces, an API, and a way to run your own copy.

But discovery was always the easy half of the title. The hard half is governing what those servers actually do once your agents start calling them, and that is a problem a catalog structurally cannot touch. Let me show you why with one concrete example.

![A discovery catalog ending before runtime governance begins.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/a8xm1mq9er7negb7t9pk.png)

## What a Registry Does Not Protect You From

Say you tell your coding agent, "add the Slack MCP server." It searches, finds a package named `slack-mcp-server`, sees an install command that looks completely official, and wires it in. Feels routine. Now walk that one action through each layer and watch where it does, and does not, get stopped.

![A verified registry entry beside a hidden security risk.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/3ipt2u41nve3knvc35mw.png)

**Did the registry catch it?** No, and this is by design. The official registry [delegates security scanning](https://modelcontextprotocol.io/registry/about) to the underlying package registries and to downstream aggregators. Its own job is namespace authentication and metadata hosting. So namespace verification proves the publisher owns the name they used. It does not prove the code behind that name is safe. A registry entry is a verified business card, not a background check.

**So typosquatting still works.** This is not hypothetical. Security researchers have already documented [look-alike PyPI packages](https://www.speakeasy.com/resources/mcp-tool-poisoning) like `slack-mcp-server` and `slack-mcp-server-v2`, whose install commands look official but are not. A name that reads as legitimate is not the same as a source you vetted, and a catalog optimized for discovery will happily list both.

**And the tool itself can lie.** The nastier class is tool poisoning: a malicious server hides instructions inside a tool's description, so when the model reads "what can you do?", it also reads "and quietly send recent messages to this URL." The model sees a normal tool. The registry saw a normal `server.json`. Neither one inspected behavior, because inspecting behavior is not what either one does.

**Then there is the rug pull.** A server can be perfectly clean the day it is approved and turn malicious three versions later. A registry records the new version. It does not re-judge it. This exact risk is why security researchers keep arguing that tool updates should [trigger re-review](https://arxiv.org/pdf/2506.01333) instead of being trusted automatically.

None of this means the registry is broken. It means the registry is doing its one job, discovery, and quietly handing you a job it was never built to do: deciding what to trust, and enforcing that decision on every call. That job has to live somewhere else.

## Do You Need a Private MCP Registry?

For a lot of teams, the first real answer to the trust problem is a private registry. And it genuinely helps, so let me be fair to it before I tell you where it stops.

A private, internal registry is an allowlist. Instead of letting agents pull from the open catalog, your platform team curates a list of vetted servers, mixes in your own internal ones, and points every agent at that. Because it implements the same OpenAPI shape, your existing clients keep working. This is the model enterprise registry products (Kong's, Portkey's, and others) are built around, and for regulated or multi-team setups it is close to mandatory, because a community catalog was never meant to carry your compliance requirements.

![A private registry as a curated internal MCP server allowlist.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/u9rcbgnto1tedc55k1jr.png)

So a private registry moves the trust decision to a place you control. That is a real upgrade over pulling from the open internet.

But look closely at when it acts. A private registry governs discovery time: what a developer or agent is allowed to install and see. It does not govern runtime: what an approved server actually does on each individual call. Once an agent is connected to a vetted server, the registry is out of the loop. It cannot cap how much that agent spends, cannot say "this key may read files but never delete them," and cannot stop a poisoned tool description that slipped through your review. It curated the shelf. It is not standing at the counter.

You still need something in the traffic path.

## Where the Gateway Comes In

Here is the honest part first, because it decides whether you should even read this section. If you are running one or two MCP servers you trust, you do not need a gateway. A registry, or even a hardcoded config, is plenty. A gateway earns its place when you have many servers, many agents, and real consequences if one of them misbehaves. And a gateway cannot vet server code for you either, so nothing here removes the need to review what you run.

For a few months I was the first layer of testing for an AI co-worker that lived inside Slack, catching its mistakes before the real users did. The lesson that stuck with me is simple: you cannot govern what you only hear about after the fact. Governing has to happen at runtime, in the path, while the call is being made.

What a gateway adds is the one thing a registry structurally cannot: enforcement on every call, at runtime. That is where [Bifrost](https://www.getmaxim.ai/bifrost), an [open-source AI gateway](https://github.com/maximhq/bifrost) built by Maxim AI, fits the picture. It can act as an [MCP gateway](https://docs.getbifrost.ai/mcp/gateway): you connect all your MCP servers to Bifrost, and your agents connect to Bifrost instead of to each server directly. One endpoint in front of everything, sitting exactly where the checks need to happen.

![An MCP gateway controlling calls between agents and servers.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/qs9x9rz2fbirqpw1blod.png)

Once you are in that position, three things change.

First, access stops being all-or-nothing. Bifrost filters tools per virtual key, so a given key only sees the tools you explicitly listed for it. You configure it plainly: a client named `filesystem`, with `tools_to_execute` set to `["read_file", "list_directory"]`, and that key can do exactly those two things and nothing else. It is deny-by-default. The read-only agent literally cannot see a delete tool, so a poisoned or over-eager call has nothing to grab.

Second, the token problem gets solved instead of tolerated. Remember how a registry lets you connect dozens of servers? Once you do, every request stuffs every tool's description into the model's context, and with 150-plus tools the model burns most of its budget just reading the menu. Bifrost's [Code Mode](https://docs.getbifrost.ai/mcp/code-mode) fixes this by exposing four generic meta-tools and letting the model write code to discover and run what it needs on demand, instead of pre-loading every definition. In their own benchmark of 508 tools across 16 servers, that cut input tokens by up to 92.8%, from 75.1M tokens down to 5.4M, while keeping a perfect pass rate. That is a vendor benchmark on a vendor harness, so weigh it as one, but the mechanism is sound and the direction is not subtle.

Third, control lives in one place. All your keys and connections sit behind the gateway instead of scattered across config files, and you can attach [budgets and rate limits](https://docs.getbifrost.ai/features/governance/virtual-keys) to each virtual key, so an agent that goes haywire hits a spending cap instead of your invoice. This is the runtime governance the registry handed off. The registry told your agents what exists. The gateway decides what is allowed, every single time.

So the two are not competitors. A registry and a gateway are the two halves the title promised, and they sit at different points in the flow: the registry at discovery, the gateway at runtime.

## What Do You Actually Need?

Let me put it as plainly as I can, because the whole post comes down to one distinction.

A registry answers "what exists?" A gateway answers "what is allowed?" You will eventually want both, and the mistake I see most is assuming that a shiny catalog, public or private, has solved the second question. It has not. It was never trying to.

![A practical path from discovery to runtime governance.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/l26d4gjc9hd97mgyq20n.png)

So here is the path I would actually take. If you are just exploring, use the official MCP registry or a marketplace to find good servers, and keep the count small. If you are a team standing this up for real, add a private registry so you control what gets discovered in the first place. And the moment agents are making real calls with real credentials and real budgets, put a gateway in the traffic path, because that is the only layer that can enforce a decision at the moment the decision matters.

Discovery is a catalog problem. Governance is a runtime problem. Solve them in the right places and MCP stops feeling scary. Try to solve governance with a directory, and you will find out the hard way that an index card never stopped anybody from doing anything.

I run coding agents like Claude Code every day, and my own MCP config has quietly grown from one server to a small pile without me really deciding to. That drift is exactly how this bites you, one harmless-looking addition at a time. So if you have hit the same sprawl, I would genuinely like to hear how you are handling it. Drop a comment, or come find me on [X](https://x.com/swapnoneel123) and let's compare setups.
