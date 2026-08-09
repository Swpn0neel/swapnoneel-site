---
cover: >-
  https://cdn.hashnode.com/res/hashnode/image/upload/v1676646935359/8a36f405-f26f-4a80-8636-2eb562b13eeb.png?w=1200&auto=compress,format&format=webp&fm=png
title: Constructors and Decorators in Python with Examples
date: "Fri, 17 Feb 2023 15:16:04 GMT"
description: >-
  Python creates an object before __init__ initializes it, while decorators wrap
  functions to add behavior. This guide shows both ideas with small examples.
link: "https://swapnoneel.hashnode.dev/constructors-and-decorators-in-python"
tags:
  - python
  - decorators
  - oop
  - programming
updated: "2026-08-09T21:03:04.071Z"
---

## A class call has two stages

When you write Details("Crab", "Crustaceans"), Python does more than run a normal function. It creates an object, then initializes that object with the arguments you passed.

The method that creates the object is **new**. The method that prepares its attributes is **init**. People often call **init** the constructor, and that shorthand is fine for everyday work, but the distinction matters when you need to control object creation itself.

For most classes, you only write **init**:

```python
class Details:
    def __init__(self, animal, group):
        self.animal = animal
        self.group = group


details = Details("Crab", "Crustaceans")
print(details.animal, "belongs to the", details.group, "group.")
```

self is the newly created object. The assignments attach animal and group to that object, so another Details instance can store different values. The output is:

```text
Crab belongs to the Crustaceans group.
```

If you leave out **init**, Python can still create instances when no setup is required. Add an initializer when the object needs a known starting state:

```python
class Counter:
    def __init__(self):
        self.value = 0

    def increment(self):
        self.value += 1


counter = Counter()
counter.increment()
print(counter.value)
```

The output is 1. A common mistake is returning a value from **init**. It must return None; its job is to configure self, not replace it. return self and return 5 both raise TypeError when Python calls the class.

## When new matters

You can define **new** when object creation needs special rules, such as returning an existing object or creating an immutable value. That is advanced territory. If all you need is to copy arguments into attributes, **init** is the right place.

This version makes the order visible:

```python
class Example:
    def __new__(cls, value):
        print("creating")
        return super().__new__(cls)

    def __init__(self, value):
        print("initializing")
        self.value = value


example = Example(10)
print(example.value)
```

The lines print creating, initializing, and 10, in that order. If **new** returns an object that is not an instance of cls, Python will not continue with the usual **init** call. That is one reason not to override it casually.

## A decorator replaces the name with a callable result

Now switch from objects to functions. A decorator is a callable that receives a function and returns something that will be used in its place. The @ syntax is just a readable spelling of that assignment.

```python
def show_call(func):
    def wrapper():
        print("before")
        result = func()
        print("after")
        return result

    return wrapper


@show_call
def greet():
    print("hello")
    return 42


print(greet())
```

Python reads the decoration roughly like this:

```python
def greet():
    print("hello")
    return 42


greet = show_call(greet)
```

After that assignment, the name greet refers to wrapper. Calling greet() prints before, then hello, then after, and finally 42. The original function still runs because the wrapper calls func().

The final return result is easy to forget. If you remove it, the log still appears, but print(greet()) prints None. That kind of bug feels strange when the function body clearly returns a value, because the wrapper has quietly swallowed it.

## A decorator that accepts real arguments

A wrapper with no parameters only works for a function with no arguments. In normal code, use \*args and \*\*kwargs so the wrapper can pass along positional and keyword arguments.

```python
from functools import wraps


def log_function_call(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        print(f"calling {func.__name__}")
        result = func(*args, **kwargs)
        print(f"{func.__name__} returned {result}")
        return result

    return wrapper


@log_function_call
def add(first, second):
    return first + second


print(add(2, second=3))
```

wraps is worth keeping. Without it, add.**name** would be wrapper, and tools that inspect the function would see the wrapper's metadata instead of add's. This is not just cosmetic when a framework uses names, signatures, or docstrings.

Exceptions travel through the wrapper too. If add("2", 3) runs, the addition raises TypeError, the second log line is skipped, and the error reaches the caller. Add a try and finally only when you have a real reason to log failures or clean up resources.

## Where each tool earns its place

Use **init** for ordinary object setup. Use **new** only when the act of creating the object needs custom behavior. Use a decorator when the same surrounding behavior belongs around several functions, such as logging or permission checks.

My caveat is that decorators hide a call. A tiny @ line can change arguments, errors, metadata, and return values while leaving the function body untouched. When a decorated function behaves oddly, inspect the decorator before blaming the function. I like decorators, but I trust them only when the wrapper is short enough to read in one sitting.

![Thank you card maker graphic](https://cdn.pizap.com/pizapfiles/images/thank_you_card_maker_app01.jpg)
