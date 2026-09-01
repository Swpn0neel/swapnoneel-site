---
title: 'What Is Semantic Caching, and Where It Quietly Breaks'
date: '2026-08-19T17:39:37.000Z'
description: >-
  Semantic caching serves cached LLM answers to queries that only match in
  meaning. How it works, the threshold trap, real hit rates, and when to skip
  it.
slug: what-is-semantic-caching
link:
  - 'https://swapnoneel123.substack.com/p/what-is-semantic-caching'
  - 'https://swapnoneel.medium.com/what-is-semantic-caching-2e4de93e25b0'
  - >-
    https://dev.to/swapnoneel123/what-is-semantic-caching-and-where-it-quietly-breaks-514o
canonical: 'https://www.swapnoneel.site/blog/what-is-semantic-caching'
cover: >-
  https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/5a8qgzs3aik93kw5cln9.png
brand: maxim
tags:
  - webdev
  - beginners
  - ai
  - performance
updated: '2026-08-25T03:44:38.334Z'
---

Two people open your support chatbot within the same minute. One types `How do I reset my password?` and the other types `i forgot my password, how do i get a new one`.

Same question, same answer, two full model calls, and your Redis cache stores both as separate keys without ever hitting on either.

**Semantic caching** stores past LLM responses and serves them to new queries that mean the same thing, even when the words are completely different. It works by turning every query into a vector, searching for the nearest stored vector, and returning that cached answer if the similarity clears a threshold you set.

## Why your existing cache does nothing for LLM traffic

Every cache you have ever written works on exact equality. You take the request, hash it, look up the hash, and either the bytes match or they don't. Redis and Memcached both work this way, and so does the HTTP layer sitting in front of them. It works brilliantly.

It works because the traffic it was designed for is machine-generated. `GET /api/users/42` is always spelled the same way by the same client, every time.

![Exact matching misses equivalent questions](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/3v3qhwmra038m9m4xgsp.png)

Human language is not like that. People can ask for a refund policy in many ways, and a hash function treats each wording as a different key. One extra space, one lowercase letter, one "please" at the end, and you get a completely different key.

So your hit rate on natural language collapses to nearly zero, and you go on paying for the same answer over and over.

Semantic caching fixes the matching function instead of the cache. The storage stays boring. What changes is that you stop asking "are these two strings identical" and start asking "are these two strings close enough in meaning".

The difficult part is deciding what counts as **close**.

## How semantic caching works

The rule in plain English:

*Turn the question into a point in space. Look for the nearest point we have already answered. If it is near enough, reuse that answer.*

In practice, it takes five steps:

1. A query comes in.
2. You send it to an embedding model, which returns a vector of floats.
3. You search your vector store for the nearest stored vector, using cosine similarity.
4. If the best match scores above your threshold, you return the stored response and never call the model at all. That's a cache hit.
5. If nothing clears the threshold, you call the model, return the real answer, and write the query vector plus the response into the store with an expiry time.

![The five-step semantic caching pipeline](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/1qpab5iqbnfib7t76sfx.png)

In code it is almost insultingly short:

```python
def ask(query, threshold=0.92):
    vec = embed(query)                         # step 2
    match, score = store.nearest(vec)          # step 3

    if score >= threshold:                     # step 4
        return match.response                  # cache hit, zero model tokens

    answer = llm.complete(query)               # step 5, cache miss
    store.put(vec, answer, ttl=3600)
    return answer
```

Notice what step 4 is really doing. It is taking a floating point number and using it to decide whether a human being gets a fresh answer or a recycled one. There is no other logic in this system, no parsing and no intent classification, nothing else that ever looks at what was actually asked.

If you want the mechanics of what `store.nearest` is doing underneath, I built one of these from scratch, cosine similarity and the HNSW graph and all, in my post on [building a vector database from scratch](https://www.swapnoneel.site/blog/build-vector-database-from-scratch). The short version is that it is an approximate nearest neighbour search, so it is fast, and it is also allowed to be a little bit wrong.

## The similarity threshold is the whole product

![One threshold, two opposing failure modes](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/vx141iz8mc6jumndcpk8.png)

Consider three pairs of queries and how an embedding model scores them.

Pair one. `What is your refund policy?` and `Can I get my money back?` Different words, same intent. This one **should** score high, and it does.

Pair two. `Show me the sales numbers for Q1 2025` and `Show me the sales numbers for Q3 2024`. Almost identical strings, completely different answers. You would want this to score low. It does not. It scores extremely high, because most of the tokens are shared and the embedding barely notices which quarter you asked about.

Pair three. `Is this drug safe for pregnant patients?` and `Is this drug not safe for pregnant patients?` One word apart, opposite meaning.

Embedding models are often poor at handling negation. A [validity audit published in August 2026](https://arxiv.org/html/2608.10216) tested 9 encoder configurations and found that negation and antonym pairs score **above** genuinely similar pairs on every model tested, at average cosines of **0.93 to 0.999**. In the production system that paper audits, flipping an instruction from "withhold the study drug" to "administer the study drug" scored **0.9608**, and the safety gate that existed specifically to catch that never fired.

The reversed instruction scored higher than most legitimate paraphrases would.

A threshold like 0.92 does not cleanly separate "same question" from "different question". What it often separates is **surface form**, and surface form is not meaning. Two sentences that share a grammatical frame and differ in one date, one entity, or one negation will sit above almost any threshold you are willing to set.

That's the trap. Raise the threshold to 0.98 and you kill your hit rate, because honest rephrasings stop matching. Lower it to 0.85 and you start serving Q3 2024's numbers to someone asking about Q1 2025. There is no single number that fixes both, because the failure is in the measurement and not in the cutoff.

What helps is refusing to let similarity be the only gate. Partition the cache by anything the embedding is bad at holding: user, tenant, model, and any structured parameter your queries carry. If dates and IDs are pulled out into the cache key instead of being left sitting inside the prose, the embedding never gets a chance to blur them.

## Semantic caching vs prompt caching vs KV caching

![Three caching layers at different depths](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/o2albu3d51p4reqzb2w0.png)

These three names get used interchangeably online, but they refer to different layers.

**KV caching** lives inside the GPU. During inference the model computes key and value tensors for every token in your context, and the KV cache keeps them around so the next token does not need to recompute attention over everything before it. This is always on, you do not configure it, and it is the reason generation gets faster after the first token.

**Prompt caching**, sometimes called prefix caching, is what OpenAI and Anthropic sell you at the API level. It reuses those KV tensors across requests when two requests share a common prefix. So if you send a 4,000 token system prompt on every call, the provider can skip recomputing it and charges you less for those tokens. Important detail: it matches on **exact prefix bytes**, so two prompts that mean the same thing but start differently will miss it entirely.

**Semantic caching** sits in front of the model, in infrastructure you control. It stores whole request and response pairs and matches on meaning. When it hits, you save 100% of the call, because the model is never invoked.

You can use all three together. A request can try the semantic cache first, fall through to the provider's prompt cache on a miss, and only then pay for full inference. Semantic caching is the outer layer, so it is also the one you control.

## What is a realistic cache hit rate?

![Real-world hits are a minority of requests](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/u8og1qce297e7399xh0h.png)

This is where I want to be blunt, because the marketing on this topic is bad.

You will see 95% quoted constantly. Trace that number back and it almost never refers to hit rate. It refers to **match accuracy**, meaning the cached response was correct 95% of the time it was served. Those are entirely different claims, and the second one tells you nothing about how much money you saved.

Actual production numbers are much lower. A [breakdown of real deployment data](https://dev.to/gauravdagde/llm-semantic-caching-the-95-hit-rate-myth-and-what-production-data-actually-shows-8ga) puts typical hit rates at **20 to 45%**, with Portkey seeing around 20% on retrieval-augmented workloads and an EdTech platform hitting about 45% on student question-and-answer traffic. Open-ended chat sits at 10 to 20%, because open-ended chat is genuinely open-ended.

Academic results land in a similar band. The [GPT Semantic Cache paper](https://arxiv.org/pdf/2411.05276) reports cutting API calls by up to **68.8%**, but that is on query categories picked for repetition, which is exactly the workload where this technique looks its best.

Even a 20% hit rate can matter. On a $5,000 monthly bill, that is $1,000 saved. A cache hit returns in under 5 milliseconds instead of the 2 to 5 seconds a real completion takes, so the speed difference may matter even more than the cost.

Set expectations using your own traffic.

## What semantic caching costs you to run

![Every request pays the semantic lookup toll](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/ux3cdjdufpwk8zivmwo1.png)

You pay for an embedding call and a vector search on **every request**, including the 60 to 80% that miss. Embeddings are cheap compared to a chat completion, so the money side is fine. The latency is the thing to watch, because you have just added a network round trip to the front of every request in your system, including all the ones the cache cannot help with.

At [Keploy](https://keploy.io) I built a retrieval-augmented chatbot over their documentation using vector embeddings, and docs traffic is close to the best case for this technique. People ask the same twenty questions in fifty phrasings, forever. Even there, you trade a small cost on every request for a larger saving on the requests that hit. Measure that ratio before assuming the cache pays off.

Then there is staleness. Your cache does not know your prices changed on Tuesday. The stored answer is a frozen snapshot of what the model said, plus whatever context it was given at the time, and it keeps being served until its expiry time runs out. Short expiry times are safer and hit less. Long ones are the opposite. Pick deliberately.

Multi-turn conversations are worse. A follow-up like "and what about the second one?" embeds to almost nothing useful, because the meaning lives in the previous four messages and not in that sentence. The safer approach is to stop caching after a few turns of history.

And you now operate a vector store. That is one more thing to size, monitor, and pay for.

## One cache, many tenants, and the leak nobody plans for

This is the part that turns semantic caching from a performance feature into a security decision, and it is why I would not hand-roll one at the application layer in an enterprise setting.

A semantic cache with one global namespace returns the nearest previous response across every user in it. Not the nearest response *belonging to that user*. The nearest one, period.

Picture two customers of the same SaaS product asking structurally similar questions about their own account data. Their prompts embed within 0.93 cosine of each other because they are the same question about different companies, and the cache hands one customer the other's cached answer. Nothing errors or logs a violation. It looks like a successful cache hit, making the leak hard to detect.

![A shared cache can cross tenant boundaries](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/bflbiben9y76am58s2yq.png)

There is a subtler version too. Even with no wrong response served, cache hits are dramatically faster than misses, and that timing difference is observable from outside. Somebody probing your API can learn which questions have already been asked by other tenants just by watching time to first token.

The fix is not clever, it is structural. The cache key has to be partitioned by a tenant identifier resolved from something you trust, meaning the API key, a virtual key, or a signed token claim. Never from the request body, because the request body belongs to the attacker. And the lookup has to be scoped to that namespace so a cross-tenant match is not merely unlikely, it is unreachable.

This is why I prefer to handle semantic caching once at the gateway instead of rebuilding tenant isolation inside every service.

## When should you not use semantic caching?

![Some workloads should bypass semantic caching](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/bca2riv6xiz4clpbngq4.png)

**Anything that must be current.** Live inventory, account balances, order status. A stale answer here is worse than a slow one.

**Anything where the parameters matter more than the phrasing.** Analytical queries over dates, IDs, and entities are precisely where embeddings blur the thing you needed preserved. If you cannot pull those values out into the cache key, skip it.

**Anything high-stakes and low-volume.** Medical, legal, financial advice. The negation problem described above can cause serious harm in those domains. And if your volume is low, you were not saving much anyway.

**Long open-ended conversations.** A 10 to 20% hit rate while adding latency to 100% of requests is a bad trade.

Where it does earn its place: support bots, docs assistants, FAQ layers, onboarding flows, internal knowledge search, and any product where a large user base asks a small set of questions in a lot of different ways.

## How Bifrost does semantic caching at the gateway

[Bifrost](https://docs.getbifrost.ai/overview) is Maxim AI's high-performance, [open-source AI gateway](https://github.com/maximhq/bifrost) that unifies access to 20+ providers through a single OpenAI-compatible API. I have been running it as my AI gateway for a while now.

Its [semantic cache](https://docs.getbifrost.ai/features/semantic-caching) combines exact hash matching with vector similarity search, supports per-request TTL and threshold overrides, and keeps cache entries separate by model and provider by default.

The design choice I like most is that it is **two layers, not one**.

Every request first goes through a direct hash lookup. If the prompt is byte-identical to something already cached, it returns immediately with zero embedding overhead, which matters because you just skipped the round trip that would otherwise tax every request in the system. Only on a direct miss does it embed the query and run the similarity search. So the cheap path stays cheap, and the expensive path only runs when it might actually pay off.

![Direct and semantic cache layers at the gateway](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/j1gnm7fit9fqcewhgu4m.png)

**Caching only activates when a request carries a cache key**, passed as an `x-bf-cache-key` header. There is no global-namespace mode for you to accidentally ship. If you want per-tenant isolation, the tenant identifier goes in that header, and cross-tenant matches then cannot happen because those entries are not in the same partition. Requiring a cache key makes isolation mandatory rather than optional.

Its other defaults are:

- `threshold` defaults to **0.8** for semantic hits, overridable per request with `x-bf-cache-threshold`.
- `ttl`, the time to live on an entry, defaults to **5 minutes**. This reduces stale answers, and you can override it per request.
- `conversation_history_threshold` defaults to **3**, which means it stops caching once a conversation runs past 3 messages.
- `cache_by_model` and `cache_by_provider` are both on by default, so a cached GPT answer never gets served to a Claude request.
- The vector store is pluggable across Redis or Valkey, Weaviate, Qdrant, and Pinecone, so you are not forced into adopting a new database.

And every response carries a `cache_debug` block with `cache_hit`, `hit_type` (direct or semantic), the actual `similarity` score, and a `cache_id`. That last one is what makes invalidation possible, since you can delete a single poisoned entry by its ID, or clear an entire partition by cache key, straight over the API. If you have ever had to explain to a customer why the bot gave them the wrong answer twice, you will understand why having that similarity score visible per request is worth a lot.

Every cache hit avoids the completion cost. At the gateway, the cache sits next to budgets, virtual keys, and routing. The same layer that chooses *which* provider gets a request can first decide whether the request needs a provider at all. I cover the routing side separately in [what adaptive load balancing actually is](https://www.swapnoneel.site/blog/what-is-adaptive-load-balancing).

Bifrost adds under 100 microseconds of overhead at 5,000 requests per second, which is negligible next to the embedding call.

## What should you do first?

Do not start by building the cache.

Start by measuring how repetitive your traffic is. Take a week of your logs, embed the queries, and count how many land within 0.92 of an earlier one. That gives you an upper bound on the possible hit rate. A week of your own traffic will tell you more than a benchmark based on someone else's workload.

If that number comes back at 30% or better, turn semantic caching on at your gateway. Partition the cache key by tenant from day one and keep the expiry short. For the first few weeks, watch the similarity scores on cache hits instead of trusting the threshold.

If it comes back at 8%, you have found a much more interesting problem than caching, which is that your users are all asking different things.

![Measure repetition before turning caching on](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/wpivlvi3ri9qiqp79l0k.png)

If you have run a semantic cache in production and watched it serve something it should not have, tell me about it in the comments. Those failures are the useful stories.
