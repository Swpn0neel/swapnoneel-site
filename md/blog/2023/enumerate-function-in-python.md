---
cover: >-
  https://cdn.hashnode.com/res/hashnode/image/upload/v1676362325400/bfe1526a-0cc1-40a8-9aa5-a931dcf8c69d.png?w=1200&auto=compress,format&format=webp&fm=png
title: "Enumerate Function in Python with Examples"
date: "2023-02-14T08:12:35.719Z"
description: >-
  enumerate() gives you each item with its index, so loops stay readable without a manual counter. Use it with lists, tuples, strings, and custom starting points.
link: "https://swapnoneel.hashnode.dev/enumerate-function-in-python"
tags:
  - python
  - loops
  - functions
  - programming
updated: "2026-07-23T13:07:48.942Z"
---

Have you ever written `index = 0` above a loop, incremented it at the bottom, and then wondered what happens when the loop gets a `continue`? That counter works, but it gives you another piece of state to maintain.

`enumerate()` puts the position beside the item for you. It accepts an iterable and returns an iterator that produces pairs such as `(0, "apple")`. Python creates each pair as the loop requests it, so you can use it without building a second list first.

## The loop you actually want

The built-in function works with lists, tuples, strings, and other iterable objects:

```python
# Loop over a list and print the index and value of each element
fruits = ['apple', 'banana', 'mango']
for index, fruit in enumerate(fruits):
    print(index, fruit)
```

The loop unpacks each pair into `index` and `fruit`. The output is:

```text
0 apple
1 banana
2 mango
```

If you want to inspect every pair at once, convert the iterator to a list:

```python
fruits = ['apple', 'banana', 'mango']
print(list(enumerate(fruits)))
```

That prints `[(0, 'apple'), (1, 'banana'), (2, 'mango')]`. In ordinary loops, do not add `list()` just to make the code look familiar. The loop already consumes the iterator one pair at a time, which avoids storing another collection.

The same pattern is handy when you need to replace or inspect one item. For example, this prints a numbered warning only for a missing value:

```python
statuses = ["ok", "missing", "ok"]
for position, status in enumerate(statuses, start=1):
    if status == "missing":
        print(f"Row {position} needs attention")
```

The output is `Row 2 needs attention`. Notice that the list remains unchanged. `enumerate()` reports positions; it does not edit the iterable for you.

This is usually clearer than indexing with `range(len(fruits))`:

```python
for index in range(len(fruits)):
    print(index, fruits[index])
```

The indexed version is not always wrong. It makes sense when you need to compare neighboring positions, assign back into a mutable list, or use the same index for several sequences. If you only need the value and its position, `enumerate()` says that directly and gives you fewer moving parts.

## Starting from one instead of zero

Python uses zero-based indexes by default, so the first item gets index `0`. That is useful when the number is an index into another sequence. If you are showing positions to a person, starting at `1` usually reads better. Pass the starting value with `start`:

```python
# Loop over a list and print the index (starting at 1) and value of each element
fruits = ['apple', 'banana', 'mango']
for index, fruit in enumerate(fruits, start=1):
    print(index, fruit)
```

Now the output is:

```text
1 apple
2 banana
3 mango
```

You can format the position in the loop without changing the original list:

```python
fruits = ['apple', 'banana', 'mango']
for index, fruit in enumerate(fruits):
    print(f'{index+1}: {fruit}')
```

The output is:

```text
1: apple
2: banana
3: mango
```

## Lists are not special

A tuple works the same way:

```python
# Loop over a tuple and print the index and value of each element
colors = ('red', 'green', 'blue')
for index, color in enumerate(colors):
    print(index, color)
```

Strings are iterable too, so `enumerate()` can give you each character and its position:

```python
# Loop over a string and print the index and value of each character
s = 'hello'
for index, c in enumerate(s):
    print(index, c)
```

You can pass a generator as well. That is where the lazy behavior becomes more useful:

```python
def read_numbers():
    for number in range(3):
        yield number * 10

for index, number in enumerate(read_numbers(), start=1):
    print(index, number)
```

The loop prints `1 0`, `2 10`, and `3 20` without asking the generator for every value in advance.

You can enumerate dictionary items too. `enumerate()` supplies the position, while `.items()` supplies the key and value:

```python
prices = {"tea": 20, "coffee": 30}
for position, (name, price) in enumerate(prices.items(), start=1):
    print(position, name, price)
```

The nested unpacking may look busy the first time you see it, but the names tell you what each value means. A separate counter would add no useful information here.

There are two easy mistakes. First, `start=1` changes the number reported by `enumerate()`, not the indexes stored in your list. Second, the position is not a permanent ID. If you remove items while iterating, later positions describe the current pass through the data. Changing a collection during a loop can create its own problems, so build a new collection when you need to filter or reorder values.

For a normal read-only loop, `enumerate()` is the cleanest answer whenever you need an item and its position. It is small, readable, and removes the counter bug before you have to debug it.

![Handwritten thank you typography](https://img.freepik.com/free-vector/painted-thank-you-label-template_23-2148689616.jpg?w=1380&t=st=1676893691~exp=1676894291~hmac=9f0960bb4730c2bbfdc9558840a6a8ed356377041f759a66392bdfff8f0612f2)
