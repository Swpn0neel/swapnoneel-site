---
cover: ../../../assets/blog-img/2023/sets-in-python/0fdb5f78-bd54-4eff-8ec4-68ffafb9e30a-4a756fdc.webp
title: "Sets in Python with Examples"
date: "2023-01-25T18:09:15.443Z"
description: >-
  Python sets store unique hashable values and make membership, union, intersection, difference, and symmetric difference easy.
link: "https://swapnoneel.hashnode.dev/sets-in-python"
tags:
  - python
  - data-structures
  - sets
  - programming
updated: "2026-08-09T08:00:04.817Z"
---

You have a list of email addresses and want to know who has already signed up. You can scan the list every time, or you can put the addresses in a set and ask one direct question: `email in subscribers`.

A set is a mutable collection of unique, hashable values. It is built for membership checks and operations between groups, not for keeping items at numbered positions. That one distinction explains most of the behavior that surprises people at first.

Curly braces create a set when they contain values. Repeated values collapse immediately:

```python
info = {"Carla", 19, False, 5.9, 19}
print(info)
```

The printed order can vary, and the duplicate `19` appears only once:

```text
{False, 19, 5.9, 'Carla'}
```

Do not build logic around that printed order. A set has no list-like index, so `info[0]` raises a `TypeError`. For an empty set, use `set()`, because `{}` creates an empty dictionary:

```python
empty_set = set()
empty_dictionary = {}
print(type(empty_set).__name__)
print(type(empty_dictionary).__name__)
```

The values inside a set must be hashable. Strings, numbers, tuples containing hashable values, and booleans work. A list does not:

```python
values = {"ready", ["not", "hashable"]}
```

That code raises `TypeError: unhashable type: 'list'`. A mutable list could change after insertion, which would make its lookup position unreliable. If you need a fixed collection inside a set, use a tuple when its contents are hashable.

## Iterating and checking membership

Iterate over a set with a `for` loop. Each value appears once, but the order may differ between runs:

```python
info = {"Carla", 19, False, 5.9}
for item in info:
    print(item)
```

The loop visits each value once. If you need predictable output for a report or a test, sort a compatible set first:

```text
False
5.9
19
Carla
```

For a membership check, the syntax is much shorter:

```python
allowed_roles = {"admin", "editor", "viewer"}
role = "editor"

if role in allowed_roles:
    print("access granted")
```

The set does not tell you where `"editor"` is. It answers whether the value belongs to the group. That is the contract you should design around.

## Combining groups

Set operations use the same ideas you may have seen in mathematics. A union collects values from either set, an intersection keeps values found in both, and a difference keeps values found on one side only. The methods return new sets unless their name ends in `_update`.

### Union without changing either set

`union()` returns a new set and leaves both inputs alone:

```python
cities = {"Tokyo", "Madrid", "Berlin", "Delhi"}
cities2 = {"Tokyo", "Seoul", "Kabul", "Madrid"}
cities3 = cities.union(cities2)
print(sorted(cities3))
print(sorted(cities))
```

The first line is `['Berlin', 'Delhi', 'Kabul', 'Madrid', 'Seoul', 'Tokyo']`, while the second still contains only the original four cities. The `|` operator is a shorter spelling for the same non-mutating operation:

```python
all_cities = cities | cities2
```

When you do want to change `cities`, use `update()`:

```python
cities = {"Tokyo", "Madrid", "Berlin", "Delhi"}
cities2 = {"Tokyo", "Seoul", "Kabul", "Madrid"}
cities.update(cities2)
print(sorted(cities))
```

Here `cities` itself has changed. This difference between a new result and an in-place update is worth checking before you pass a set into another function.

### Shared values with intersection

`intersection()` keeps values found in both sets and returns a new set:

```python
cities = {"Tokyo", "Madrid", "Berlin", "Delhi"}
cities2 = {"Tokyo", "Seoul", "Kabul", "Madrid"}
cities3 = cities.intersection(cities2)
print(sorted(cities3))
```

The output is `['Madrid', 'Tokyo']`. The `&` operator expresses the same idea as `cities & cities2`.

The update form keeps only the shared values in the original set:

```python
cities = {"Tokyo", "Madrid", "Berlin", "Delhi"}
cities2 = {"Tokyo", "Seoul", "Kabul", "Madrid"}
cities.intersection_update(cities2)
print(sorted(cities))
```

Now `cities` contains only the shared values. Use this form when you own the set and intentionally want to discard the other values.

### Values that belong to one side

`symmetric_difference()` keeps values that belong to one set but not both:

```python
cities = {"Tokyo", "Madrid", "Berlin", "Delhi"}
cities2 = {"Tokyo", "Seoul", "Kabul", "Madrid"}
cities3 = cities.symmetric_difference(cities2)
print(sorted(cities3))
```

The output is `['Berlin', 'Delhi', 'Kabul', 'Seoul']`. The `^` operator is the shorter form.

If you call the update version, `cities` changes in place:

```python
cities = {"Tokyo", "Madrid", "Berlin", "Delhi"}
cities2 = {"Tokyo", "Seoul", "Kabul", "Madrid"}
cities.symmetric_difference_update(cities2)
print(sorted(cities))
```

The result is the same four one-sided values, stored back in `cities`.

### Values missing from the other set

`difference()` is directional. It keeps values in the first set that are missing from the second:

```python
cities = {"Tokyo", "Madrid", "Berlin", "Delhi"}
cities2 = {"Seoul", "Kabul", "Delhi"}
cities3 = cities.difference(cities2)
print(sorted(cities3))
```

The output is `['Berlin', 'Madrid', 'Tokyo']`. Reversing the operands gives a different answer because `cities2 - cities` means something else.

`difference_update()` stores the result back in the first set:

```python
cities = {"Tokyo", "Madrid", "Berlin", "Delhi"}
cities2 = {"Seoul", "Kabul", "Delhi"}
cities.difference_update(cities2)
print(sorted(cities))
```

Now `cities` contains only cities that were not in `cities2`.

You can also ask whether one set contains another with `issubset()` and `issuperset()`, or test whether two sets share nothing with `isdisjoint()`. These methods read like the question you are asking, which is usually better than writing a manual loop.

My practical judgment is that sets are the right tool for membership and group comparison, and a bad tool for ordered output. If the order is part of the result, keep a list or convert the set to a sorted list at the boundary where you display it. The set should answer "does this belong?"; a list should answer "what comes next?".

![Thank you banner graphic for Python sets blog](../../../assets/blog-img/2023/sets-in-python/pexels-photo-2072165-8442d23b.webp)
