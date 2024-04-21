---
title: Reversing Factorio's RNG
description: Understanding and reversing Factorio's PRNG
date: '2024-04-20'
categories: 
    - 'Factorio'
    - 'RNG'
    - 'reverse-engineering'
published: true
---

So how did we get here? The following is my journey to figure out how Factorio's RNG works.


### The Motivation
<!-- Transform the following into a timeline component -->
1. **The Mess Detector** (01.05.2023):
   Prior to even considering of breaking the RNG in a game,
   I've seen *@Earthcomputer* and *@Matthewbolan* present their proof of concept
   for cracking the RNG in (vanilla) Minecraft. This fascinated me for quite some
   time, and I've kept the idea in the back of my head for a while.
2. **Factorio Friday Fact #375** (08.09.2023):
   The factorio devs just recently broke their silence with regards to the 2.0 update.
   This was the 3rd FFF since they restarted their devlogs, and boy was it a controversial one.
   They introduced a big new feature called "*Quality*".
   It basically is now possible to obtain items with an increased quality level,
   which in turn increases the item's stats.
   There are 5 quality levels: *Normal*, *Uncommon*, *Rare*, *Epic* and *Legendary*.

   *However there is a catch*: The quality level one obtains is not guaranteed,
   but rather determined by a random chance.
   This supposed "newly introduced" non-deterministic behavior (i'll get back to this)
   was what sparked rather heated discussions on both the forums and reddit.
3. **"Just Count"** (08.09.2023):
   While reading through the comments on the FFF, I stumbled upon a rather interesting
   conversation between 2 reddit users.
   <!-- TODO: need to find these people again D: - Reddit search sucks though -->
   The first proposed that to appease the community, the devs should replace the
   random chance, with a deterministic counter, which would increase a fraction
   with each crafted item, and only produce a new quality level once the counter
   reaches a certain threshold (akin to the *productivity* progress bar).

   Another user answered to that, that this would be a bad idea, as it would
   enable players to predict the quality level of the next crafted item, which
   they then proposed to be easily exploitable by simply crafting less valuable
   items until the counter is almost full, crafting the expensive item only when
   the counter is almost full, thus guaranteeing a high quality level.
4. **The Idea** (29.09.2023):
   A day long hiking trip, I'm discussing the new FFFs with my brother.
   Elevated rails, and the new quality system.
   I mention the previous conversation on reddit, suddenly recalling the in-game
   Minecraft RNG seed cracking, and then it hit me:
   While simply counting is not possible due to the random chance,
   the RNG itself is still *deterministic* (as all PRNGs are).
   Especially so in Factorio, as the devs have taken great care to ensure
   that the game always behaves in a deterministic fashion (enabling replays and multiplayer).

   Thus a truly cursed idea was born:
   > "What if I *could* reverse-engineer the RNG in Factorio?"

   This would enable me to predict the quality level of the next crafted item.
   And if I could do that, then I could also predict how many RNG calls it would
   require to get a certain quality level, and thus exploit the system.

   If people can compute the RNG state with the rather limited computational
   power of Minecraft Redstone, then surely it must be easier in Factorio.
   After all, we have way more powerful computational primitives at our disposal.

   *How hard could it possibly be?*

## Finding the RNG
Now dear reader, you are likely in the same position as I was at this point.
Without any additional knowledge, the question: "*Can we break the RNG?*"
seems like a rather daunting task.
So let's break the problem into smaller, more manageable questions,
which we can then tackle one by one:
<!-- TODO: Transform this into a Q&A type of deal to show what is still unanswered -->
<!-- TODO: In each chapter check of the corresponding question at the end if it was answered -->
- [x] Does Factorio use a *Pseudo Random Number Generator* (PRNG)?<br>
      (Yes - we want to break this after all)
      <hr>
- [ ] What PRNG does Factorio use?<br>
      I.e. how large is the state, what is the period, how is it advanced?
- [ ] Can it even be reversed?<br>
      I.e. given a sequence of outputs, can we determine the internal state?
- [ ] Where do they use it?<br>
      There are more than just crafting recipes that use RNG. (e.g. biters, animations, etc.)
- [ ] Do they use multiple RNGs or just a shared one?
      I.e. do they have a single global RNG, or dedicated ones for different systems 
      (e.g. crafting, biters, etc.)?
- [ ] How do they use it (especially w.r.t. crafting recipes)?<br>
      I use recipes here as proxies for the quality computation, as I don't have
      access to the new 2.0 update yet.

### Reversal process
<!-- Ghidra + Research (factorio forum: Cube 8 years ago) -->

### The Implementation

## Understanding the RNG
<!-- What is an LFSR implementation vs theory -->
<!-- ### The Theory -->

## Translating to Factorio

<!-- ### Manual Flop -->

### Cnide Automation

### The Final Solution

## Conclusion
