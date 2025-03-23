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


<script>
  import LFSR from './factorio-rng/lfsr'
</script>


So how did we get here? The following is my journey to figure out how Factorio's RNG works.


## Introduction
A bit of surrounding history first. What am I doing here, why would something 
like this be interesting and which projects have inspired me to even try applying 
this to Factorio?

Many games rely on random processes to introduce some sort of unpredictability 
into the gameplay loop. A couple of areas where game developers might be interested 
in utilizing randomization are:
- Procedural terrain generation (e.g. ore/tree/cliff placement)
- Loot table generation (e.g. drops of items from monsters)
- Crit rolling
- Random shuffles (e.g. in card games or similar)

Here the randomness introduces a bit of additional variation which allows for the
same underlying deterministic processes to generate wildly different experiences -
think of rolling a completely different card deck, depending on the hand you get
dealt you might drive different strategies.

Now one of the older questions in computing is:

<p style="text-align:center;"><i>How can we generate random values on a deterministic machine?</i></p>

There are 2 different approaches which can be taken:
1. Generate "_**true**_" random numbers - they are "true" in the sense that we
   obtain them from an external source which we assume to produce a truly random
   sequence of bits. Think of measuring when an isotope decays or random floating
   voltage levels on a resistor.
2. Generate **pseudo-random** numbers - these number sequences showcase properties
   similar to true random numbers, the key difference to *true* random numbers
   though are that pseudo random numbers are generated via a deterministic process.
   This means given a set starting *seed* (initial value) we will always observe
   the same output sequence.

Now for game development the use of PRNGs (*pseudo random number generators*)
offers some key advantages:
- While the output of the generator seems random they are reproducible. This is
  advantageous in many cases, e.g. for consistency over different clients connected
  to a server, reproducible world generation, replays via input recording,...
- Their speed. Gathering random values from external sensors is quite slow 
  (1000s of CPU cycles) while some pseudo random generators can be implemented
  using relatively few instructions thus being able to run magnitudes faster.

Now since we know that pseudo random generators are used we have the chance to do
something quite funny (at least in my humble opinion): If we figure out what the
initial seed / state of the random generator is we can predict future rolls by
performing the same computations *before* the actual game performs those random 
calls. This allows us to predict the outcomes of "random" events in games, before
they even occur!

<!-- Let's now take a small timeline of events which occurred until this blog post transpired:
- [The Mess Detector - Matthew, Earthcomputer, et. al.](https://www.youtube.com/watch?v=FPmQ0rnJjNc)
  was released. There they utilize the random velocity of spawned TNT to measure
  enough information to restore the games entire random state. The entire
  computations could then be done entirely within Minecraft.
- [FFF #375 - Quality](https://www.factorio.com/blog/post/fff-375) the Factorio
  developers announced a new feature which relies on randomly rolling for better
  versions of some of the items statistics. Initial response seemed split some
  completely disgusted by the randomness introduced into the completely deterministic
  game (it wasn't - uranium processing already had random rolling prior to 2.0)
  and some eagerly awaiting it.
- **Unknown Reddit Comment** - On reddit someone proposed an alternative method
  instead of using random numbers: Just have the outputs be proportionally be
  generated, as in every, n<sup>th</sup> item would be of higher quality. This
  however was quickly dismissed, by another pointing out that in this case you
  could use this feature to upgrade expensive items, while other items are used
  for the low rolls using a simple combinator setup which counts.

This last point is especially interesting considering the fact that we use 
*pseudo-random* number sequences. While the sequence that PRNGs generate at first 
lance have no underlying order, we know that it will in fact always belong to some
sequence which has a fixed order. This means that once we know where in the sequence
we are, we also will know which numbers will come next, allowing us to look ahead
in the sequence. It is essentially the counting approach, just not counting in
the order that we are used to.
-->

## The first Bit of Information
To figure out what PRNG Factorio uses I immediately saw 2 ways of going about this.
First of all, was just simple Internet research. I believed that I wouldn't be the
first to wonder what sort of generator they use, seeing as the community is filled
with a rather large proportion of very technically inclined individuals. After a
bit of digging around I found following post, asking basically the thing I wanted
to know, but already 8 years ago. There we also find following answer by @Cube -
a former developer at Wube. They wrote:

>[!cite] Cube - Tue Sep 30, 2014 12:27 pm - [forums.factorio.com - topic 5995](https://forums.factorio.com/viewtopic.php?t=5995)
>\[...\]
>
> We chose `taus88` mainly because it is the fastest from boost's generators.
> I was thinking of removing one of the three LFSRs (that should make it about
> 40% (?) faster), but there is no point, since the ranom numbers are not a
> bottleneck for us.

This already gives us a pretty large hint on where to look next: the boost random library.
There we find the following (abbreviated) implementation for the `taus88` generator:
```cpp
typedef xor_combine_engine<
    xor_combine_engine<
        linear_feedback_shift_engine<uint32_t, 32, 31, 13, 12>, 0,
        linear_feedback_shift_engine<uint32_t, 32, 29, 2, 4>, 0>, 0,
    linear_feedback_shift_engine<uint32_t, 32, 28, 3, 17>, 0> taus88;
```

This means that `taus88` consists 3 of what the boost library calls 
`linear_feedback_shift_engine` whose' results will be XOR'ed together. The linear 
feedback shift engine is also commonly known as a linear feedback shift *register* (LFSR).

### Ensuring that information is up to date
As previously already mentioned I've considered 2 approaches, one of which was
simply internet research. The result's I've found though were already quite old
(~8 years) so I wanted to cross-check the information given on the forum against
the most accurate source available: The game binary.

Using [Ghidra](https://github.com/NationalSecurityAgency/ghidra) I've decompiled
and inspected the `factorio.exe` alongside the debug symbol `.pdb` file the devs
graciously ship with their game. Therein I found the `RandomGenerator` class to
implement the `getInt()` function as follows:

```cpp
uint RandomGenerator::getInt(RandomGenerator *this)
{
	uint a = this->seed1;
	uint b = this->seed2;
	uint c = this->seed3;
	
	a = (a << 12 ^ a >> 6) & 0x1fff ^ a >> 19 ^ a << 12;
	b = (b << 4 ^ b >> 23) & 0x7f ^ b >> 25 ^ b << 4;
	c = (c << 17 ^ c >> 8) & 0x1fffff ^ c >> 11 ^ c << 17;
	
	this->seed1 = a;
	this->seed2 = b;
	this->seed3 = c;

	return a ^ b ^ c;
}
```

The first thing which stood out to me was of course that almost none of the 
constants used in the original `taus88` definition remained. This however was
likely due to compiler optimizations doing constant folding and reducing the
amount of operations needed. Though the fact that we store 3 seeds for our RNG
states is the first promising indicator, so is the fact that they are updated
independently of one another and their result is the XOR of all states.

To be sure with out a doubt though that they are equivalent I've implemented both
variants in python such that they can be run using `sympy` which after running
it for a single step on both does indeed confirm that all bits of the corresponding
registers change are computed in the exact same fashion. In this instance I've
used `sympy` as this would've been a tedious number of equivalence checks by
hand (3 * 32 = 96). the code responsible for proving this equivalence can be
found [here]().
<!-- TODO: add link to my code which proves equivalence -->

Sweet! So we now know that the RNG state is indeed just given by a linear
combination of the 3 underlying LFSRs. This was a *very* neat thing to see, as
those are known to be breakable quite easily. To see why, let's take a look at
what such a LFSR is comprised of.

## LFSRs from Ground up
LFSR is short for *linear feedback shift register*. To understand their behavior
we'll build up to the full picture by considering each of the named components,
adding one thing after another.

Lets start with a *register*: A collection of bits, aggregated into a single variable.
Each bit can be seen as a binary variable $x_{n-1} \dots x_2 x_1 x_0$ where each
$x_i \in \{0, 1\}$. In the following it is beneficial to no longer consider the
register to describe a number $\in [0, 2^n - 1]$ but rather actually as just the
bits joined together. As such we will operate on these variables mainly using
bitwise operations, especially so the bitwise XOR $\oplus$

<!-- TODO insert the svelte LFSR component here with no arrows between the individual bits, just being able to toggle the bits individually. -->

| $\oplus$ | 0   | 1   |
| -------- | --- | --- |
| **0**    | 0   | 1   |
| **1**    | 1   | 0   |
> [!note]- Regarding $\oplus$
> We write $\oplus$ as this is a form of addition as we know from regular arithmetic.
> We can consider our register states to be elements from $\mathbb{Z}/2\mathbb{Z}[X]$
> i.e. the polynomial ring over binary variables. Then the bitwise XOR corresponds
> both the addition and subtraction of 2 polynomials, as in $\mathbb{Z}/2\mathbb{Z}$
> addition is the same as subtraction (see table above.)

Extending our previously defined register to a *shift register* is simple enough:
To shift our bits around we just take each higher bit and move it 1 position down,
dropping the lowest bit.

<!-- TODO insert the svelte LFSR component here with no feedback connections, but the shift downward arrows, step, animate & reset buttons -->

Well. . . This is boring! We pretty quickly converge always the same value, 
that is the 0 state. This does not seem random at all. To keep our shift register
from always just discarding all information lets add the 3rd component, namely
the *feedback*. The first idea is just looping the feedback back towards the
first bit, as there we do not have a preceding bit from which we can obtain (new)
information, while we discard information in the last. If we do this now we
basically implemented the *bit roll* operation:

<!-- TODO insert the svelte LFSR component here with feedback connection to the first bit from the last bit, step, animate & reset button -->

Hmmm. . . At least we no longer always arrive at an empty register, but the
sequence when the last bit lights up is very predictable. This is due to the
fact that we see the information that we have will be repeated every $n$ steps 
-- it stays unchanged after all! Thanks to the low cycle count one can again
pretty quickly spot the pattern produced by our current *feedback shift register*.
To combat this we insert some *linear feedback*, by adding the feedback not
only to the first bit, but also some intermediate bits:

<!-- TODO insert the svelte LFSR component here with full feedback connections to the first & second bit, for the 4 bit LFSR, with step, animate & reset button -->

Unlike the last steps it might not be immediately obvious why this step has the
name that it has. The naming comes from the fact that the XOR $\oplus$ operation
we use to combine the feedback into the inner bits causes our bit states to be a
linear combination of the previous bit states. This fact will also be what we
use later to figure out the state from observations.

There we have it! This is how one constructs a LFSR. Let's get to understanding
*why* we did the steps we took & *why* we chose the intermediate bits that we
chose to insert the feedback to.

## LFSR<sup>-1</sup>
While we previously started at a fixed state, i.e. the bits set to either 0 or 1,
and generated the subsequent states and corresponding outputs, the thing we
actually care about is the inverse problem. Given some output observations can
we figure out what state we started with? To figure out how we can do this let's
substitute in variables $x_i$ for the bits instead of using concrete values 0 / 1
and track how the states of the corresponding bits change:

<!-- TODO insert LFSR from above using variables here, best also with a list of
equations which get generated for the last bit for example. This would allow me
to show that we can insert any sequence of values there to obtain an initial state. -->

<!-- TODO this part reeeeally needs a rewrite, it does not flow well -> why the sudden *formal* introduction of the vector spaces? Is it really necessary? -->
Now, if you had an introductory course on linear algebra you also likely saw the
formal definition of what a vector space. It is usually defined over a *field*
$F$ of scalars and a set $V$ of vectors along with the scalar multiplication
$\alpha \vec{v}$ and vector addition $\vec{u} + \vec{v}$ for corresponding
scalars $\alpha \in F$ and vectors $\vec{u}, \vec{v} \in V$, while satisfying
some conditions (see [Wikipedia: Vector Space](https://en.wikipedia.org/wiki/Vector_space#Definition_and_basic_properties)).
While I personally was introduced to the topic of vector spaces in this fashion,
afterwards I only ever saw them used in some special instantiations, and you
might as well. Namely $F$ being either $\mathbb{R}$ or $\mathbb{C}$ and
correspondingly $V = \mathbb{R}^n$ or respectively $V = \mathbb{C}^n$

However, the original definition is kept general on purpose! Through the fact
that they require $F$ to exhibit *field* properties, we can substitute other
algebraic structures in there which differ to the usual suspects. In this case
we can use the so called *Gallois field* $\text{GF}(2) = \mathbb{Z}/2\mathbb{Z}$.

This means that we can formulate the transition of a state from one vector
$s^{(t)} \in \text{GF}(2)^n$ to the next state $s^{(t+1)} \in \text{GF}(2)^n$
as a linear combination. Thus we can write each LFSR step as a matrix product:
$$
s^{(t+1)} = T s^{(t)}
$$
where $T \in \text{GF}(2)^{n \times n}$. Moreover, if you observe the
construction of our LFSRs one can also notice that this transition matrix
*needs* to be invertible (just by reversing all the edges, we can reverse each
step, which makes each step invertible). 

> [!note]- Gallois Field $\text{GF}(p)$
> If $p \in \mathbb{N}$ is a prime number, then $\text{GF}(p) = \mathbb{F}_p = \mathbb{Z}/p\mathbb{Z}$ is a field.
> 
> $\mathbb{Z}/p\mathbb{Z}$ consists of elements which can be written in the form
> $[a + bp]$ where $a \in \{0, 1, \dots, p-1\}$ and $b \in \mathbb{Z}$.
> Elements with the same $a$ but different $b$ are considered equivalent.
> This forms the so called *modular arithmetic* where we can do addition and
> multiplication as follows for $a,b,c \in \mathbb{Z}$ : 
> $$
> \begin{align*}
>  a+b      &\equiv c \mod p \iff \exists k \in \mathbb{Z}: a + b = c + kp \\
>  a\cdot b &\equiv c \mod p \iff \exists k \in \mathbb{Z}: a\cdot b = c + kp
> \end{align*}
> $$

> [!check] Summary
> In summary we can derive a set of linear equations for all the bits observed, as long as we can
> track when random events occurred. This then can look something like the following:
> $$ \begin{array}{cccccccc}
> x_1 & + & x_2 & + & x_3 &   &     &= 1 \\
> x_1 &   &     & + & x_3 &   &     &= 0 \\
>     &   & x_2 &   &     & + & x_4 &= 1 \\
> x_1 & + & x_2 &   &     & + & x_4 &= 0
> \end{array}$$
> This equation system can then be solved with usual methods such as row
> elimination which you can even remember from high school Maths. The important
> thing here though is that we can compute the entire thing modulo 2 which means
> that we have the following nice property: $x_i + x_i \equiv 0 = x_i - x_i$.

<!-- If the above does not tell you much, don't worry. It basically states that we can setup a linear system of equations (that one thing from high school) -->

## The complete package
We've seen that we can solve the state of a single LFSR as a linear equation of
the form $Ax=b$ where all components are computed modulo 2. Remember however that
the full RNG result is determined by 3 independent LFSRs whos' output we XOR together.
We can model this as having 3 different states $s_1, s_2, s_3 \in \text{GF}(2)^n$
each with a corresponding transition matrix $T_1, T_2, T_3$. If we then stack all
these state vectors together, we obtain a big vector 
$s = [s_1 \quad s_2 \quad s_3]^\top$ describing the entire state at once.
For this new state vector we can again derive a transition matrix we know invertible:
$$
s^{(t+1)} =
\begin{bmatrix}
s_1^{(t+1)} \\ s_2^{(t+1)} \\ s_3^{(t+1)}
\end{bmatrix}
=
\begin{bmatrix}
T_1  & 0 & 0 \\ 0 & T_2 & 0 \\ 0 & 0 & T_3
\end{bmatrix}
\begin{bmatrix}
s_1^{(t)} \\ s_2^{(t)} \\ s_3^{(t)}
\end{bmatrix}
= T s^{(t)}
$$

To obtain the final result $o^{(t)} \in \text{GF}(2)^n$ from the current 
"*hidden state*" $s^{(t)}$ of the RNG we can then simply calculate:

$$
o^{(t)} = \begin{bmatrix}I  &  I  &  I\end{bmatrix} s^{(t)}
$$

where $I \in \text{GF}(2)^{n \times n}$ is the corresponding identity matrix 
(i.e. 1's along the diagonal, 0 everywhere else). If we just look at this, we
might think that the entire thing turned non-invertible again. And this would be
true, if we only look at a single output. But what happens if we step the output
multiple times? The first output stays as it was, the next are:
$$
\begin{align*}
o^{(t+1)} &= \begin{bmatrix}I  &  I  &  I\end{bmatrix} s^{(t+1)} \\
&=
\begin{bmatrix}I  &  I  &  I\end{bmatrix}
\begin{bmatrix} T_1  & 0 & 0 \\ 0 & T_2 & 0 \\ 0 & 0 & T_3 \end{bmatrix}
s^{(t)}\\
&= \begin{bmatrix}T_1  & T_2 & T_3\end{bmatrix}s^{(t)} 
\end{align*}
$$

and likewise:

$$
o^{(t+2)} = \begin{bmatrix}T_1^2 & T_2^2 & T_3^2\end{bmatrix}s^{(t)}
$$

Thus we realize that if we observe 3 states in a row we obtain the following
system of equations:

$$
\begin{bmatrix}o^{(t)} \\ o^{(t+1)} \\ o^{(t+2)}\end{bmatrix}
= \underbrace{\begin{bmatrix}I & I & I \\ T_1 & T_2 & T_3 \\ T_1^2 & T_2^2 & T_3^2\end{bmatrix}}_{A} s^{(t)}
$$

In other words: To figure out what the state of the PRNG registers was at any
timestep $t$, we need to observe the results of 3 consecutive calls and solve
the linear system of equations: 
$$
s^{(t)} = A^{-1} \begin{bmatrix}o^{(t)} \\ o^{(t+1)} \\ o^{(t+2)}\end{bmatrix}
$$

> [!caution]- About the Invertibility of $T_i$
> I'm actually not telling the full truth here.
> If we consider the LFSRs as given by the boost library - and the parameters
> used to instantiate them - we will notice that they operate on $n=32$ bit words,
> while the actual LFSR sizes are 31, 29 and 28 respectively. This means that a
> couple bits are unaccounted for. In their cases these are the least significant
> bits, which will just be copies of the bits the LFSR would have previously
> output - or in terms of the linear equations: the least significant bits are
> linearly dependent on the higher significant bits.
> 
> This causes the matrices $T_i$ to have a $\text{rank}(T_i) < 32 = n$ which in
> turn means that they are strictly speaking **not** invertible.
> 
> **HOWEVER:** As we know the lower bits to always just be linear combinations
> of the higher bits, we can reduce the transition matrices of the individual
> LFSRs to $31\times31$, $29\times29$ and $28\times28$ respectively, restoring
> the full rank (and my claim that the transition matrices are invertible by construction).
> If these reduced matrices are then used to compute the internal state from the
> observed outputs, we can compute the remaining lower bits via the values of the
> higher bits, allowing us to restore the full state. This is though not necessary
> to do, as should we decide to simply step the computed state as is (e.g. with
> the linearly dependent bits filled to 0) then we will obtain the true state
> of all bits after a single step forward, as this will include computing the
> linear combination of the higher bits for the lower bits.


## Implementation Strategy

The prior result of inverting the observation matrix $A$ works already - in fact
it is the first implementation of the solver which I implemented inside my python
solver. For the observations I used the Factorio LUA API to generate 3 consecutive
random numbers. This could be used to determine the internal state already &
predict future RNG outputs see: [First recording of the method working](https://youtu.be/4DblzCYfArU)

However when we try to implement it with only the resources available to us
within Factorio we still have to overcome 2 major theoretical hurdles:
1. We need the result of **consecutive calls**.
2. It requires us to observe the **full result width** of the PRNG calls for our observations, i.e. all 32 bits at once.

Let's take a look at both of these issues.

### Consecutive calls
In the previous derivation we utilized the states $s^{(t)}$, $s^{(t+1)}$ and $s^{(t+2)}$
which would indeed correspond to only consecutive calls.
There are 2 ways to tackle this:
1. If we have a method of counting the calls made between the calls we can skip
   a couple of observations by generalizing the result above to use $o^{(t+n)} = T^{n} s^{(t)}$,
   where $n$ is the number of calls we skipped until the next measurement. We
   will come back to this later when discussing the Feasibility
   of actually exploiting the PRNG in game.
2. Ensure that our measurements occur consecutively. This can be done in game by
   carefully placement of the *Entropy Generators* (e.g. the things which will
   actually call to the RNG). If we build them all consecutively (i.e. no other
   *Entropy Generators* during that time) and ensure that they all query the RNG
   in the same game tick (e.g. by feeding the Entropy generators some items in
   the same tick).
   The game will then iterate over all buildings (as far as I can tell in reverse
   order) calling the respective update function on each of them. Once it comes
   to our *Entropy Generators* which should lie adjacent to each other in the
   update loop, it will update one after the other, without any outside sources
   generating interfering calls to the RNG.
<!--  TODO fix the comment on update order, does not seem to directly work like this  -->

### Full result width
For our *Entropy Generators* we will use crafting recipes which have some
randomization in their outputs.
However when we measure such an output, we do not obtain information about the
entire PRNG call. Instead the only thing we *can* measure are some simple
questions about the output, depending on the chosen method. Some examples are:
- The number of output items. This can vary in 2 cases:
	1. It is a recipe which yields non-integer item stacks - e.g. think of the
         new-ish [recycling](https://wiki.factorio.com/Recycler) recipes. They
         will return 25% of the items required to craft a single input item or
         the item itself incase it is a self-recycle recipe.
	2. It is a recipe with inherently random outputs - e.g. think of the
	   [uranium processing](https://wiki.factorio.com/Uranium_processing).
	   Here we have a 0.7% chance of producing a U-235 and a 0.7% chance of
         *not* producing a U-238.
- The quality level of the output. We can measure if it rose in level,
  and if yes by how many.

I'm going to focus on the first of the 2 methods, just observing the amount of
produced items (as this was the only source of information I had available when
I started this project). The thing to realize is that answering any of these
questions yields us only information about some of the *top bits* of the RNG
roll result.

Let us consider the example of [refining uranium ore into U235 and U238](https://wiki.factorio.com/Uranium-235).
For this we have 2 production results:
- U238 occurs with 99.3% probability as a result and
- U235 with a 0.7% chance.

Further more, considering in which context the above code `collectMaterial` is
executed, we can notice that for a single crafting cycle we already consume 2
**subsequent** RNG calls. Moreover, due to these chances being both quite low /
high we gain important knowledge whenever a crafting cycle completes in a certain
fashion. The resulting item gets generated if the respective inequality holds,
where $r_i \in [0, 2^{32}-1]$ is the computed RNG roll:

$$
\begin{alignat}{}
r_1 \leq \left\lfloor 0.993 \cdot 2^{32} \right\rfloor &=\;& 4\,264\,902\,524_{10} &&= 11111110\ 00110101\ 00111111\ 01111100_2\\
r_2 \leq \left\lfloor 0.007 \cdot 2^{32} \right\rfloor &=\;&     30\,064\,771_{10} &&= 00000001\ 11001010\ 11000000\ 10000011_2
\end{alignat}
$$

In particular: If U238 **was not** generated, we know that the first 7 bits are 1 and if U235 **was** generated then the first 7 bits were 0. Otherwise, afaik we have no real knowledge about the generator.

Cool! But which recipe will yield us the highest amount of information each time it completes? As the more information we obtain with a single crafting cycle, the fewer crafts we require and the faster we can determine the internal state.

As we saw above, the only information we can observe is determined by the top bits, and whether we obtained the item or not. If we now estimate that the rolls are actually evenly distributed, we can compute the expected value of information gained with each roll & observation:
$$
\begin{align*}
\underbrace{0.007 \cdot 7\,\text{bit}}_{\text{no U238}} + \underbrace{0.993 \cdot 0\,\text{bit}}_{\text{U238}} &= 0.049\,\text{bit}\\
\underbrace{0.993 \cdot 0\,\text{bit}}_{\text{no U235}} + \underbrace{0.007 \cdot 7\,\text{bit}}_{\text{U235}} &= 0.049\,\text{bit}
\end{align*}
$$
This means we can expect a total of 0.098 bit each successful crafting cycle! In fact, what we just calculated is a discretized version of the [Shannon Entropy](https://en.wikipedia.org/wiki/Entropy_(information_theory)) as if we observe the pattern a bit longer we might notice that the number of bits obtained in each positive case (i.e. where the probability is 0.7%) is $\lfloor-\log_2(p)\rfloor$ where $p$ is the probability of each event occurring. Similarly the same holds for $p > 0.5$ as there the result is just 0 bits observed. Thus we have a measure which we can apply to each recipe in the game to find the recipe with the most information per craft.

<!--  TODO insert the table here which shows all the recipe entropy values.  -->

As we can see there are *waaay* better recipes to utilize for extracting information from the game. One might think that [scrap recycling](https://wiki.factorio.com/Scrap) would yield a lot of information, but is with an entropy of 2.05 only slightly above recipes like recycling [repair packs](https://wiki.factorio.com/Repair_pack) which have entropy of 2. This is due to the fact that recycling repair packs (and similar recipes with ingredient count = 4n+2) yields exactly one bit of information of the RNG output in either case, as it is a perfect 50 / 50 split on whether the item will be created or not.
There are obviously alternative recipes such as the [oil refinery](https://wiki.factorio.com/Oil_refinery) which has an entropy of 4.5 however is also quite a bit more expensive and slower than doing repair pack recycling.

## Actual Implementation
To actually implement the reversal and manipulation of the RNG I've split the computation into 2 steps:
1. Sampling the current RNG
2. Compute the **current internal** RNG state, and
3. Compute the **future internal** states

As already alluded to in [[#LFSR but backwards]] we will need to compute a matrix vector product for both of these steps. Now the question is where do we get the matrices and where do we get the vectors from?

The current state will be computed from *observations* made when recycling [repair packs](https://wiki.factorio.com/Repair_pack). Each recycling operation will yield exactly 2 bits of information - 1 for each item. This in turn means that we require 88/2=44 recycling operations to have enough information to fully reconstruct the state.
Now as we are only interested in the top most bit of each observations we have our 88 observations as: 
$$o^{(t)}, o^{(t+1)}, \dots, o^{(t+87)} \in GF(2)$$
<!--  TODO add image of individual measurement unit  -->
### Figuring out the current State
This means that we only take the first row from the linear equation defined above for computing observations from the state:
$$
P_1 \underbrace{\begin{bmatrix}T_1^k & 0 & 0 \\ 0 & T_2^k & 0 \\ 0 & 0 & T_3^k\end{bmatrix}}_{T^k}
\begin{bmatrix}s_1^{(t)} \\ s_2^{(t)} \\ s_3^{(t)}\end{bmatrix}
= o^{(t+k)}
$$
with $P_1 = [p_{1i}] \in GF(2)^{96 \times 1}$ which is the first row of the matrix $P=\begin{bmatrix}I&I&I\end{bmatrix}$ . Now let 
$$A_k = P_1 T^k \in \text{GF}(2)^{96 \times 1}$$
then we need to solve the following equation:
$$
\begin{bmatrix}A_0\\\vdots\\A_{87}\end{bmatrix}
\begin{bmatrix}s_1^{(t)} \\ s_2^{(t)} \\ s_3^{(t)}\end{bmatrix}
=
\underbrace{A\, T^{-88}}_{A':=} s^{(t+88)}
= 
\begin{bmatrix}o^{(t)} \\ \vdots \\ o^{(t+87)}\end{bmatrix}
$$
This means that when solving $A's^{(t')}=o^{(t'-88,\dots,t'-1)}$ we compute the next to be internal RNG state from the previously done observations. Note that we use the inverse of the transition matrices $T_i^{-1}$ here, which we know to exist due to the construction of the LFSR (at least for the most significant bits).
After computing matrix $A'$ in python it turns out it is invertible as well (for the 88 bits which are linearly codependent) so that we can precompute $A'^{-1} \in GF(2)^{88 \times 96}$ to be used in Factorio. To do so, remember the fact that any matrix vector product can be seen as a weighted sum of the columns of the matrix weighed by the entries in the vector. In this case, as we are computing in $GF(2)$, the vector values are either 0 or 1, while the sum reduces to an XOR over all the weighted vectors:
$$
s^{(t+88)} = \bigoplus_{k=0}^{87} o^{(t+k)} \cdot [A'^{-1}]_k
$$
Here $[A'^{-1}]_k$ is the $k$-th column of $A'^{-1}$ while $o^{(t+k)}$ is the $k$-th bit observation performed.
In practice this equation is computed in 2 parts:
1. The pointwise scalar vector multiplication is done via a *decider combinator* (either the bit was observed or not), if it was (= 1) then the column is output, else it is not.
2. XOR of all the vectors via implicit summing. The vectors in $A'$ all contain only 0 or 1, meaning taking the sum over all included vectors, and finally extracting only the last bit of the sum is equivalent of taking the XOR over all of them. This is done by wiring the decider outputs all together and merging them in a single *arithmetic combinator*.

### Looking into the future
We perform a similar actions to compute the future states of the individual LFSRs. However, as all LFSR states require fewer than 32 bits, we can store the lookup table in a more compact fashion. For each LFSR we compute the following:
$$T^ks^{(t)} = s^{(t+k)}$$
This is computed for $k=1,2,\dots,256$, where $T$ and $s$ are different between the 3 sub LFSRs. From this we can again rewrite these matrix vector multiplications as:
$$
s^{(t+k)} = \bigoplus_{j=1}^{32} s^{(t)}_j \cdot [T^k]_j
$$
where $[T^k]_j$ is the $j$-th column of $T^k$. These columns can be stored as 32 bit integers, as $T^k \in GF(2)^{32 \times 32}$. Hence the skip ahead equation can be implemented in parallel for all $k$ steps as follows:
1. The pointwise scalar vector multiplication $s_j^{(t)}$ with all the different vectors will either include all the vectors in the corresponding $k$-th state or not, thus we can implement this via a *decider combinator* again.
2. Now we have 32 different 32 bit values which need to be XORed together. Unlike before we cannot utilize the implicit addition here, but instead have to use more *arithmetic combinators*. I've opted to use a *binary tree* to merge 2 bits using XOR together, as this is a fast reduction algorithm for prefix sums (which this is).

<!--  TODO insert image of a single LFSR skipper  -->
## Feasibility
Now to the important part, that you may be wondering about:

<center>Sweet! Can I use this to now do &lt;insert RNG manipulation target&gt; in <i>my</i> save-game?</center>

The short answer: No.

The long answer is still a *"No"* - but with a reason attached. The main pain point is the RNG being shared for a multitude of things. As mentioned before I've taken a look at the games code trying to reverse some information out of it. One further nugget of knowledge that I've stumbled upon is which random generator they use: 
- `unsafeRandom`
- `generalRandomGenerator` - This is the RNG that is used in the [RNG call for Item Creation](app://obsidian.md/index.html#RNG%20call%20for%20Item%20Creation)
- `aiRandomGenerator` - _I **assume** that this is the RNG used for biter behavior, not yet researched though_.
- `entitiesRandomGenerator`
- `mapRandomGenerator`
- `triggersRandomGenerator`
*that's it*. 
6 different generators, with both crafting item result creation code AND quality rolling depending on the `generalRandomGenerator` on the `Map` object. Now as you might already infer from the name of said RNG, there are also other functions which likewise utilize this generator. These include (but are not limited to):
- **Other RNG Crafts**: Other machines, e.g. your [scrap recycling](https://wiki.factorio.com/Scrap) plant on Fulgora and your [quality rolling](https://wiki.factorio.com/Quality) all over the factory. These will all of course call the same generator.
- **Particles Spawning**: Particles are spawned with a random velocity, which in turn means that calls to the RNG are made. Where does this happen:
	- **Steam Turbines** <!--  TODO pretty sure they do, but double check  -->
	- **Train Smoke** - this means no trains are allowed to drive
	- **Player Footsteps** - if you walk on dirt or sand, the player character feet will create little dust particles
- **Fulgora Lightning**: Whenever it turns night on Fulgora there will be lightning strikes at *random positions*, [about every 10 seconds per chunk](https://wiki.factorio.com/Fulgora#Lightning).
- **Explosions / Fire**: E.g. no biters/asteroids running into landmines or using rocket turrets nor any active artillery.
- **Trees dropping Leaves**: As far as I can tell this only happens when the trees die (e.g. are deconstructed).

<!--  TODO insert tree of the RNG calls made - would be nice to be able to analyze the code for the full tree, but the makeshift one might do the trick for now  -->

Why are these additional calls problems again?
1. As mentioned in [[#Consecutive calls]] we require the RNG calls that we record to be either directly consecutive[^1] or such that we can measure the number of calls which happened between the recorded calls. While it is certainly possible to compute some of the number of calls (e.g. track all machines doing RNG calls using circuit networks), it is not tractable to do for all sources (i.e. how would you measure the number of smoke particles emitted by the trains?)
2. The sheer number of calls made. While we can easily compute 1000 or even 2000 steps into the future at once, we can just as easily call the random generator so often, consider trash recycling: Each operation requires 12! calls to the RNG! Similarly, the locomotives while driving will spawn a particle every couple of ticks, and that is for every locomotive.
   When scaling these randomness sources up in number (as you do in an automation game) you quickly exceed the speed you can precompute the RNG state for.

[^1]: I already tried to utilize sub-tick mechanics to measure the calls in a consecutive block within a single tick. For that I assumed the update order would allow me to do so. Sadly this is currently broken as it seems the wakeup order of entities on a circuit network change over time, which brought my required ordering out of order.

## Conclusion
While sadly the applicability in true maps seems limited for now - I have at least shown the feasibility to do RNG state computation and manipulation under "lab" conditions. Likewise the technology shown here might be beneficial to those who might want to TAS some aspects of the game, as manipulating the RNG can now be done in a calculated instead of other black box methods, such as repeatedly reloading the save and trying again and again with slight input variations.
