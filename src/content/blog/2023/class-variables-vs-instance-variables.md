---
cover: ../../../assets/blog-img/2023/class-variables-vs-instance-variables/0c46e75c-e465-45b9-880c-be4cff7fdb14-9e7a584b.webp
title: "Class Variables vs Instance Variables in Python"
date: "Sun, 19 Feb 2023 11:38:55 GMT"
description: >-
  Class variables live on the class and are shared by default, while instance variables belong to one object. Learn how lookup and mutable defaults affect Python classes.
link: "https://swapnoneel.hashnode.dev/class-variables-vs-instance-variables"
tags:
  - python
  - oop
  - variables
  - programming
updated: "2026-08-09T08:00:04.817Z"
---

## The lookup happens in two places

Take account.owner. Python first asks the account object whether it has an owner attribute. If it does not, Python checks the class and then the classes above it. That small lookup rule is why a class attribute can appear to belong to every instance.

The value has not been copied into each object, though. An instance variable is stored on one object. A class variable is stored on the class and is shared by every object that reads it. Once you see where the value lives, the rest follows.

## Instance variables describe one object

Put per-object state on self, usually in __init__. Each call to a class creates a separate object, and each object gets its own attribute dictionary.

~~~python
class User:
    def __init__(self, name, points):
        self.name = name
        self.points = points

    def summary(self):
        return f"{self.name}: {self.points} points"


first = User("John", 12)
second = User("Jane", 7)

first.points += 5
print(first.summary())
print(second.summary())
~~~

The output is:

~~~text
John: 17 points
Jane: 7 points
~~~

first.points += 5 changes the attribute on first. It has no route to second.points. Both objects share the summary method through the class, but their data is separate.

You can inspect that storage directly while learning:

~~~python
print(first.__dict__)
print(second.__dict__)
~~~

Each dictionary contains its own name and points. This is a useful debugging trick, but do not build a design around __dict__; some Python objects use __slots__ and do not have one.

## Class variables describe the class

Put shared data in the class body. A count is a good example because there should be one count for all User objects.

~~~python
class User:
    total_users = 0

    def __init__(self, name):
        self.name = name
        type(self).total_users += 1


first = User("John")
second = User("Jane")

print(User.total_users)
print(first.total_users)
print(second.total_users)
~~~

All three prints show 2. The first lookup finds total_users on User. The other two lookups fail to find it on the individual objects, then find it on the class.

type(self).total_users is a deliberate choice. It lets a subclass keep its own count instead of always updating the User count. If you want one global count for the whole family, write User.total_users += 1 and make that ownership explicit.

Also, prefer User.total_users when reading class-owned data. first.total_users is legal, but it hides the fact that the value is shared.

## Assignment can hide the class value

This is the part that catches people:

~~~python
class User:
    role = "reader"


first = User()
second = User()

first.role = "admin"
print(first.role)
print(second.role)
print(User.role)
~~~

The output is:

~~~text
admin
reader
reader
~~~

The assignment did not update User.role. It created a new role attribute on first, so that one object now shadows the class value. Delete first.role and lookup falls back to User.role again:

~~~python
del first.role
print(first.role)
~~~

This is why class attributes are fine for defaults that instances may override, but they are a poor substitute for a shared setting that callers can casually shadow.

## Mutable class variables share one object

Numbers make sharing look harmless. Lists expose the trap immediately:

~~~python
class Team:
    members = []

    def add_member(self, name):
        self.members.append(name)


red = Team()
blue = Team()
red.add_member("Asha")

print(red.members)
print(blue.members)
~~~

Both lines print ['Asha'] because red.members and blue.members found the same list on Team, and append() mutated that list in place. If each team needs its own collection, create it in __init__:

~~~python
class Team:
    def __init__(self):
        self.members = []

    def add_member(self, name):
        self.members.append(name)
~~~

The class-level list is not always wrong. A shared immutable default, or a deliberately shared registry, can be exactly what you need. The failure comes from forgetting that a mutable value is one shared object until you create separate copies.

## My default choice

For ordinary application state, I choose instance variables first. They make ownership obvious, prevent accidental cross-object changes, and fit the way most objects are used. I reach for class variables when the value genuinely belongs to the class: a constant, a shared configuration default, or a counter that the class owns.

So the practical rule is simple: put per-object data on self, and make shared data visibly class-owned. Be extra suspicious of class-level lists and dictionaries. But that's just me, and your workflow might be different.

![Thank you graphic for class vs instance variables blog](../../../assets/blog-img/2023/class-methods-in-python/painted-thank-you-label-template-23-2148689616-3f36f359.webp)
