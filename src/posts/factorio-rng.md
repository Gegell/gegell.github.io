---
title: Reversing Factorio's RNG
description: Understanding and reversing Factorio's PRNG
date: '2024-04-20'
categories: 
    - 'Factorio'
    - 'RNG'
    - 'reverse-engineering'
published: true
showToc: true
---


<script>
  import LFSR from './factorio-rng/lfsr'
  import QualityCalculator from './factorio-rng/quality-calculator'
  import rngplot from "./factorio-rng/img/expected_bits_plot.svg?raw"
</script>


So how did we get here? The following is my journey to figure out how Factorio's RNG works.


## Introduction
The *Factorio Space Age* DLC introduced a new mechanic heavily reliant on random chance. 
I'm of course talking about the *quality* mechanic [FFF #375](https://www.factorio.com/blog/post/fff-375).
The initial announcement of this new mechanism saw a split in the community, 
some eagerly awaiting this new challenge, while others were skeptical of the introduction of randomness across all crafting chains.

Factorio prides itself in their *deterministic* gameplay update, 
allowing them, among other things, their replay feature and lockstep multiplayer simulation.
This however, might lead one to ponder the following question:
<p style="text-align:center;"><i>*How* exactly does a *deterministic* process generate *random* values?</i></p>

In general computing, there are 2 different approaches which can be taken to tackle the task introducing randomness:
1. Generate "_**true**_" random numbers - they are "true" in the sense that we
   obtain them from an external source which we assume to produce actually random
   bit sequences. Think of measuring decay events of radioactive isotopes or 
   noisy voltage levels on a floating resistor essentially measuring slight deviations in the electro magnetic field.
2. Generate **pseudo-random** numbers - these are sequences of numbers which exhibit properties
   similar to those found in sequences of true random numbers, such as a known distribution (usually uniform) or consistent statistical moments.
   The key difference to *true* random numbers is however, that *pseudo* random numbers are produced through a deterministic process.
   In particular, we start with some state (usually *seeded* by some number) which will then advance by applying some algorithm, producing new "random" bits in the process.
   By applying the same algorithm to the same initial state, we will always observe the same resulting sequence.

It is important to note, that for game development the use of PRNGs (*pseudo random number generators*)
offers some key benefits:
- The output distribution behaves the same as true random numbers would.
- They deterministically produce the same sequence from the same state.
  This is advantageous in many cases: Consider game consistency across different clients connected
  to a shared server state, leading to reproducible world generation, replays via input recording
  while providing random seeming events in the game.
- Finally, their speed. Gathering random values from external sensors is quite slow
  when compared to the processing speed of modern CPUs.
  Gathering a single random value from an external source may take 1000s of CPU cycles,
  whereas many pseudo random generators can be implemented
  using relatively few instructions thus being able to run magnitudes faster.

As such, we *know* that they of course also use *pseudo random numbers* as opposed to true random numbers.
So we have the chance to do something quite funny (at least in my humble opinion):
If one can figure out what the current state of the random generator is,
future rolls yet to occur can be predicted,
by simply performing the same computations *before* the actual game performs those random calls.
This allows us to build an oracle for "random" events in the game, predicting their outcome before they even happen!

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

## The First Bit of Information
While we can certainly say that they use a PRNG in Factorio, as of yet we do not
know which one they actually chose.

To figure this out, the first step was doing some rudimentary internet research.
As the Factorio community is quite large and filled with many technically inclined individuals,
*surely* someone must have asked this question before.
After digging around a bit I found a post on the Factorio forums asking basically
the same thing I wanted to know, 11 years ago already.
In it, we also find following answer by @Cube - a former developer at Wube. They wrote:

>[!cite] Cube - Tue Sep 30, 2014 12:27 pm - [forums.factorio.com - topic 5995](https://forums.factorio.com/viewtopic.php?t=5995)
>\[...\] We chose taus88 mainly because it is the fastest from boost's generators.
> I was thinking of removing one of the three LFSRs (that should make it about
> 40% (?) faster), but there is no point, since the random numbers are not a
> bottleneck for us.

This already gives us a pretty large hint on where to look next: The boost random library.
There we find the following (abbreviated) implementation for the [taus88]
generator:
```cpp
typedef xor_combine_engine<
  xor_combine_engine<
    linear_feedback_shift_engine<uint32_t, 32, 31, 13, 12>, 0,
    linear_feedback_shift_engine<uint32_t, 32, 29, 2, 4>, 0>, 0,
  linear_feedback_shift_engine<uint32_t, 32, 28, 3, 17>, 0> taus88;

template<class UIntType, int w, int k, int q, int s>
class linear_feedback_shift_engine {
  // w = word size (e.g. 32 for 32 bit uint)
  // k = number of bits in the LFSR
  // q = feedback tap position
  // s = number of steps to do at once
  result_type operator()() {
    const UIntType b = (((value << q) ^ value) & wordmask()) >> (k-s);
    const UIntType mask = (wordmask() << (w-k)) & wordmask();
    value = ((value & mask) << s) ^ b;
    return value;
  }
}
```
[taus88]: https://www.boost.org/doc/libs/1_88_0/doc/html/doxygen/headers/taus88_8hpp_1a3822a73532a76cfeca0db9888d676c72.html
[linear_feedback_shift_engine]: https://www.boost.org/doc/libs/1_88_0/boost/random/linear_feedback_shift.hpp

This means that taus88 consists of 3 [linear_feedback_shift_engine]s whose' results are XOR'ed together.
Note that this linear feedback shift engine is more commonly referred to as *LFSR*: *linear feedback shift register*.

This information however was already quite old -- It already was 8 years old when beginning this project.
Hence, I wanted to cross-check the information given on the forum against the most
accurate source available: The game binary.

While the game itself is closed source, the developers graciously ship a `.pdb` file containing the debug symbols alongside the game binary.
This means, that we can generate a well annotated decompilation of the binary, to inspect the code and figure out what is going on under the hood.
To this end, I used both the open source tool [Ghidra](https://github.com/NationalSecurityAgency/ghidra) transitioning to [Binary Ninja](https://binary.ninja/) in later parts.
In the game's code I found the `RandomGenerator` class to implement the `getInt()` function as follows:

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

The first thing which stands out is that almost none of the 
constants used in the original `taus88` definition remained.
This can be attributed to compiler optimizations doing constant folding reducing the number of operations needed. 
Though the fact that we store 3 seeds for our RNG state is the first promising indicator that it is actually the same generator.
Likewise, so is the fact that they are updated independently of one another with the final result being the XOR of all states.

To be sure without a doubt though that they are equivalent I've implemented both
variants in python such that they can be run using `sympy`. Updating both for a 
single step indeed confirms that all bits of the corresponding registers update
in the exact same fashion. In this instance I've
used `sympy` as this would've been a tedious number of equivalence checks to do by
hand (3 * 32 = 96). The code responsible for proving this equivalence can be
found [here]().
> [!warning] TODO
> add link to my code which proves equivalence

Sweet! So we now know that the RNG state is given as a combination of 3 underlying LFSRs.
This was a *very* neat thing to see, as those are known to be broken quite easily.
Why and how? This is what we'll explore in the next chapter.

## The Mathy Part
To begin, we need to understand what the *linear feedback shift register* (LFSR) actually models.
Initially we consider just a simple *register*:
It describes a collection of bits, aggregated into a single value $x$.
Each individual bit $x_i$ of it can be seen as a binary variable with $x_i \in \{0, 1\} = \mathbb{F}_2$.
By combining multiple bits through concatenation we build the entire register as $x = x_{n-1} \dots x_2 x_1 x_0$.
While it is common to consider this register value $x$ to represent a number in the range $[0, 2^n-1] \subseteq \mathbb{Z}$,
it is more useful in our case to instead consider the register to describe a *vector* of individual bits, i.e. $x \in \mathbb{F}_2^n$.
Then let us consider 2 operations operating on individual bits:
1. $x \oplus y$: The XOR operation. This is a binary operation which takes 2 bits and
   returns 1 if the bits differ and 0 if they are equal. Note that this is the same as addition modulo 2.
2. $x \cdot y$: The AND operation. This binary operation takes 2 bits and
   returns 1 if both bits are 1, otherwise it returns 0.

| $x$ | $y$ | $x \oplus y$ | $x \cdot y$ |
| --- | --- | ------------ | ----------- |
| 0   | 0   | 0            | 0           |
| 0   | 1   | 1            | 0           |
| 1   | 0   | 1            | 0           |
| 1   | 1   | 0            | 1           |

> [!warning] TODO
> Could do with a couple of examples what this exactly means. I.e. how does the arithmetic work, and why?

The register is now extended to a *shift register*.
This extension is simple enough:
We just move the bits in the register around by taking each higher bit and shifting it 1 position down,
dropping the lowest bit.
Let's see how ticking this register now advances its state:

> [!warning] TODO
> insert the svelte LFSR component here with no feedback connections, but the shift downward arrows, step, animate & reset buttons


Well... This is boring! We converge pretty quickly to the same value of 0 regardless of the initial state.
This does not seem random at all. 
To keep our shift register from always just discarding all information we will add the 3rd component,
namely some *feedback*.
The first idea is to just loop the discarded lowest bit back into the highest bit,
as there we do not have a preceding bit from which we can obtain (new) information,
while we discard information in the last.
If we do this now we basically implemented the *bit roll* operation:

<LFSR tapMask=0b100000 />

Hmmm... At least we no longer always arrive at an empty register.
But the sequence of when the last bit lights up is very predictable. 
This is due to the fact that the information that we observe repeats every $n$ steps 
-- each bit stays unmodified after all!
Thanks to the low cycle count one can again pretty quickly spot the pattern produced by our current *feedback shift register*.
To combat this we insert some *linear feedback*, by adding the feedback not
only to the first bit, but also some intermediate bits:

<LFSR tapMask=0b110000/>

Unlike the last steps it might not be immediately obvious why this step has the
name that it has. The naming comes from the fact that the XOR $\oplus$ operation
we use to combine the feedback into the inner bits causes our bit states to be a
linear combination of the previous bit states. This linearity is also the reason 
why we can reconstruct the internal RNG state from just observations alone.

Note that in all the cases above we considered only single bit outputs.
It is common to instead just output the entire state as the resulting RNG call
as a single integer instead.
This then allows one to consider the number as a proper integer in $[0, 2^n-1]$
producing random looking numbers.

We now know how an LFSR gets constructed.
In particular, given the state $x^{(t)}$ at time $t$ we now know how to:
1. Generate the next state $x^{(t+1)}$.
2. Generate corresponding output bits, either one at a time, or as a full integer value.

### Inverting an LFSR
Previously all examples started at a fixed state for $x$.
I.e. these were states where all bits are set either to 0 or 1.
From those we generated the subsequent states and corresponding outputs.
However, to crack the PRNG what we actually care about is the *inverse* problem.
Given some output observations $o$ can we figure out what state $x$ we started with?
To figure out how we can do this, we use placeholder variables $x_i$ rather than concrete values for the bits and track how each corresponding bit changes:

> [!warning] TODO
> insert LFSR from above using variables here, best also with a list of
> equations which get generated for the last bit for example. This would allow me
> to show that we can insert any sequence of values there to obtain an initial state.

We see that every bit is just a combination of the starting bit states.
Either the bit states are just the state from the bit above, or it is the combination
of 2 separate states.
Note that whenever we observe $x_i \oplus x_i$ the $x_i$ cancels out, allowing us to remove it from the equation.

Moreover, I already teased the use of the *linear* property of the feedback we used above.
In particular $(\mathbb{F}_2, \oplus, \cdot)$ forms a *field* (see [Wikipedia: Field](https://en.wikipedia.org/wiki/Field_(mathematics))).

> [!info] Field properties
> The field properties are:
> - *Associativity* (both $\oplus$ and $\cdot$): $a \oplus (b \oplus c) = (a \oplus b) \oplus c$ and $a \cdot (b \cdot c) = (a \cdot b) \cdot c$.
> - *Commutativity* (both $\oplus$ and $\cdot$): $a \oplus b = b \oplus a$ and $a \cdot b = b \cdot a$.
> - *Identity*: For $\oplus$ this is 0: $0 \oplus a = a$ and for $\cdot$ this is 1: $1 \cdot a = a$.
> - *Additive Inverse*: For any $a$ we have a $-a$ such that $a + (-a) = 0$. Here $a = -a$.
> - *Multiplicative Inverse*: For any $a \neq 0$ we have $a^{-1}$ such that $a \cdot a^{-1} = 1$ is trivial as the only other element is 1.
> - *Distributivity*: $a \cdot (b \oplus c) = (a \oplus b) \cdot (a \oplus c)$.
> 
> Note that these properties can easily be checked for $\mathbb{F}_2$ with truth tables.

This field is commonly known as the *Gallois field* $\text{GF}(2) = \mathbb{Z}/2\mathbb{Z} = \mathbb{F}_2$
or the *modular arithmetic* mod 2.
Using this *field* structure we can then also consider the *vector space* (see [Wikipedia: Vector Space](https://en.wikipedia.org/wiki/Vector_space#Definition_and_basic_properties)
) spanning all values
$\text{GF}(2)^n$ with the scalars from $\text{GF}(2)$ and the operators from the field
applied pointwise to each coordinate.
<!-- 
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
> $$ -->

Personally, after getting an introduction into linear algebra and the used vector spaces,
I subsequently only saw them applied to either $\mathbb{R}^n$ or if spicy to $\mathbb{C}^n$.
However, the original definition of a vector space is kept very generic on purpose!
It allows *any* structure satisfying the necessary properties to be manipulated in the same way,
allowing us to apply well know algorithms you maybe have only seen yet applied to systems described by 
$\mathbb{R}^{m \times n}$ matrices to arbitrary matrices, regardless of the underlying field $F$.
And as luck would have it, the previously defined operations XOR and AND on the bits span a *field*!

Repeating what we saw before: We can formulate each individual transition as a *linear* combination of previous bit states.
Since we can write the entire state as a vector of these bits, and each transition is *linear* itself,
this means we can write the transition between the current state 
$s^{(t)} \in \text{GF}(2)^n$ to the next state $s^{(t+1)} \in \text{GF}(2)^n$
as a *matrix product*:
$$
s^{(t+1)} = T s^{(t)}
$$
where $T \in \text{GF}(2)^{n \times n}$. 
Moreover, careful observation of the original construction of our LFSRs highlights that this transition matrix *needs* to be invertible.
> [!info]- Invertability of $T$
> Remember that $T$ originates from the construction of the LFSR.
> Construct a new LFSR by differentiating the following two cases:
> 1. The bit is just shifted from above, no XOR between.
>    This step is reversible by just flipping the direction of the shift.
> 2. The bit is a combination of both the upper bit and feedback bit. 
>    Since the feedback bit is inserted into the highest bit without modification,
>    this step can be reversed by XORing the bit state with the most significant bit
>    (cancelling out the corresponding added state) and shifting it as though no modification happened.
>
> In effect this amounts to flipping the arrows in the above diagrams by 180.

As such, for any given $T$ originating from an LFSR we know that $T^{-1}$ exists.
This can then either be generated by the construction above, or alternative methods
such as [Gaussian elimination](https://en.wikipedia.org/wiki/Gaussian_elimination).

> [!info]- Gaussian Elimination on $\text{GF}(2)$
> Usually for Gaussian elimination we transform the matrix into an upper triangular matrix.
> However for $GF(2)$ we can immediately solve for the inverse matrix instead by the following pseudo code:
> 
> ```python
> def invert(M):
>   # Extend with the identity matrix on the right
>   system = [M | I]
>   # Iterate over all columns in the original M
>   for row_idx, col in enumerate(system.M):
>     # Find pivot row, which hasn't previously been applied
>     pivot = system.get_row_where((1 in col) and (not chosen previously))
>     # Move the pivot to the current row
>     system.swap_row(pivot, system.row(row_idx))
>     # Cancel all other rows with a 1 in the current column
>     for row in system:
>       row += pivot
>   # Return the part which was previously the identity
>   return system.I
> ```

Note that like the bits in the state vector, each individual entry in the matrix is a value in $\text{GF}(2)$,
i.e. it's either 0 or 1.
In particular this allows us to display this matrix as a bitmap, where a bright entry means a 1 and a dark pixel represents a 0.
For the toy LFSRs we saw previously this looks as follows:

> [!warning] TODO
> Add an LFSR component here, joined with the transition matrix T.
> Have the corresponding matrix entries highlight when hovering in the LFSR component.

Now that we have seen a bunch of theory, we can actually apply it to the above code snippets.
Focusing on a single LFSR component we have:
```cpp
a = (a << 12 ^ a >> 6) & 0x1fff ^ a >> 19 ^ a << 12;
```
for the first 2 bits we would have:
$$
\begin{aligned}
a_{31}' &= \big(( a_{19} \oplus 0) \cdot 0\big) \oplus 0 \oplus a_{19}\\
a_{30}' &= \big(( a_{18} \oplus 0) \cdot 0\big) \oplus 0 \oplus a_{18}\\
&\hspace{18mm}\vdots
\end{aligned}
$$
In total this will be $32$ equations per LFSR due to the 32 bit `uint32_t` size,
with some equations in the lower bits being redundant mirrors of upper bits due to the construction of the LFSRs (see boost implementation).
The full advancement matrices of the 3 LFSRs then look as follows:

> [!warning] TODO
> Add 3 side by side images here, one for each of the 3 LFSRs representing the matrices to be solved.

### Combining multiple LFSRs
We've seen that we can solve the state of a single LFSR as a linear equation of
the form $Ax=b$ where all components are computed modulo 2. Remember however that
the full RNG result is determined by 3 independent LFSRs whose output we XOR together.
We can model this as having 3 different states $s_1, s_2, s_3 \in \text{GF}(2)^n$
each with a corresponding transition matrix $T_1, T_2, T_3$. If we then stack all
these state vectors together, we obtain a big vector 
$s = [s_1 \quad s_2 \quad s_3]^\top$ describing the entire state at once.
For this new state vector we can again derive a transition matrix which we know to be invertible:
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

Thus, we realize that if we observe 3 states in a row we obtain the following
system of equations:

$$
\begin{bmatrix}o^{(t)} \\ o^{(t+1)} \\ o^{(t+2)}\end{bmatrix}
= \underbrace{\begin{bmatrix}I & I & I \\ T_1 & T_2 & T_3 \\ T_1^2 & T_2^2 & T_3^2\end{bmatrix}}_{A} s^{(t)}
$$

In other words: To figure out what the state of the PRNG registers was at any
time step $t$, we need to observe the results of 3 consecutive calls and solve
the linear system of equations: 
$$
s^{(t)} = A^{-1} \begin{bmatrix}o^{(t)} \\ o^{(t+1)} \\ o^{(t+2)}\end{bmatrix}
$$

> [!note]- Regarding the Invertibility of $T_i$
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

Before we try to implement it with only the resources available to us
in game, we still have to inspect two theoretical hurdles:
1. Currently we need the result of **consecutive calls**.
   These might not be available to us.
2. Moreover, the **full result width** i.e. all 32 bits at once of the PRNG calls are required for our observations.
   With pure game mechanics these are not necessarily observable.

As such, let's take a look at both of these issues, and how we can address them.

### Consecutive calls
In the previous derivation we utilized the states $s^{(t)}$, $s^{(t+1)}$ and $s^{(t+2)}$
which correspond to using the full width of 3 *consecutive* calls.
As we however are not necessarily the only thing in the simulation requesting
RNG values we need to consider a non isolated case.
There are several ways to tackle this:
1. If we have a method of counting the calls made between the calls we can skip
   the non observed results by generalizing the previous result to use $o^{(t+n)} = T^{n} s^{(t)}$ instead,
   where $n$ is the number of calls we skipped until the next measurement.
2. Alternatively, we try to force the measurements to occur consecutively.
   This can be done by disabling all other sources in game which can interfere
   with the measured calls, doing our necessary calls in order and computing / manipulating from there.
3. The latter can be extended by venturing into the realm of *sub-tick mechanics*.
   Every 1/60th of a second, the game performs an update step, aka a *tick*.
   Within this tick all the simulation mechanics run in a fixed order.
   One of the triggered mechanisms is of course the creation of the crafting results within
   all machines finishing their item crafting cycle.
   If we now can harness the order in which the machines queue the item creation events,
   placing our *entropy generators* in a consecutive block within this queue,
   we force that the RNG calls are gapless, ensuring proper state reconstruction can occur.

For my implementations I chose to pursue both option 2 and 3.
The former, as it does not rely on internal update orders, is the fallback method which should *always*
work (as long as the devs do not change the RNG away from `taus88`).
Meanwhile in theory, the latter approach allows for way faster state readout and more
robustness against extraneous outside calls.
In practice however, it appears somewhat *flaky*, breaking at seemingly arbitrary times.

<!-- 
> [!note] On the Update Order
> Initially I believed the machines to update in reverse placement order (i.e. newest first).
> This was confirmed by pausing the game and manually placing items into the input slots,
> ensuring the machines start in the same tick.
> Neither position (cross chunk, nor tile position) nor player insertion order
> influenced the order.
>
> Later however, I discovered that different entities (inserters) placing items into
> the machines lead to a different (seemingly inconsistent) order.
> One thing I found which stabilizes this ordering is using the update order of
> separate circuit networks. As far as I can tell, they are updated in sequence
> of ascending network IDs (visible in the circuit connection page).
-->

### Full result width
For our *Entropy Generators* we will use crafting recipes which have some
randomization in their outputs.
However, when we measure such an output, we do not obtain information about the
entire PRNG call. Instead, the only thing we *can* measure are some simple
questions about the output, depending on the chosen method. Some examples are:
- The number of output items. It involves randomness if either
  the recipe yields non-integer item stacks (e.g. [recycling](https://wiki.factorio.com/Recycler) recipes,
  which return 25% of the items required to craft a single input item or the item itself in case it is a self-recycle recipe),
  **or** it is a recipe with inherently random outputs (e.g. [uranium processing](https://wiki.factorio.com/Uranium_processing),
  where there is a 0.7% chance of producing a U-235 and a 0.7% chance of *not* producing a U-238).
- The quality level of the output. We can measure if it rose in level,
  and if yes by how many.

I'm going to focus on the first of the 2 methods, just observing the amount of
produced items (as this was the only source of information I had available when
I started this project). The thing to realize is that answering any of these
questions yields us only information about some of the *top bits* of the RNG
roll result.

Let's stick with the example of refining uranium ore into U235 and U238.
For this we have 2 production results:
- U238 occurs with 99.3% probability as a result and
- U235 with a 0.7% chance.

<!-- TODO: maybe add the `collectMaterials` code here -->
To generate these 2 outputs, the RNG is queried twice by a single result,
generating 2 subsequent RNG calls.
As these chances being both quite low / high we gain important knowledge whenever the low probability event occurs. 
The resulting item gets generated if the respective inequality holds,
where $r_i \in [0, 2^{32}-1]$ is the computed RNG roll:
$$
\begin{alignat}{}
r_1 \leq \left\lfloor 0.993 \cdot 2^{32} \right\rfloor &=\;& 4\,264\,902\,524_{10} &&= 11111110\ 00110101\ 00111111\ 01111100_2\\
r_2 \leq \left\lfloor 0.007 \cdot 2^{32} \right\rfloor &=\;&     30\,064\,771_{10} &&= 00000001\ 11001010\ 11000000\ 10000011_2
\end{alignat}
$$

In particular: If U238 **was not** generated, we know that the first 7 bits are 1 and if U235 **was** generated then the first 7 bits were 0.
Otherwise, we have no real knowledge about the generator / the roll bits.

Cool! But which recipe will yield us the highest amount of information each time it completes?
As the more information we obtain with a single crafting cycle, the fewer crafts we require and the faster we can determine the internal state.

As we saw above, the only information we can observe is determined by the top bits, and whether we obtained the item or not.
If we now estimate that the rolls are actually evenly distributed, we can compute the expected value of information gained with each roll & observation:
$$
\begin{align*}
\underbrace{0.007 \cdot 7\,\text{bit}}_{\text{no U238}} + \underbrace{0.993 \cdot 0\,\text{bit}}_{\text{U238}} &= 0.049\,\text{bit}\\
\underbrace{0.993 \cdot 0\,\text{bit}}_{\text{no U235}} + \underbrace{0.007 \cdot 7\,\text{bit}}_{\text{U235}} &= 0.049\,\text{bit}
\end{align*}
$$

This means we can expect a total of 0.098 bit each successful crafting cycle!
If we observe the pattern a bit longer we might notice that the number of leading bits
obtained in each positive case (i.e. where the probability is 0.7%) is
$\lfloor-\log_2(p)\rfloor$ where $p$ is the probability of the event occurring.
A similar thing holds for $p > 0.5$ where the result is instead leading 0 bits observed.
This allows us to compute the expected number of bits we measure for an event with probability $p$.
In whole, it is writable as:
$$
\mathbb{E}[\text{bits}] = p \left\lfloor -\log_2(p) \right\rfloor + (1-p) \left\lfloor -\log_2(1-p) \right\rfloor
$$
This function is also shown below.
The plot induces the following facts:
- The event which has the highest expected number of observed bits is situated at the event 50% split.
  At that point we can in fact always observe the most significant bit.
- While events closer to 0/1 allow us to infer more bits whenever they succeed, 
  the likelihood of the events occurring diminishes too fast,
  decreasing the total number of expected observed bits per event instead.

<!-- Expected bits plot, embed svg into this page to allow style reusage - needs to be imported above. -->
{@html rngplot}

In fact, what we just calculated is a discretized version of the
[Shannon Entropy](https://en.wikipedia.org/wiki/Entropy_(information_theory)).
As such, we have a measure applicable to each recipe in game allowing us to find the recipe yielding the most information per craft.
> [!warning] TODO
> insert the table here which shows all the recipe entropy values. 

As we can see there are *waaay* better recipes to utilize for extracting information from the game.
One might think that [scrap recycling](https://wiki.factorio.com/Scrap) would yield a lot of information,
but is with an entropy of 2.05 only slightly above recipes like recycling [repair packs](https://wiki.factorio.com/Repair_pack) which have entropy of 2.
This is due to the fact that recycling repair packs (and similar recipes with ingredient count = 4n+2)
yield exactly one bit of information of the RNG output in either case,
as it creates a perfect 50 / 50 split on whether the additional item will be created or not.
There are obviously alternative recipes such as the [oil refinery](https://wiki.factorio.com/Oil_refinery)
which has an entropy of 4.5.
These however are also quite a bit more expensive and slower than doing repair pack recycling.

## Actual Implementation
To actually implement the reversal and manipulation of the RNG I've split the computation into the following steps:
1. Sampling the current RNG
2. Computing the **current internal** RNG state,
3. Predicting the **future internal** states, and finally
4. Calculating corresponding **quality levels** for each future call

As already alluded to in [[#LFSR but backwards]] we will need to compute a matrix vector product for both of these steps.
Now the question is where do we get the matrices, and where do we get the vectors from?

### Sampling the RNG
The current state will be computed from *observations* made when recycling [repair packs](https://wiki.factorio.com/Repair_pack). 
Each recycling operation will yield exactly 2 bits of information - 1 for each item.
This in turn means, that we require $88/2=44$ recycling operations to have enough information to fully reconstruct the state.
As each result provides us with exactly one bit of information - the top most bit of the RNG call - the 88 observations can be written as: 
$$o^{(t)}, o^{(t+1)}, \dots, o^{(t+87)} \in GF(2)$$

A single unit measuring then can look as follows:

<figure>
  <img alt="Screenshot of a single entropy measurement unit." src="./factorio-rng/img/ingame_entropy_read_single.png" />
  <figcaption>A single entropy measurement unit.</figcaption>
</figure>

It has the following stages:
1. The inserter will move exactly 1 repair pack into the recycler.
2. The recycler will recycle the item, and upon completion query the RNG for 2 new integers, determining whether extra items (either 0 or 1) are produced.
3. Depending on whether the items are produced or not, they are placed into the *provider chest*.
   This chest is set to read the contents, providing the observation to the red wire.
4. These observations directly correspond to the top most observed bits $o^{(t+k)}$ due to the 50% chance of output.
   Further processing occurs through the decider combinators below.
5. Before the next call can occur, we clear the provider chest by making use of the *trash unrequested* option, alongside the *enable/disable* signal we can send over the green wire connected to it, which temporarily pauses the auto trashing behavior.

The above unit will therefore always provide us with 2 bits of information.
To reconstruct the full state quickly, we copy this singular unit 44 times, yielding a total of 88 bits.
This then comes out to:

<figure>
  <img alt="All entropy units joined together." src="./factorio-rng/img/ingame_entropy_read_all.png">
  <figcaption>All entropy units together.</figcaption>
</figure>

Of note here is the manner in which the individual units are queried.
There are 2 approaches:
1. Either each is triggered with a 1 tick delay, ensuring that they are always queried in the same order.
   This however requires us to not have *any* other RNG running in the meantime,
   as RNG calls which occur in between will mess up the expected ordering.
2. Alternatively, we can use same tick shenanigans.
   By splitting the red wire connecting the inserters with a 1 tick delay combinator in front of every inserter this can be achieved.
   Connecting the inputs to the delay first creates a shared circuit network.
   Then sequentially connecting all outputs of the delays to the corresponding inserters will create a standalone network for each inserter.
   As the game needs to update the networks in some manner, I bank on the fact that
   it will iterate through the list ordered by the network ID.
   This ensures that the RNG calls all happen in the same tick, with no ticks interfering.
   Note that the wire construction can also be done using a 2 stage blueprint.

> [!note] Note - Regarding the Same Tick Behavior
> While the same tick stuff seems to work in practice, I have not actually confirmed that this is how the game works under the hood.
> It can be brittle at times, as it seems to arbitrarily break at random times.
> In those cases simply reconstructing the wires allows it to work again.

### Determining the current state
As the units each produce only a single bits as a result, we need to apply the same strategy as before.
This time though, we only use the first row of the linear equation defined above for computing observations from the state:
$$
P_1 \underbrace{\begin{bmatrix}T_1^k & 0 & 0 \\ 0 & T_2^k & 0 \\ 0 & 0 & T_3^k\end{bmatrix}}_{T^k}
\begin{bmatrix}s_1^{(t)} \\ s_2^{(t)} \\ s_3^{(t)}\end{bmatrix}
= o^{(t+k)}
$$
with $P_1 = [p_{1i}] \in GF(2)^{96 \times 1}$ which is the first row of the matrix $P=\begin{bmatrix}I&I&I\end{bmatrix}$. 
If we now let $A_k = P_1 T^k \in \text{GF}(2)^{96 \times 1}$ be the matrix which denotes performing $k$ RNG steps and finally observe the topmost bit,
then we can write the observations we gather above to follow the subsequent equation:
$$
\begin{bmatrix}A_0\\\vdots\\A_{87}\end{bmatrix}
\begin{bmatrix}s_1^{(t)} \\ s_2^{(t)} \\ s_3^{(t)}\end{bmatrix}
=
A s^{(t)}
= 
\begin{bmatrix}o^{(t)} \\ \vdots \\ o^{(t+87)}\end{bmatrix}
$$
Now since we already consume the next 88 calls through our observation it would be beneficial to instead calculate the state the RNG is at after our observation, not before.
This can be achieved by making use of the inverse transition matrix $T^{-1}$ which causes some shift in the time index, creating a new matrix $A'$:
$$
A s^{(t)} =
A\, T^{-88} s^{(t+88)} =
A' s^{(t+88)}
$$
Shifting the time $t$ to also be relative to the next RNG call, instead of the start of measurement we then have that by solving $A's^{(t')}=o^{(t'-88,\dots,t'-1)}$ we compute the next to be internal RNG state from the previously done observations.
Note that as the transition matrices $T_i^{-1}$ exist (due to construction of the LFSRs) it does not change if we solve by applying $A$ or $A'$.

Now since there are only 88 bits which are actually linearly codependent, we cannot compute a full inverse.
However, a pseudo-inverse will suffice.
Especially since we are interested in the states after -- for which the lowest bits are entirely described by the MSB.
The really neat thing however is that matrix $A$ and likewise $A'$ does not depend on any dynamic state.
As such $A'^{-1} \in GF(2)^{88 \times 96}$ can precomputed in python to be subsequently used in Factorio. 

Hence we only need to implement a matrix vector multiply in $GF(2)$ in game.
To do so, remember the fact that any matrix vector product can be seen as a weighted sum of the columns of the matrix weighed by the entries in the vector:
$$
Ax = \sum_{k=1}^n x_k [A]_k = x_1 \overset{\rightarrow}{a}_1 + \dots + x_n \overset{\rightarrow}{a}_n
$$
In this case, as we are performing our computations in $GF(2)$, all values are either 0 or 1, meaning the multiply can be represented with a simple conditional, while the sum is substituted with an XOR over all the weighted vectors:
$$
s^{(t+88)} = \bigoplus_{k=0}^{87} o^{(t+k)} \cdot [A'^{-1}]_k
$$
Here $[A'^{-1}]_k$ is the $k$-th column of $A'^{-1}$ while $o^{(t+k)}$ is the $k$-th bit observation performed.
In practice this equation is computed in 2 parts:
1. The pointwise scalar vector multiplication of $o^{(t+k)} \in \{0, 1\}$ and vector $[A'^{-1}]_k$ is done via a *decider combinator*. If it was observed (= 1) then the column is output and implicitly accumulated, else it is not.
2. XOR of all the vectors via implicit summing. The vectors in $A'$ all contain only 0 or 1, meaning taking the sum over all included vectors, and finally extracting only the last bit of the sum is equivalent of taking the XOR over all of them. This is done by wiring the decider outputs all together and merging them in a single *arithmetic combinator*.

> [!warning] TODO:
> need to insert an image of the actual implementation in the game (e.g. sum / merge to single int32 value with 3 combinators).

### Looking into the future
We perform a similar action to compute the future states of the individual LFSRs.
However, as all LFSR states require fewer than 32 bits, we can store the lookup table in a more compact fashion.
For each LFSR we need to compute the following:
$$
T^ks^{(t)} = s^{(t+k)}
$$
This is computed for $k=1,2,\dots,N$, where $T$ and $s$ are different between the 3 sub LFSRs.
From this we can again rewrite these matrix vector multiplications as:
$$
s^{(t+k)} = \bigoplus_{j=1}^{32} s^{(t)}_j \cdot [T^k]_j
$$
where $[T^k]_j$ is the $j$-th column of $T^k$. These columns can be stored as 32 bit integers, as $T^k \in GF(2)^{32 \times 32}$.
Hence the skip ahead equation can be implemented in parallel for all $k$ steps as follows:
1. The pointwise scalar vector multiplication $s_j^{(t)}$ with all the different
   vectors will either include all the vectors in the corresponding $k$-th state or not,
   thus we can implement this via a *decider combinator* again.
2. Now we have 32 different 32 bit values which need to be XORed together.
   Unlike before we cannot utilize the implicit addition here, 
   as the vectors are now not represented by 32 different signals but instead via a single 32 bit signal value. 
   Thus we have to use more *arithmetic combinators*.
   I've opted to use a *binary tree* to merge 2 bits using XOR together,
   as this is a known fast reduction algorithm for prefix sums (which this is).

For a single LFSR this then looks as follows:
![Parallel look-ahead for a single LFSR](./factorio-rng/img/ingame_multi_step_single.png)

> [!warning] TODO:
> Mark the 2 sections described above in the given image

### Quality prediction
Now that we have the next call results of the RNG before the actual in game calls
happen, we need to make them usable for our purpose. This basically means implementing
some fashion of the `rollQuality` function from the game.
A reverse engineered version of the function can be seen here implemented in pseudo C++:
```cpp
// Fixedpoint value of the module effect from -32.768 to 32.767
// e.g. 10% quality would be a value of 100
typedef EffectValue int16_t;

// Stub of relevant quality prototype fields
struct QualityPrototype {
    ID<QualityPrototype, uint8_t> id;
    ID<QualityPrototype, uint8_t> next;
    double nextProbability;
}

// Mapping from the ID<...> to QualityPrototype
PrototypeList<QualityPrototype>::indexToPrototype;

// Function which determines crafting result quality
ID<QualityPrototype, uint8_t>* QualityPrototype::rollQuality(
  ID<QualityPrototype, uint8_t> qualityID,
  EffectValue bonus, 
  RandomGenerator* generator,
  IDIndexedData<uint8_t, ID<QualityPrototype, uint8_t>> 
    const* unlockedQualities
) {
  // If no bonus, do early return -> no RNG call!
  if (bonus == 0)
    return qualityID.copy();
  
  QualityPrototype* quality = indexToPrototype[qualityID];

  // Roll the RNG exactly once
  double roll = RandomGenerator::uniformDouble(generator);

  // If roll < threshold we upgrade to the next quality
  double threshold = (double)((float)(bonus) / 100f);

  // Find highest quality which beats the threshold
  uint8_t nextIndex;
  while ((nextIndex = quality->next.id.index) != 0) {
    if (!unlockedQualities->data[nextIndex])
      break;

    // Scale by next upgrade probability, base game = 0.1
    threshold *= quality->nextProbability;
    if (roll > threshold)
      break;

    quality = indexToPrototype[nextIndex];
  }
  return quality->id.copy();
}
```

If we take a look at how the function is implemented in the game we can see that
it basically just takes the RNG roll and compares it against some thresholds. It
stops as soon as it finds a threshold which is no longer beaten by the roll.

This means that each craft which involves quality rolls will take exactly 1 call.
And for each call we can compute the expected quality level by just comparing against
all the thresholds, which stay constant during the game. Thus they can be precomputed
in-game with some arithmetic combinators.

![Computing the quality levels from RNG states in game.](./factorio-rng/img/ingame_quality_compute.png)

The calculator below shows the required threshold for each quality level, as well
as the expected amount of each quality level for a given bonus.
Note that when the threshold exceeds $2^{32}-1$ i.e. the `uint32_t` maximum value,
we always upgrade, which is indicated by placing the thresholds in brackets.

<QualityCalculator/>

### Adapters
Yippee, we now can compute the threshold for RNG calls before they even occur in game.
Now the question is what can we do with that?
I have by now experimented with several -- what I call -- adapters,
which take in these predictions, and do some funny stuff with them.

Beginning with the first that I've implemented:
> [!warning] TODO: Add yt video of first "next up" method

It takes the sequence of future output qualities, and displays them next to the assembler,
similar to the "Next Up Pieces" queue in *Tetris*.
Each time a craft is completed, it advances the window into the future outputs by one,
keeping the display relevant and on edge all the time.

The next one was the following:
> [!warning] TODO: Add yt video of "sort quality"

This one takes the same list, but instead assigns only a single crafter to fabricate the next item.
The assembler which is selected depends on the next output quality.
In turn this leads to the 5 assemblers outputting the items in a sorted fashion,
where each belt only ever carries a single type of quality, ordered from left to right in increasing quality.

Finally the goal that I've been interested from the get go:
> [!warning] TODO: Add yt video of "automated legendary"

This method encapsulates the entire prediction and crafting loop into a closed system, 
which can do the entire thing (predict and craft) autonomously.
It involved additional work to calculate how many items need to be scrapped in between crafts to skip to the relevant RNG call,
as well as enqueuing these skip counts from the predicted raw RNG results which turn sparse after thresholding,
together with feeding the future RNG predictions back into it self to extend the time horizon. 


## Limitations
Now to the important part, that you may be wondering about:

<div style="text-align:center;">
  Sweet! Can I use this to now do &lt;insert RNG manipulation target&gt; in <i>my</i> save-game?
</div>

The short answer: Very unlikely. Why?
For this you can dig into the following tree which shows many of the paths in the
game's code which might lead to a random call.

> [!todo] TODO
> Insert image + link to proper rng call tree here

The main takeaways from that graph are as follows:
- There are actually not that many different types of random generators which get
  used throughout the game.
- Important for our considerations is the <span style="color:green">generalRandomGenerator</span>#
  which gets used by the `rollQuality` call.

Note that most of these generators have only a single instance which gets shared
across the entire `Map` object (i.e. across all surfaces you have the same state).
  
This sharing of rng state especially means that we would need to also predict
the number of calls made outside of our machine between the individual cycles
to keep a consistent state.
Otherwise we quickly desync between the computed state and the actual game state.

While it's not impossible in theory to do so, it is in fact very intractable:
One would need to reimplement all the different function calls and their behaviour
enough such that the rng calls are predictable for all objects using the same generator.
At that point you are basically just reimplementing major parts of Factorio
inside of Factorio (which while interesting is not the task at hand).

A less optimal alternative is to simply instead resample from time to time, and
hope that there are not too many calls which have been interwoven in the mean time.

However to use this properly the built factory needs to be essentially built with
the goal of RNG manipulation in mind - To be able to mitigate most common sources
of calls on the `generalRandomGenerator`. These include:
- **Mining Drill Resource Selection** - Hence all mining drills should be able to
  be turned off to place them in an idle state.
- **Fulgoran Lightning Strikes** - These occur during nighttime on Fulgora
  [about every 10 seconds per chunk](https://wiki.factorio.com/Fulgora#Lightning).
  To circumvent them sparking calls during our manipulation it needs to be done
  during daytime there.
- **Other RNG Crafts** - Not only quality, but any recipe with a random output will
  make calls to the generator. Either implement capabilities to turn them off, or
  some method to count the number of calls made every time a craft occurs.

The following are speculation and I have not tested yet in what capacity they actually
influence the state:
- **Explosions / Fire** - This means no biters nor asteroids should be running
  into landmines nor should there be rocket turrets or any active artillery.
- **Trees dropping Leaves** - Happens when trees are deconstructed, so no active
  agriculture towers.
- **Particles Spawning** - Particles are spawned with a random velocity, which in
  turn means that calls to the RNG are made.
  For instance **trains** consuming fuel will randomly emit puffs of smoke.
  
Another issue would be the sheer amount of computation that is necessary to keep
up with the game. For instance a single scrap recycling craft requires 12 calls
to simulate. 

## Conclusion
All in all, the fact is that the RNG used in Factorio is quite weak, and even
completely reversible in its entirety within the game.
Proper exploitation however is very difficult to do, and once one has access to
many of the required resources might not even be required anymore, as simply
increasing production means, one reaches the law of big numbers territory, i.e.
the average production is close to the real production results.

None the less, this project was quite a learning experience encompassing:
- Learning about *Galois Fields* and their combination with vector spaces.
- Reversal of the game binary, and figuring out the relevant control flows.
  Even splurging on (Binary Ninja)[https://binary.ninja/] which was so much more
  useful for reverse engineering than the open source alternative 
  (Ghidra)[https://github.com/NationalSecurityAgency/ghidra].
- Reimplementing the RNG, the matrix solver and parallel matrix multiplier all
  in game in an efficient manner.

P.s. I've begun this project end of april 2024, and finally got over being lazy
and published it more than a year later.
In the mean time someone else also posted about this on the
Factorio forums (Random number manipulation possibilities)[https://forums.factorio.com/viewtopic.php?p=660560].
As far as I can tell they stopped at a similar point as I did in one of the earlier
stages in the project, that is predicting the state externally with a separate
python script from some observations.
