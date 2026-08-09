---
cover: >-
  https://cdn.hashnode.com/res/hashnode/image/upload/v1676570291151/466fa74a-d06c-4241-83c6-7ac394ae1242.png?w=1200&auto=compress,format&format=webp&fm=png
title: Introduction to OOPs in Python
date: "Thu, 16 Feb 2023 17:58:21 GMT"
description: >-
  Object-oriented programming groups data and behavior into classes and objects.
  This Python guide explains abstraction, encapsulation, inheritance, and
  polymorphism without treating OOP as a rule.
link: "https://swapnoneel.hashnode.dev/introduction-to-oops"
tags:
  - python
  - oop
  - software-design
  - programming
updated: "2026-08-09T21:03:04.071Z"
---

## What object-oriented programming tries to solve

Procedural code starts with actions: read a value, transform it, then save or print the result. That style is perfectly fine for a script that imports a file once. As the program grows, though, the data and the functions allowed to change it can end up scattered across many modules.

Object-oriented programming, or OOP, gives related state and behavior a home. A class describes a kind of object. An object is one concrete value made from that class. You are not required to use classes for every problem, and forcing a tiny script into a hierarchy is a quick way to make simple code feel strange.

Start with a class that keeps a person's data beside an operation that uses it:

```python
class Person:
    def __init__(self, name):
        self.name = name

    def greet(self):
        return f"Hello, I am {self.name}."


first = Person("Ryan")
second = Person("Mina")

print(first.greet())
print(second.greet())
```

Person is the class. first and second are objects, also called instances. The class supplies the greet method, while each object stores its own name. The output is:

```text
Hello, I am Ryan.
Hello, I am Mina.
```

That relationship is the foundation. The four words usually connected with OOP describe different ways of using it.

## Abstraction hides the steps you do not need

Abstraction means exposing an operation while keeping its internal steps out of the caller's way. When you call first.greet(), you do not need to rebuild the string or know where name is stored. The method gives you the operation you need.

The same idea exists in ordinary functions. A function that loads and validates a configuration file is an abstraction even if the program contains no class. The [OOP concepts overview](https://stackify.com/oops-concepts-in-java/) describes this as hiding complexity behind a simpler interface.

Good abstraction has a limit. If the method name is vague, or if it secretly opens files, makes network requests, and changes global state, the caller has a harder time predicting what will happen. Hide the steps that are implementation details, but keep the public action honest.

## Encapsulation keeps rules near the data

Encapsulation means putting state and the operations that protect it in the same place. Python does not enforce private fields in the same way as some languages. A leading underscore is a convention, not a locked door, but it tells readers which attribute the class owns internally.

```python
class Wallet:
    def __init__(self, amount=0):
        if amount < 0:
            raise ValueError("amount cannot be negative")
        self._balance = amount

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("deposit must be positive")
        self._balance += amount

    def spend(self, amount):
        if amount <= 0 or amount > self._balance:
            raise ValueError("invalid spending amount")
        self._balance -= amount

    @property
    def balance(self):
        return self._balance


wallet = Wallet(20)
wallet.deposit(5)
wallet.spend(8)
print(wallet.balance)
```

The output is 17. The class owns the rules for changing the balance, so callers do not have to remember every check. Someone can still write wallet.\_balance = -100, because Python trusts convention, but ordinary code has a clear public path.

This is where encapsulation pays off. If the storage changes from a number to another representation later, the deposit, spend, and balance interface can stay the same.

## Inheritance describes a narrower type

Inheritance lets a new class reuse or replace behavior from an existing class:

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return "Some sound"


class Dog(Animal):
    def speak(self):
        return "Bark"


dog = Dog("Max")
print(dog.name)
print(dog.speak())
```

Dog gets the name setup from Animal and supplies a more specific speak method. This is a reasonable relationship because a dog is an animal. A Dog has a Collar, though, so a collar would usually be stored as another object rather than added as a parent class.

Inheritance is useful when code genuinely expects the parent type. It becomes awkward when the only shared feature is a few lines of implementation. A helper function or composition can be clearer in that case.

## Polymorphism lets the caller ignore the concrete type

Polymorphism means different objects can respond to the same operation in their own way. Python often handles this through duck typing: the function asks for behavior instead of checking a long list of class names.

```python
class Dog:
    def speak(self):
        return "Bark"


class Cat:
    def speak(self):
        return "Meow"


def announce(animal):
    print(animal.speak())


announce(Dog())
announce(Cat())
```

announce does not need separate branches for Dog and Cat. It only needs an object with a speak method. Pass an object without speak and Python raises AttributeError at the call, which is a useful, direct failure. If you need a friendlier error, validate the interface before doing work, but do not add type checks just to make the code look formal.

Python's built-in types use the same idea all over the place. Anything with a **len** method can work with len(), and anything iterable can work in a for loop. The class name matters less than the behavior the operation requires.

## OOP is a tool, not a rule

Classes help when state and behavior belong together, when several objects share a clear interface, or when a type has rules that should live in one place. A plain function and a dictionary can be better for a one-off transformation.

My honest view is that OOP is easiest to understand after you stop treating its four labels as a checklist. Start with the data and the operations. If they naturally belong together, make a class. If a class would only wrap one function and a couple of values, skip it. The design should make the next change easier, not earn points for containing more objects.

![Thank you image](https://iag.me/assets/thank-you.jpg.webp)
