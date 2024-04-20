---
title: Reversing Factorio's RNG
description: Understanding and reversing Factorio's PRNG
date: '2024-04-20'
categories: ['factorio', 'rng', 'reverse-engineering']
published: true
---

So how did we get here? The following is my journey to figure out how Factorio's RNG works.
$a + b$
$$\LaTeX$$
```python
import random
random.seed(0)
print(random.randint(0, 100))
```
