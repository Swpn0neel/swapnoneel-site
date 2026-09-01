---
title: 'AI Observability Explained: What It Is and How It Works'
date: '2026-08-18T06:25:25.000Z'
description: >-
  AI observability is how you see inside a non-deterministic system. What to
  trace on every call, why logs are not enough, and where it belongs.
slug: ai-observability-explained
link:
  - "https://swapnoneel123.substack.com/p/ai-observability-explained"
  - "https://swapnoneel.medium.com/ai-observability-explained-how-to-trace-evaluate-and-control-ai-systems-20052eef3bad"
  - "https://dev.to/swapnoneel123/ai-observability-explained-what-it-is-and-how-it-works-487"
canonical: 'https://www.swapnoneel.site/blog/ai-observability-explained'
cover: >-
  https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/81g9z5hg0w76ysc9c7um.png
brand: maxim
tags:
  - webdev
  - beginners
  - ai
  - devops
updated: '2026-08-21T18:03:35.610Z'
---

Traditional monitoring rests on one quiet assumption that nobody ever writes down: the same input gives you the same output. Something breaks, you replay the request, you watch it break again, you fix it.

Now send the same request to a model twice. You get two different answers, and neither one of them threw an error.

**AI observability** is the practice of recording what happened inside an AI system on every request: the prompt, the model version, tokens, cost, latency, tool calls, and a judgement of whether the output was any good. Monitoring tells you the service is up. Observability tells you why it answered that way.

That gap is the whole story here.

## Why your current monitoring stack misses all of this

Your existing setup is watching for crashes. Status codes, error rates, p99 latency, memory. All of it is designed around the idea that a broken thing looks broken.

An AI feature failing looks nothing like that. It returns HTTP 200 in 900ms, with grammatically perfect prose that happens to be wrong, or that quietly ignored the document you retrieved for it, or that called the refund tool when the user only asked a question.

Your dashboard sees a healthy service, because by every measure it has, the service is healthy.

And there are whole categories of failure your stack has no field for. It has nowhere to put "this response cost 14 cents", or "the model version changed under us last Tuesday", or "the retrieved context was garbage". Those are not infrastructure facts, and standard telemetry was never built to carry them.

![Why standard monitoring misses AI quality failures](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/72i1wisqwyz7zwvurepu.png)

Something has to hold those fields instead, which is the entire reason this tooling exists. [Bifrost](https://docs.getbifrost.ai/overview) is Maxim AI's high-performance, [open-source AI gateway](https://github.com/maximhq/bifrost) that unifies access to 20+ providers through a single OpenAI-compatible API. My team uses it, so I will use it as the example throughout this post. Because the source is public, anything I claim about what it records per request is something you can check line by line.

## What one AI request actually looks like when you trace it

This is the part that made it click for me, so let me walk through a real shape.

At [Keploy](https://keploy.io) I built a retrieval-augmented chatbot over their documentation, using vector embeddings, so developers could ask a question instead of hunting through pages. A single question to something like that is not one operation. It is a chain, and a trace is just that chain written down.

One request breaks into spans, where a **span** is one step with its own start time, end time, inputs and outputs:

1. The user's question comes in and opens the root span.
2. The question gets embedded into a vector. That is a span, with its own model and its own cost.
3. The vector search runs and returns, say, five chunks of documentation. That is a span, and the important bit is that it records _which_ five chunks came back.
4. Those chunks get stuffed into a prompt template along with the chat history.
5. The model call goes out. This span carries the model name and version, the temperature, the prompt tokens, the completion tokens, the cost in dollars, the total latency, and the time to first token.
6. If the model calls a tool, every one of those is its own child span too.

Now here is why anybody bothers with all that plumbing.

When the bot gives a bad answer, you do not have to guess. You open the trace and look at step 3. If the vector search pulled back five irrelevant chunks, your problem is chunking or embeddings, and the model did nothing wrong. If the search pulled back exactly the right documentation and the model still answered from thin air, your problem is the prompt.

Two completely different fixes, and without the trace you cannot tell them apart. All you have is "the bot said something dumb", which is the single most useless bug report in the world.

## The things worth capturing on every call

You will notice I have not called this section "the three pillars of observability". Everyone else writing about this does, and I dropped it on purpose, because logs, metrics and traces is a framing built for deterministic systems and it has no slot at all for "was the answer any good".

![The telemetry worth capturing on every AI call](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/3s0utdi83ubyijnvze1x.png)

So here is the actual list:

- **The full prompt and the response**, as they really went over the wire, after every template and system message got assembled. Not the template, the final text.
- **Model, version and parameters.** Providers ship silent updates. If you cannot say which exact version answered a request, you cannot explain last month's regression.
- **Tokens in, tokens out, and cost in dollars** per request, attributed to a user or a feature.
- **Latency, split into total time and time to first token.** Those two numbers feel completely different to a user, and one can get worse while the other improves.
- **Tool calls, retries and fallbacks.** Which key was tried, what failed, what it fell back to.
- **A trace ID that ties the whole chain together**, and ideally a session or user identifier so you can reconstruct a full conversation.
- **A quality score**, attached after the fact. More on that next.

I built one of these myself earlier this year, an internal tool at a contract role that captured an AI product's logs and turned them into reports on latency and probable slowdowns (keeping it vague on purpose, cannot say much more than that). The honest takeaway was not that the tool was clever. It was that a team can ship for months on vibes, and the moment somebody puts the per-request numbers on a screen, problems nobody previously had words for suddenly have words.

## How do you measure quality when there is no right answer?

Well, you do not measure it the way you measure a unit test, because there is no expected string to compare against.

The industry has mostly settled on three overlapping things. **LLM-as-judge**, where you send the input and output to a second model with a rubric and it scores relevance or faithfulness or tone. It is imperfect, and it is far better than nothing. **Human annotation** on a sample, which is slow, expensive, and still the ground truth everything else gets calibrated against. And **implicit user signals**, like thumbs, edits and retries, which are noisy but free.

Run those continuously and you get **drift detection**, which is just the same score measured over time. When your faithfulness score drops 8 points over two weeks and nobody deployed anything, something moved underneath you, and that is usually the model provider.

![Three ways to measure AI output quality](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/rhkiusbk7ev7rfgmtj6c.png)

This is the half most teams skip, and there are numbers on it. In LangChain's [2026 State of Agent Engineering report](https://www.langchain.com/state-of-agent-engineering), which surveyed 1,300+ practitioners, 89% said they had observability running on their agents while only 52% were running evaluations. So most people are recording what happened and still have no systematic opinion on whether it was good.

Which is also why I keep saying you cannot test an AI feature the way you test code. I went into that failure mode properly in my post on [testing AI coding agents](https://www.swapnoneel.site/blog/testing-ai-coding-agents).

## Where AI observability actually lives in your stack

Two choices here, and you can do both.

You can instrument your application directly, wrapping every model call in your own code. That gives you the most context, because your code knows what the user was doing. It also means every service, every language and every framework has to be instrumented separately, and someone has to keep it consistent.

Or you put it in the gateway. If all your model traffic already goes through one proxy, that proxy sees every request and every response by definition, and you get telemetry for services you never touched.

And the reason you can do both without doubling the work is that there is finally a shared standard. The [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/blog/2026/genai-observability/) define agreed attribute names for exactly this, like `gen_ai.request.model`, `gen_ai.usage.prompt_tokens` and `gen_ai.usage.cost`. Emit those and your AI spans slot into the same traces as the rest of your system, in whatever backend you already pay for.

Bifrost is a reasonable thing to look at here, since it does both halves. It records inputs, outputs, tokens, cost and status for every call into SQLite or Postgres with a dashboard on top, and it exports OpenTelemetry spans using those GenAI conventions plus native Prometheus counters like `bifrost_input_tokens_total` and `bifrost_cost_total`. The logging runs in background goroutines, which is why [its documentation](https://docs.getbifrost.ai/features/observability) puts the added overhead under 0.1ms per request.

That last detail is the pattern to steal, whichever tool you end up picking. Telemetry gets emitted off the hot path, after the response is already on its way back to the user. Observability that slows down the thing it observes gets switched off within a week.

The routing side of that same gateway is worth knowing about too, and I covered it in my post on [adaptive load balancing](https://www.swapnoneel.site/blog/what-is-adaptive-load-balancing).

## What it costs you to run

Now the uncomfortable part, because none of this is free.

![The storage, privacy, and attention costs of observability](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/78xs5rtn8pt5huvu3cyl.png)

**Storage adds up fast.** You are storing full prompts and full responses, and prompts got long. A retrieval app can easily push 8,000 tokens of context per call. At real traffic that is a serious volume of text, and this is where sampling comes in: keep 100% of errors and slow requests, keep a small percentage of the healthy ones.

**Your prompts contain user data.** Every support chat, every uploaded document, every email a user pasted in. The moment you log all of it, your observability store is now a system holding personal data, with all the retention and access rules that implies. Redact at the point of capture, not later.

**And someone has to actually look at it.** This is the one that quietly kills the whole effort. The traces get collected, the dashboard gets built, nobody opens it, and six months later it is a very expensive write-only database.

## Frequently asked questions

**Is AI observability the same as LLM monitoring?** Close, and monitoring is the narrower one. Monitoring tracks known metrics like uptime, latency and error rate, and answers "is it working". Observability keeps enough per-request detail that you can answer questions you had not thought of yet, like "why did this one user get that answer". In practice most tools sell both under one name.

**Do I need OpenTelemetry for this?** No, but it is the sensible default in 2026. The GenAI semantic conventions mean your AI spans use the same attribute names everywhere, so you can change vendors without reinstrumenting, and your model calls appear inside the same traces as your database queries. Note that parts of the spec are still marked experimental, so pin your versions.

**What is the difference between observability and evals?** Evals are the measurement, observability is the pipe. Evals score whether an output was good; observability captures the request, the context, the cost and the trace so the score has something to attach to. You can run evals offline in CI against a fixed dataset, but you can only run them on real traffic if the traffic is being recorded.

## So what should you actually do?

If you have an AI feature in production right now and you cannot pull up the exact prompt, the model version and the cost of a request from last Tuesday, that is the gap, and it is worth a day of your week.

Start with capture, and not with dashboards. Get every request logged with its prompt, response, model, tokens, cost and a trace ID, put it wherever you already look at data, and give it two weeks. You will find something. Everyone does. Quality scoring, drift alerts and per-feature cost budgets are worth adding later, but every one of them sits on top of the boring capture layer, so there is no point doing them first.

If your model calls already go through a gateway, turn on the telemetry it ships with before you write any of this yourself. That is the single highest-value hour available to you here, and it is mostly a config change.

![Capture first, then add quality, drift, and cost controls](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/0jqt2fv5869zcc74abon.png)

That is my read on it, and your setup might look nothing like mine. If you have built this kind of tracing yourself, or you have had an AI observability bill genuinely surprise you, drop it in the comments, I would like to hear how it went.

You can find me on [X](https://x.com/swapnoneel123) where I post about most of what I am building, and the rest of my writing lives at [swapnoneel.site](https://www.swapnoneel.site).
