---
cover: >-
  https://cdn.hashnode.com/res/hashnode/image/upload/v1677076939156/3f57eaef-0577-4c41-ba36-a47eff63c664.png?w=1200&auto=compress,format&format=webp&fm=png
title: Magic Methods in Python Explained
date: "Wed, 22 Feb 2023 14:42:38 GMT"
description: >-
  Magic, or dunder, methods let Python objects respond to built-in syntax such
  as printing, len(), construction, and function calls.
link: "https://swapnoneel.hashnode.dev/magic-methods-in-python"
tags:
  - python
  - dunder-methods
  - oop
  - programming
updated: "2026-08-09T21:03:04.071Z"
---

## What magic methods do

Magic methods are special methods whose names start and end with two underscores. Python calls them for ordinary operations such as creating an object, printing it, asking for its length, or calling it like a function. You may also hear them called dunder methods.

You usually do not call these methods directly. You write the method that matches the behavior you want, then use normal Python syntax and let Python make the call.

The useful way to learn them is to start with the syntax you want your object to support. If `print(playlist)` should be readable, look at `__str__`. If `len(playlist)` should mean something, look at `__len__`. You do not need to memorise a catalogue of every dunder method before writing a class.

## **init** sets the initial state

Python calls `__init__` after it creates a new instance. Put the initial instance attributes there.

```python
class Playlist:
    def __init__(self, songs):
        self.songs = list(songs)


playlist = Playlist(["Intro", "Signal"])
print(playlist.songs)
```

The `list(songs)` call makes a new list for the object. The initializer prepares the object; it does not return the object itself.

## **str** and **repr** describe an object

`str(value)` and `print(value)` prefer `__str__`, which should be readable to a person. `repr(value)` is meant for debugging and should contain enough detail to identify the value clearly.

```python
class Playlist:
    def __init__(self, songs):
        self.songs = list(songs)

    def __str__(self):
        return ", ".join(self.songs)

    def __repr__(self):
        return f"Playlist({self.songs!r})"


playlist = Playlist(["Intro", "Signal"])
print(playlist)
print(repr(playlist))
```

The readable form is `Intro, Signal`. The representation is `Playlist(['Intro', 'Signal'])`. A `__repr__` result does not have to be executable, but showing the important state makes debugging much less frustrating.

## **len** supports len()

Define `__len__` when your object has a meaningful size. Python expects the method to return a non-negative integer.

```python
class Playlist:
    def __init__(self, songs):
        self.songs = list(songs)

    def __len__(self):
        return len(self.songs)


playlist = Playlist(["Intro", "Signal"])
print(len(playlist))
```

The call to `len(playlist)` is Python's friendly syntax for asking the object for `playlist.__len__()`.

The same idea applies to comparisons. If two objects represent the same value, `__eq__` can define what `first == second` means:

```python
class Song:
    def __init__(self, title):
        self.title = title

    def __eq__(self, other):
        if not isinstance(other, Song):
            return NotImplemented
        return self.title == other.title


print(Song("Signal") == Song("Signal"))
```

Without `__eq__`, two separate `Song` objects compare by identity, even when their attributes match. Returning `NotImplemented` for an unrelated type lets Python handle that comparison instead of pretending every object is comparable to a `Song`.

## **call** makes an object callable

Functions are objects too. A regular object can act like a function when its class defines `__call__`.

```python
class Multiplier:
    def __init__(self, factor):
        self.factor = factor

    def __call__(self, value):
        return value * self.factor


double = Multiplier(2)
print(double(5))
```

`double(5)` calls `double.__call__(5)`, so the object remembers its factor between calls. This pattern is useful when a callable needs configuration or state.

Another common dunder is `__iter__`, which lets an object participate in a `for` loop. For a playlist, iteration should expose the songs in the same order a caller expects:

```python
class Playlist:
    def __init__(self, songs):
        self.songs = list(songs)

    def __iter__(self):
        return iter(self.songs)


playlist = Playlist(["Intro", "Signal"])
for song in playlist:
    print(song)
```

These methods make an object fit a familiar Python protocol. That is the real benefit: callers can use normal language features instead of learning a private API for every class.

My caveat is to add a magic method only when normal syntax becomes clearer. A custom `__str__` often helps immediately. A pile of clever dunders can make a class feel like it is fighting Python instead of working with it. Keep return types and failure behavior unsurprising: `__len__` should return a non-negative integer, `__str__` should return a string, and an operator should reject unsupported values clearly.

![Painted thank you label graphic](https://img.freepik.com/free-vector/painted-thank-you-label-template_23-2148689616.jpg?w=1380&t=st=1677075508~exp=1677076108~hmac=168e84f6c0a2f5c63b505e2ac25f9d6200ecf461d2fea92d9e8526809c011186)
