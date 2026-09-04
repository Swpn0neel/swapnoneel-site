---
title: "How to Cut Time to First Token (TTFT) in LLM Apps"
date: "2026-09-04T15:49:58.000Z"
description: >-
  Time to first token is the blank-screen wait before your LLM replies. Here is
  how to cut TTFT, from prompt caching to routing, biggest wins first.
slug: reduce-time-to-first-token
link:
  - "https://swapnoneel123.substack.com/p/how-to-reduce-time-to-first-token"
  - "https://swapnoneel.medium.com/how-to-cut-time-to-first-token-in-llm-apps-db376ab4d74a"
  - "https://dev.to/swapnoneel123/how-to-cut-time-to-first-token-ttft-in-llm-apps-b0f"
canonical: "https://www.swapnoneel.site/blog/reduce-time-to-first-token"
cover: >-
  https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/j1oicxsoo0ifd0x86jk9.png
brand: maxim
tags:
  - webdev
  - ai
  - machinelearning
  - performance
---

Whenever you type something into an AI app like ChatGPT or Gemini, and hit enter, you have to stare at nothing for half a second, one second, and sometimes even more. Then the words start pouring out fast. The wait time that you always experience in between these two events is called time to first token, or TTFT, and it is the single thing your users actually feel.

Time to first token (TTFT) is the gap between sending a request and the first token coming back. To cut it, shorten and cache your prompt so the model reads less, stream the reply, keep connections warm, and route around slow providers. The biggest lever is prompt length, since most of that wait is the model reading your input.

Now let me show you where the time actually goes, and how we can fix this. So, let's begin!

## What Time to First Token Actually Is

When you send a prompt, the model does two very different jobs.

First it reads everything you sent. Every token of your system prompt, your chat history, your retrieved documents, your question. It runs all of that through the network in one big forward pass and builds an internal memory of it. This step is called prefill, and nothing comes back to you while it runs.

Then it starts writing, one token at a time. That second phase is where you see text stream in.

TTFT covers the first phase plus everything around it: the network trip to the provider, any time your request spends waiting in a queue, and the prefill itself. Here is the part that matters. On any prompt that is not tiny, prefill dominates, and the more tokens you send, the more [prefill work](https://clickhouse.com/resources/engineering/llm-inference-latency) the model does before it can start. A short prompt starts answering quickly. A prompt stuffed with 8,000 tokens of context makes the reader sit and watch the cursor.

![Illustration of the path from a prompt to the first token](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/2a7hdpvlwqgicugxqn6t.png)

## What Is a Good Time to First Token?

It depends on what the app is for.

The [Modular LLM Inference Handbook](https://handbook.modular.com/llm-inference-basics/llm-inference-metrics) puts it simply: a chatbot usually needs TTFT under 500 milliseconds to feel responsive, and a code-completion tool needs it below 100 milliseconds or it feels broken. A batch job that emails a summary once a day can take five seconds and nobody cares.

So before you optimize anything, decide which of these you are. A chat UI and a background report have completely different budgets, and chasing 100ms on a nightly job is wasted effort.

![Illustration comparing TTFT targets for chat, code completion, and batch work](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/y9jvmyx3gxotsz4y6atd.png)

## The Fixes, Biggest Wins First

Here is the order I actually work through. The early steps cost you almost nothing and pay back the most. The later ones matter, but only after the cheap wins are done. Do not skip to the bottom.

![Illustration of TTFT improvements ranked from measurement to routing](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/rf535slag36i104uuh4q.png)

### 1. Measure TTFT on its own, before you touch anything

You cannot cut a number you are not looking at. And most teams are not looking at this one, because their logging records total response time and stops there. Total time hides TTFT completely, since a slow first token and a slow-typing model both show up as one big number.

So split them. Log the time from request-sent to first-token-received as its own field, separate from the time to finish. Do it at the p50 and the p99, because the average will lie to you and the tail is where users rage-quit.

This is not theory for me. At Zonko Labs I built the internal tool that captured the data logs for Luffy, an AI co-worker that lived in Slack, and turned them into reports on latency and probable slowdowns. The first thing that tool taught everyone was that our "the bot is slow" complaints were almost always a first-token problem, not a typing-speed problem. You only learn that if you measure the two apart.

If your traffic runs through an AI gateway, you can track this without building custom timers in your app. For example, [Bifrost](https://www.getmaxim.ai/bifrost) exports a metric called [`bifrost_stream_first_token_latency_seconds`](https://docs.getbifrost.ai/features/observability/prometheus). It measures TTFT automatically across OpenAI, Anthropic, or any other provider, so you get clean p50 and p99 charts right out of the box.

### 2. Shorten the prompt

This is the biggest lever you fully control, and it is the one no tool can pull for you.

Prefill scales with input length, so every token you delete is prefill work the model never has to do. Look hard at what you are actually sending. Most apps ship a system prompt that grew over months and never got trimmed, a full chat history when the last four turns would do, and RAG retrieval that dumps ten documents when three answer the question.

Cut the system prompt to what the model needs, not what makes you feel safe. Truncate or summarize old history instead of resending all of it. Retrieve fewer, better chunks. None of this is glamorous, and all of it moves TTFT more than the fancy stuff.

Be honest about the tradeoff, though. Cutting context can cost you answer quality, so trim, then check your evals, then trim again. This is the one place where going too far actually hurts, so it earns the care.

### 3. Cache the stable part of your prompt

Most of what you send is the same every single call. The system prompt does not change. The tool definitions do not change. Only the user's question at the end changes. Prefill does not know that, so it re-reads the whole thing every time, unless you turn on caching.

There are two flavors, and they are not the same thing.

Prompt caching, also called prefix caching, is offered by the model providers themselves. It stores the processed form of a stable prefix so the next call reuses that work instead of redoing it, which is what [prefix caching](https://llm-d.ai/blog/kvcache-wins-you-can-see) buys you. Put the parts that never change at the very front of your prompt and the changing question at the end, so the cache has the longest possible prefix to hit.

Semantic caching is the bigger swing. Instead of caching the prompt's prefill, it caches the whole answer, and serves it when a new question means the same thing as an old one. On a hit, you skip the model entirely, so TTFT collapses from "prefill a big prompt" to "look up a vector," which is milliseconds. I wrote a [full explainer on semantic caching](https://www.swapnoneel.site/blog/what-is-semantic-caching) if you want the mechanics.

Let me make the caching point concrete with a small test you can predict.

Call A sends a 3,000-token system prompt that never changes, then a 40-token question at the end. Call B folds the same information into a fresh 3,000-token prompt that gets reworded on every request, then the same 40-token question. Both send roughly the same number of tokens. On the hundredth request, which one has the lower TTFT?

Call A wins, and it is not close. Call A's 3,000-token prefix is identical each time, so after the first call it lives in the prompt cache and its prefill is skipped. Call B looks different to the cache every time, so it pays the full prefill on all one hundred calls. Same token count, wildly different first-token time, decided entirely by whether the front of your prompt holds still. That is the whole game with caching: keep the front stable.

### 4. Stream the response, and know its one limit

Streaming sends each token to the user the instant it is generated, instead of waiting for the full answer. Turn it on. Every serious chat UI streams, and it is a one-line change in most SDKs.

Now the honest part, because it trips people up. **Does streaming reduce TTFT?** No. Streaming does not make the first token arrive any sooner, since prefill still has to finish first. What it changes is everything after that first token, and it changes how fast the whole thing _feels_. People read a streaming reply as faster than a non-streaming one even when the total time is identical, which is why [faster first tokens](https://codeant.ai/blogs/ai-first-token-latency) matter more than total speed.

So streaming is a perception win, not a TTFT win, and the two stack. Streaming only pays off if TTFT is already short, because a three-second blank screen followed by a burst still reads as three seconds of nothing. Fix TTFT first, then stream to make the rest feel quick.

### 5. Keep the connection warm and close

Some of your TTFT is pure plumbing, and it hides where nobody looks.

Every fresh HTTPS connection pays for a TLS handshake before a single byte of your prompt moves. If your app opens a new connection per request, you are paying that tax every time. Reuse connections with keep-alive and connection pooling so the handshake happens once, not on every call.

Distance costs you too. A request from a server in Mumbai to a model endpoint in Virginia spends real milliseconds just crossing the planet and back, twice, before prefill even starts. Pick a provider region near your users where you can, and cut the number of hops between your app and the model. If you are on a serverless setup, watch for cold starts, since a function spinning up from zero can add more delay than the model does.

### 6. Route around slow and rate-limited providers

Here is the failure mode that ruins TTFT and has nothing to do with your prompt. The provider is having a bad minute.

When a provider is overloaded, your request sits in its queue, and queue time is part of TTFT. When you hit a rate limit, you get a 429 and your client backs off and retries, which stacks seconds onto the first token before it ever appears. Neither of these is fixed by shortening your prompt, because the model never even started.

The fix is to not be stuck with one provider. Send the request to the fastest healthy option, and when one starts failing or crawling, fall over to another automatically instead of retrying into the same wall. This is [adaptive load balancing](https://www.swapnoneel.site/blog/what-is-adaptive-load-balancing) applied to model traffic, and it is the difference between one bad provider-minute taking down your p99 and your users never noticing.

## Where a Gateway Does This For You

Let me be honest about what a gateway cannot do first.

A gateway cannot shorten your prompt. It cannot make a provider's GPU run faster. If your app only calls one model and your prompt is already lean, you do not need a gateway for TTFT. You will get much bigger gains just by trimming your system prompt.

Where an AI gateway helps is when you want to handle caching, retries, and monitoring across multiple services without rebuilding them in every backend repo. The gateway sits between your application and your model providers as a reverse proxy, so you wire those fixes once in your infrastructure instead of in your app code.

![Illustration of an AI gateway coordinating caching, metrics, and fallbacks](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/frcs5m2rndvoa1kcu30p.png)

I have used [Bifrost](https://www.getmaxim.ai/bifrost), an open-source AI gateway built in Go, and it handles these levers in one place:

First, it gives you **TTFT metrics out of the box**. Measuring first-token latency manually usually means writing custom streaming wrappers in Python or Node.js to timestamp the first chunk. Bifrost measures `bifrost_stream_first_token_latency_seconds` at the proxy layer for every request, giving you clean p50 and p99 charts across all your providers without extra client telemetry.

Second, it provides [semantic caching](https://docs.getbifrost.ai/features/semantic-caching). If a user asks a question that matches a previous one, Bifrost serves the answer straight from cache in about 10 to 15 milliseconds. That turns an 800-millisecond prefill wait into almost nothing. Plus, cache writes happen asynchronously in the background, so cache misses do not add any latency to your stream.

Third, it runs **automatic fallbacks**. When a provider is overloaded or returns a 429 rate limit, your request sits in a queue and your TTFT spikes. With Bifrost, you can set fallback rules: if your primary model hangs or errors, it instantly shifts the request to a healthy backup provider instead of leaving your user staring at an empty screen.

Finally, there is the question of **proxy overhead**. Adding a gateway puts an extra hop in your network path. If that hop adds 30 or 50 milliseconds, it defeats the entire purpose of optimizing latency. Bifrost is written in Go and adds around 20 microseconds of overhead under load, meaning the hop itself is practically invisible.

You still have to fix your prompts first. But once your prompts are clean, putting a gateway in front of your models lets you handle caching, fallbacks, and latency tracking through simple configuration instead of messy glue code.

## Start Here

If you do nothing else from this whole post, do three things, in this order.

Measure TTFT as its own metric, so you stop flying blind. Shorten and cache your prompt, because that is where the biggest, cheapest wins live. Then stream, so the rest of the answer feels fast.

![Illustration of the three steps to reduce TTFT](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/ffbxbe31nm566wdsjr83.png)

The truth most infrastructure posts bury is that for an app that calls an API, time to first token is mostly about prompt length and caching, not about exotic GPU tricks you will never touch. The GPU tricks are real, but they belong to the people running the models. Your levers are the prompt you send, the cache in front of it, and the route it takes. Those you own completely.

Start by logging your p50 and p99 first-token time this week. I would bet the number surprises you, and I would bet a fat system prompt is the reason.

If you have a TTFT horror story, or a fix that worked that I left out, tell me. I am [@swapnoneel123](https://x.com/swapnoneel123) on X, and I write more of these on [my site](https://www.swapnoneel.site).
