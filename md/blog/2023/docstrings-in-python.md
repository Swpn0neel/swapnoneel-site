---
cover: >-
  https://cdn.hashnode.com/res/hashnode/image/upload/v1674921636996/6039154e-d731-486b-8d15-888cb8bba647.png?w=1200&h=630&fit=crop&crop=entropy&auto=compress,format&format=webp&fm=png
title: Docstrings in Python with Examples
date: "2023-01-25T14:42:32.056Z"
description: >-
  Python stores a docstring on __doc__, where tools and people can read it.
  Learn how docstrings differ from comments and how to write useful ones.
link: "https://swapnoneel.hashnode.dev/docstrings-in-python"
tags:
  - python
  - documentation
  - clean-code
  - programming
updated: "2026-08-09T21:03:04.071Z"
---

## The string Python remembers

A docstring is a string literal placed immediately after the definition of a module, class, function, or method. Python stores that string on the object's **doc** attribute. That is the difference between a docstring and an ordinary explanatory sentence in a comment: programs can read the docstring later.

Start with the smallest useful example:

```python
def square(number):
    """Return the square of number."""
    return number ** 2


print(square(5))
print(square.__doc__)
```

The output is:

```text
25
Return the square of number.
```

The string does not print when square runs. It becomes metadata attached to square, and the second print asks for that metadata directly. You can inspect it in a Python shell without opening the function's source file.

## Position is part of the rule

Python only treats the first string expression in a definition as its docstring. Put an assignment or another statement first, and the string remains an unused literal:

```python
def wrong_order():
    value = 10
    """This text is not the function docstring."""
    return value


print(wrong_order.__doc__)
```

The output is None. The string is valid Python, but it is no longer in the position Python reserves for documentation. This is a small rule, and it is easy to break when adding setup code above a docstring.

The same pattern works for classes and modules:

```python
class Notebook:
    """Store notes in memory."""

    def __init__(self):
        self.notes = []


print(Notebook.__doc__)
```

Here the docstring describes the class as a callable object type. A module docstring follows the module's opening comments and appears before other statements in the file.

## Comments answer a narrower question

Use a comment to explain a line, a workaround, or a decision inside the implementation. Python does not attach comments to the function object. Use a docstring for the public behavior that a caller needs to understand.

```python
def divide(total, count):
    """Return total divided by count.

    Raises ZeroDivisionError when count is zero.
    """
    # The explicit check gives the caller a clear rule before division.
    if count == 0:
        raise ZeroDivisionError("count cannot be zero")
    return total / count
```

The comment explains why the check exists. The docstring explains what divide returns and what can go wrong for someone calling it. If the function is part of a package, that distinction becomes more useful because a reader may see the docstring in an editor or generated reference page without reading the source.

## Write for the next caller

A useful docstring answers the questions that the function signature does not. What does the value mean? Does the function mutate an argument? Which errors should the caller handle? Does an empty input have a special result?

```python
def average(values):
    """Return the arithmetic mean of a non-empty sequence of numbers.

    Raises ValueError when values is empty.
    """
    if not values:
        raise ValueError("values must not be empty")
    return sum(values) / len(values)


print(average([2, 4, 6]))
```

The first sentence is enough for a quick read. The second tells a caller why an empty list fails. You do not need to document every obvious line, and you should not turn every short function into a wall of labels that says less than one good sentence.

For a public library, a longer format can be useful when the parameters and examples are genuinely hard to infer. Keep the format consistent with the project. The format matters less than the truth of the information inside it.

## Read the documentation while debugging

The built-in help function reads docstrings:

```python
help(average)
```

In an interactive shell, the result may open in a pager. Press q to leave the pager when you are done. You can also use **doc** when you want the raw string, or inspect the class and method that owns the documentation.

One warning: inherited or decorated functions can make the source of a docstring less obvious. A decorator that does not preserve metadata may replace the original docstring with None or with the wrapper's text. functools.wraps helps when you write decorators, but the practical fix is still to check what help() shows for the callable a user actually receives.

My caveat is that a docstring is part of the interface, not a comment dump. When the implementation changes, reread it as if you were a new caller. A short description that stays true is worth more than a detailed promise the function no longer keeps.

![Thank you card in blue tones](https://img.freepik.com/free-vector/thank-you-card-blue-tones_23-2148665027.jpg?w=1380&t=st=1674657663~exp=1674658263~hmac=4b0703b3e652f76dd18a3a9e99932842361293d22d9096d3abafe7d2f2280837)
