---
title: How I made an AI Agent write in my voice
date: "2026-07-06T00:00:00.000Z"
description: "You can make AI write in your voice, but a prompt won't get you there..."
slug: make-ai-write-in-your-voice
tags:
  - ai
  - agents
  - writing
  - claude
  - productivity
link: "https://dev.to/swapnoneel123/how-i-made-an-ai-agent-write-in-my-voice-5dli"
canonical: "https://www.swapnoneel.site/blog/make-ai-write-in-your-voice"
cover: >-
  https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/i8fz76dcy7hsjskwcovi.png
updated: "2026-07-18T09:03:09.019Z"
---

Let's be honest, AI-written blogs have a certain... vibe. You know it, I know it, and your readers can smell it from the first paragraph.

But here's my take: you can make AI write in your voice, just not with a "generic" prompt. What actually worked for me is an agent skill with three parts: a voice profile built from seven of my real writing samples, a kill list of AI phrases, and a feedback loop that turns my edits into permanent rules. And here comes the twist, the blog you are reading right now is the very first output of that system!

![Hand-drawn illustration showing why a generic AI prompt creates bland writing, while a voice system with profile, kill list, and feedback loop creates personal output.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/28o1zintr6j86wowkvn0.png)

So, let me walk you through exactly how I built it, and you can judge for yourself whether it sounds like a human or not.

## Why does AI writing sound so... AI?

Before fixing the problem, let's understand it from the ground up.

An LLM is trained on billions of documents, so by default, it writes like the average of all of them. That's where phrases like "in today's fast-paced world"s come from, and those perfectly balanced conclusions that never pick a side. It's not that the model is dumb. It's that the average of a million voices is no voice at all.

And your voice is the exact opposite of average. It's the specific way you break grammar rules, and the things you're willing to admit that others won't.

I've written multiple technical blogs for different startups including Keploy, Devbytes and many more, and have been blogging on Hashnode since 2023. So when I asked AI to draft posts "in my style" with a simple prompt, the result was always the same: grammatically perfect, structurally neat, and absolutely not me.

## So, can you actually make AI write in your voice?

Well, yes. But you have to show it, not describe it.

![Minimal sketch of an AI voice system extracting writing mechanics from real blog samples instead of relying on vague tone instructions.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/3s98sgz7952omd3ajmg3.png)

"Write in a friendly, conversational tone" gives everyone on the internet the same friendly, conversational tone. What you need instead is a system that extracts the mechanics of your writing from real samples, and then enforces them like rules. Mine has three parts.

### Part 1: The voice profile

I gave the agent seven samples of my writing: two journey blogs, one tutorial, one opinion piece, one comparison, three cold intros, and a small questionnaire about my tastes. And these are not just "any" samples, three of them are my past works that was cherry-picked by the system. And the other four were literally the topics given to me by Fable 5, so that it can understand my writing style better.

But here's the important part, the profile it built isn't a list of adjectives. It's mechanics:

- My sentences constantly open with And, But, So, and Now (this exact paragraph included).
- My posts move forward by asking the reader's next question, and then answering it.
- Every big claim needs a personal receipt with a number, not a vague "many developers say".
- At most two "!!" per post. Yes, it literally counts them.

And one more thing: newer samples always outrank older ones. My 2023 writing had habits I've dropped since, and the system knows my current voice wins every conflict.

### Part 2: The kill list

The second file is a banned-patterns list. Every AI-ism I hate goes there: "delve", "seamless", "game-changer", rule-of-three sentences, em-dash chains, hedged conclusions that refuse to pick a winner, and emojis (all of them, I don't use emojis in my blogs, period).

The rule is zero tolerance. If a banned pattern shows up in a draft, the agent doesn't just delete it, it rewrites the sentence the way I would say it.

### Part 3: The feedback loop (this is the part that actually matters)

Now, the first two parts get you maybe 80% of the way. The remaining 20% is where every "write like me" tool I've seen gives up.

Here's my loop: the agent writes a draft, I edit it like I normally would, and then a second skill diffs my final version against the draft. Every meaningful change gets generalized into a rule. If I cut a long intro once, that's a hypothesis. If I do it twice, it gets promoted to a confirmed rule that every future draft must follow.

![Hand-drawn feedback loop showing how human edits become reusable writing rules for future AI-generated drafts.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/yv9s4xjb0kxh7d4tjhz7.png)

And there's a hard cap of 30 active rules. Why? Because this whole system runs on a smaller, cheaper model, and a smaller model follows 30 rules well and drowns in 80. The intelligence lives in the files, not the model.

## But does it learn from every single edit?

Well, no. And this was a deliberate design decision.

A one-off change (fixing a fact, rephrasing something topic-specific) teaches nothing about my voice, so it gets logged and forgotten. Only patterns become rules. Otherwise the agent would overfit to whatever mood I was in during one editing session.

There's also one rule I consider non-negotiable: the agent can never invent a story about me. All personal facts live in a single profile file, and if a post needs an anecdote that isn't in there, the agent has to stop and ask me. An AI confidently fabricating a personal memory in your published blog is so much worse than a boring paragraph.

## Does it actually work?

Honest answer: I don't fully know yet, and I won't pretend otherwise.

This post is literally draft number one. The feedback loop has learned exactly zero rules from my edits so far, because there were no edits before this. You are looking at the "before" photo. If you can tell which sentences I touched after the agent wrote them, tell me in the comments, seriously!

And another honest admission: setting this up took me more effort than just writing 2-3 posts by hand (I literally wrote four new blogs as an assignment lol, so that the LLM can infer my writing style better). The payoff only makes sense because it compounds, every post I edit makes the next draft closer to me.

![Illustration of an AI writing guardrail where only verified profile facts enter the blog, while fake memories are blocked.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/pivin0jtpppbxla1ajho.png)

But the direction feels right, and I'm clearly not alone in thinking this way. The dev community has moved past one-shot prompting: Peter Steinberger's viral post ("you shouldn't be prompting coding agents anymore, you should be designing loops that prompt your agents") pulled 6.5 million views in June 2026 and [set the timeline on fire for a week](https://explainx.ai/blog/loop-engineering-coding-agents-claude-code-guide-2026). And the [Hacker News discourse in 2026](https://www.developersdigest.tech/blog/what-hacker-news-gets-right-about-ai-coding-agents-2026) has shifted from shiny demos to making agents repeatable and trustworthy. A writing agent with a feedback loop is just that same idea, pointed at a blog.

## What are agent skills, anyway?

If the term is new to you, let's zoom out for a second.

An agent skill is basically an onboarding document for an AI. It's a markdown file (usually called SKILL.md) with step-by-step instructions, plus supporting files it should read, that a coding agent like Claude Code loads before doing a task. Think of it like the difference between telling a new intern "write a blog" and handing them your company's full writing playbook.

And the beautiful part is that skills are portable and dumb-model-friendly. I have orchestrated multiple agentic workflows, and the lesson from there was the same: agents don't fail because the model is weak, they fail because the instructions are vague.

## FAQ

**How many writing samples do you need to clone your voice?**
Seven worked for me, but coverage beats volume. One sample per content type (tutorial, opinion, comparison, narrative) teaches far more than ten samples of the same type, because your voice changes with the mode.

**Can this work with a cheaper model?**
That's the whole point. The voice profile, kill list, and rules carry the intelligence, so a smaller model just has to follow instructions. Save the expensive model for building the system, not running it.

**How do you stop the AI from making up facts about you?**
One canonical profile file, and a hard rule: if the fact isn't in the file, ask the human. Never generate a personal claim from thin air. Accepting that AI can't do the entire job for you, and you have to keep yourself in the loop, creates the difference.

**Does this replace writing?**
No, and I don't want it to. It replaces the first draft and the SEO chores. The opinions and the final edit are still mine, and honestly, that's the part I enjoy anyway. Even the current sentence that you are reading right now, was actually inserted by me during the edit.

## So, should you build one?

If you publish regularly, yes. Build the voice profile. Really do. But don't skip the feedback loop, because without it you've just built a fancy prompt that will drift back into AI-slop within three posts.

And start smaller than I did: pick your five most representative pieces, extract the mechanics (not adjectives!), list ten phrases you'd never say, and make reviewing the diffs a habit. If you want a more detailed analysis about the system, just comment down below and I would be happy to help you all!

I'll be sharing more about this system as the feedback loop matures, including the numbers on how many edits it actually takes before drafts start needing none. If you want to follow that experiment, you can find me on [X (swapnoneel123)](https://x.com/swapnoneel123) or check out my other works at [swapnoneel.site](https://www.swapnoneel.site).

![Hand-drawn thank-you illustration with a published draft, feedback loop, and voice-print machine for the end of an AI writing blog.](https://dev-to-uploads.s3.us-east-2.amazonaws.com/uploads/articles/mnf69thhecu599edac1q.png)

And that's a wrap! Have you tried making AI write like you? What worked, and what came out sounding like a LinkedIn bot? I would love to hear your experience. Thank you for reading, and have a nice day ahead!!
