---
title: 'What Is Semantic Caching, and Where It Quietly Breaks'
date: '2026-08-19T17:39:37.000Z'
description: >-
  Semantic caching serves cached LLM answers to queries that only match in
  meaning. How it works, the threshold trap, real hit rates, and when to skip
  it.
slug: what-is-semantic-caching
link:
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
updated: '2026-08-21T05:40:31.914Z'
---

Two people open your support chatbot within the same minute. One types `How do I reset my password?` and the other types `i forgot my password, how do i get a new one`.

Same question, same answer, two full model calls, and your Redis cache stores both as separate keys without ever hitting on either.

**Semantic caching** stores past LLM responses and serves them to new queries that mean the same thing, even when the words are completely different. It works by turning every query into a vector, searching for the nearest stored vector, and returning that cached answer if the similarity clears a threshold you set.

Now, let's understand how it actually works!

## Why your existing cache does nothing for LLM traffic

Every cache you have ever written works on exact equality. You take the request, hash it, look up the hash, and either the bytes match or they don't. Redis and Memcached both work this way, and so does the HTTP layer sitting in front of them. It works brilliantly.

It works because the traffic it was designed for is machine-generated. `GET /api/users/42` is always spelled the same way by the same client, every single time.

![Exact matching misses equivalent questions](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/3v3qhwmra038m9m4xgsp.png)

Human language is not like that. There are roughly infinite ways to ask for a refund policy, and a hash function treats every one of them as a different universe. One extra space, one lowercase letter, one "please" at the end, and you get a completely different key.

So your hit rate on natural language collapses to nearly zero, and you go on paying for the same answer over and over.

Semantic caching fixes the matching function instead of the cache. The storage stays boring. What changes is that you stop asking "are these two strings identical" and start asking "are these two strings close enough in meaning".

And that one word, **close**, is where all the difficulty in this topic lives.

## How does semantic caching actually work?

The whole thing is five steps, and none of them are complicated on their own.

Before any code, here is the rule in plain English:

*Turn the question into a point in space. Look for the nearest point we have already answered. If it is near enough, reuse that answer.*

Now the actual shape of it:

1. A query comes in.
2. You send it to an embedding model, which returns a vector of floats. Usually 768 or 1536 dimensions, depending on the model.
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

Let's do something most articles on this topic skip. I'll give you three pairs of queries, you predict what a cosine similarity score should look like for each, and then we will check against what embedding models actually return.

Pair one. `What is your refund policy?` and `Can I get my money back?` Different words entirely, same intent. This one **should** score high, and it does. This is the case semantic caching was built for, and it works.

Pair two. `Show me the sales numbers for Q1 2025` and `Show me the sales numbers for Q3 2024`. Almost identical strings, completely different answers. You would want this to score low. It does not. It scores extremely high, because most of the tokens are shared and the embedding barely notices which quarter you asked about.

Pair three, and this is the one that should worry you. `Is this drug safe for pregnant patients?` and `Is this drug not safe for pregnant patients?` One word apart, opposite meaning.

Here's what actually happens. Embedding models are largely blind to negation, and this is not a rumour, it is measured. A [validity audit published in August 2026](https://arxiv.org/html/2608.10216) tested 9 encoder configurations and found that negation and antonym pairs score **above** genuinely similar pairs on every model tested, at average cosines of **0.93 to 0.999**. In the production system that paper audits, flipping an instruction from "withhold the study drug" to "administer the study drug" scored **0.9608**, and the safety gate that existed specifically to catch that never fired.

Read that once more. The reversed instruction scored higher than most legitimate paraphrases would.

So the prediction most people carry into this, that a threshold like 0.92 cleanly separates "same question" from "different question", is just wrong. What the threshold separates is **surface form**, and surface form is not meaning. Two sentences that share a grammatical frame and differ in one date, one entity, or one negation will sit above almost any threshold you are willing to set.

That's the trap. Raise the threshold to 0.98 and you kill your hit rate, because honest rephrasings stop matching. Lower it to 0.85 and you start serving Q3 2024's numbers to someone asking about Q1 2025. There is no single number that fixes both, because the failure is in the measurement and not in the cutoff.

What actually helps is refusing to let similarity be the only gate. Partition the cache by anything the embedding is bad at holding: user, tenant, model, and any structured parameter your queries carry. If dates and IDs are pulled out into the cache key instead of being left sitting inside the prose, the embedding never gets a chance to blur them.

## Semantic caching vs prompt caching vs KV caching

![Three caching layers at different depths](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/o2albu3d51p4reqzb2w0.png)

These three get used interchangeably online and they are three completely different layers. Getting this straight is worth more than any amount of threshold tuning.

**KV caching** lives inside the GPU. During inference the model computes key and value tensors for every token in your context, and the KV cache keeps them around so the next token does not need to recompute attention over everything before it. This is always on, you do not configure it, and it is the reason generation gets faster after the first token.

**Prompt caching**, sometimes called prefix caching, is what OpenAI and Anthropic sell you at the API level. It reuses those KV tensors across requests when two requests share a common prefix. So if you send a 4,000 token system prompt on every call, the provider can skip recomputing it and charges you less for those tokens. Important detail: it matches on **exact prefix bytes**, so two prompts that mean the same thing but start differently will miss it entirely.

**Semantic caching** sits in front of the model, in infrastructure you control. It stores whole request and response pairs and matches on meaning. When it hits, you save 100% of the call, because the model is never invoked.

They stack, and they should. A request should try the semantic cache first, fall through to the provider's prompt cache on a miss, and only then pay for full inference. The savings are multiplicative rather than competing, and the layer you own is the outermost one.

## What is a realistic cache hit rate?

![Real-world hits are a minority of requests](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/u8og1qce297e7399xh0h.png)

This is where I want to be blunt, because the marketing on this topic is bad.

You will see 95% quoted constantly. Trace that number back and it almost never refers to hit rate. It refers to **match accuracy**, meaning the cached response was correct 95% of the time it was served. Those are entirely different claims, and the second one tells you nothing about how much money you saved.

Actual production numbers are much lower. A [breakdown of real deployment data](https://dev.to/gauravdagde/llm-semantic-caching-the-95-hit-rate-myth-and-what-production-data-actually-shows-8ga) puts typical hit rates at **20 to 45%**, with Portkey seeing around 20% on retrieval-augmented workloads and an EdTech platform hitting about 45% on student question-and-answer traffic. Open-ended chat sits at 10 to 20%, because open-ended chat is genuinely open-ended.

Academic results land in a similar band. The [GPT Semantic Cache paper](https://arxiv.org/pdf/2411.05276) reports cutting API calls by up to **68.8%**, but that is on query categories picked for repetition, which is exactly the workload where this technique looks its best.

And 20 to 45% is still a very good deal! On a 5,000 dollar monthly bill, a 20% hit rate is 1,000 dollars back, and the latency win is bigger than the money win. A cache hit returns in under 5 milliseconds against 2 to 5 seconds for a real completion, which changes what the feature feels like to use, not just what it costs.

Just size your expectations off your own traffic. Which brings me to the honest part.

## What semantic caching costs you to run

![Every request pays the semantic lookup toll](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/ux3cdjdufpwk8zivmwo1.png)

Nobody puts this in the intro paragraph, so here it is.

You pay an embedding call and a vector search on **every single request**, including the 60 to 80% that miss. Embeddings are cheap compared to a chat completion, so the money side is fine. The latency is the thing to watch, because you have just added a network round trip to the front of every request in your system, including all the ones the cache cannot help with.

At [Keploy](https://keploy.io) I built a retrieval-augmented chatbot over their documentation using vector embeddings, and docs traffic is close to the best case for this technique. People ask the same twenty questions in fifty phrasings, forever. Even there, the honest framing is that you are trading a guaranteed small cost on 100% of requests against a large saving on a minority of them, and you need to actually measure that ratio before assuming it comes out ahead.

Then there is staleness. Your cache does not know your prices changed on Tuesday. The stored answer is a frozen snapshot of what the model said, plus whatever context it was given at the time, and it keeps being served until its expiry time runs out. Short expiry times are safer and hit less. Long ones are the opposite. Pick deliberately.

Multi-turn conversations are worse. A follow-up like "and what about the second one?" embeds to almost nothing useful, because the meaning lives in the previous four messages and not in that sentence. Most sane implementations just refuse to cache beyond a few turns of history, and that is the correct call.

And you now operate a vector store. That is one more thing to size, monitor, and pay for.

## One cache, many tenants, and the leak nobody plans for

This is the part that turns semantic caching from a performance feature into a security decision, and it is why I would not hand-roll one at the application layer in an enterprise setting.

A semantic cache with one global namespace returns the nearest previous response across every user in it. Not the nearest response *belonging to that user*. The nearest one, period.

So picture two customers of the same SaaS product asking structurally similar questions about their own account data. Their prompts embed within 0.93 cosine of each other, because they are the same question about different companies, and the cache cheerfully hands one customer the other's cached answer. Nothing errored. Nothing logged a violation. It looks exactly like a successful cache hit, which is the worst property a data leak can possibly have.

![A shared cache can cross tenant boundaries](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/bflbiben9y76am58s2yq.png)

There is a subtler version too. Even with no wrong response served, cache hits are dramatically faster than misses, and that timing difference is observable from outside. Somebody probing your API can learn which questions have already been asked by other tenants just by watching time to first token.

The fix is not clever, it is structural. The cache key has to be partitioned by a tenant identifier resolved from something you trust, meaning the API key, a virtual key, or a signed token claim. Never from the request body, because the request body belongs to the attacker. And the lookup has to be scoped to that namespace so a cross-tenant match is not merely unlikely, it is unreachable.

If that sounds like something you would rather not rebuild inside every service you own, I agree with you, and that is the real argument for doing this at the gateway.

## When should you not use semantic caching?

![Some workloads should bypass semantic caching](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/bca2riv6xiz4clpbngq4.png)

Some genuine "don't bother" cases, because this is not free and it is not universal.

**Anything that must be current.** Live inventory, account balances, order status. A stale answer here is worse than a slow one.

**Anything where the parameters matter more than the phrasing.** Analytical queries over dates, IDs, and entities are precisely where embeddings blur the thing you needed preserved. If you cannot pull those values out into the cache key, skip it.

**Anything high-stakes and low-volume.** Medical, legal, financial advice. The negation research above is not a curiosity in those domains, it is a lawsuit. And if your volume is low, you were not saving much anyway.

**Long open-ended conversations.** A 10 to 20% hit rate while adding latency to 100% of requests is a bad trade.

Where it does earn its place: support bots, docs assistants, FAQ layers, onboarding flows, internal knowledge search, and any product where a large user base asks a small set of questions in a lot of different ways. That describes a very large share of enterprise AI traffic, which is why this matters at all.

## How Bifrost does semantic caching at the gateway

I have been running [Bifrost](https://www.getmaxim.ai/bifrost) as my AI gateway for a while now, and its semantic cache is the cleanest implementation of everything above that I have read, mostly because I could actually read it. You can check out their [GitHub repository](https://github.com/maximhq/bifrost) as well.

The design choice I like most is that it is **two layers, not one**.

Every request first goes through a direct hash lookup. If the prompt is byte-identical to something already cached, it returns immediately with zero embedding overhead, which matters because you just skipped the round trip that would otherwise tax every request in the system. Only on a direct miss does it embed the query and run the similarity search. So the cheap path stays cheap, and the expensive path only runs when it might actually pay off.

![Direct and semantic cache layers at the gateway](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/j1gnm7fit9fqcewhgu4m.png)

Then there is the thing that answers the multi-tenancy section directly. **Caching only activates when a request carries a cache key**, passed as an `x-bf-cache-key` header. There is no global-namespace mode for you to accidentally ship. If you want per-tenant isolation, the tenant identifier goes in that header, and cross-tenant matches then cannot happen at all, because those entries are not in the same partition. Making the safe thing mandatory instead of optional is a real design decision, and most implementations get it wrong.

A few more of the knobs, since the defaults tell you what the authors actually believe:

- `threshold` defaults to **0.8** for semantic hits, overridable per request with `x-bf-cache-threshold`.
- `ttl`, the time to live on an entry, defaults to **5 minutes**. That is a deliberately conservative staleness stance, and you can override it per request too.
- `conversation_history_threshold` defaults to **3**, which means it stops caching once a conversation runs past 3 messages. That is exactly the multi-turn failure I described earlier, handled by default.
- `cache_by_model` and `cache_by_provider` are both on by default, so a cached GPT answer never gets served to a Claude request.
- The vector store is pluggable across Redis or Valkey, Weaviate, Qdrant, and Pinecone, so you are not forced into adopting a new database.

And every response carries a `cache_debug` block with `cache_hit`, `hit_type` (direct or semantic), the actual `similarity` score, and a `cache_id`. That last one is what makes invalidation possible, since you can delete a single poisoned entry by its ID, or clear an entire partition by cache key, straight over the API. If you have ever had to explain to a customer why the bot gave them the wrong answer twice, you will understand why having that similarity score visible per request is worth a lot.

The cost story is the obvious one, and the numbers are the ones from earlier in this post rather than anything I can promise you. Every cache hit is a completion you did not pay for at all. What a gateway changes for enterprises is that the cache now sits next to budgets, virtual keys, and routing in one place, so the same layer deciding *which* provider gets a request is also deciding whether the request needs a provider at all. That routing side is a whole topic of its own, and I wrote it up separately in [what adaptive load balancing actually is](https://www.swapnoneel.site/blog/what-is-adaptive-load-balancing).

Bifrost adds under 100 microseconds of overhead at 5,000 requests per second, which is a rounding error next to the embedding call, and honestly next to anything else in an LLM request path.

## What should you actually do first?

Do not start by building the cache.

Start by measuring how repetitive your traffic actually is. Take a week of your logs, embed the queries, and count how many of them land within 0.92 of an earlier one. That single number is your ceiling, and getting it takes an afternoon. I did a version of this on a contract a while back, building an internal tool that captured an AI product's logs and turned them into reports on latency and probable slowdowns (keeping it vague here, can't say much more than that lol). The thing I took away from it is that you learn more from one honest week of your own traffic than from every benchmark on the internet.

If that number comes back at 30% or better, turn semantic caching on at your gateway, partition the cache key by tenant from day one, keep the expiry short, and watch the similarity scores on your hits for the first few weeks instead of trusting the threshold.

If it comes back at 8%, you have found a much more interesting problem than caching, which is that your users are all asking different things.

![Measure repetition before turning caching on](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/wpivlvi3ri9qiqp79l0k.png)

And if you have run a semantic cache in production and watched it serve something it absolutely should not have, please tell me about it in the comments, those stories are the useful ones. I write more about LLM infrastructure and building with AI over at [swapnoneel.site](https://www.swapnoneel.site), and I'm on [X (swapnoneel123)](https://x.com/swapnoneel123) if you feel like arguing about thresholds.
