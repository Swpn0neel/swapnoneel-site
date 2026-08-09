---
cover: ../../../assets/blog-img/2023/class-methods-in-python/c0f1b8e2-f5dc-4950-82e9-dc74866f3c74-5297b0be.webp
title: "Class Methods in Python with Examples"
date: "Mon, 20 Feb 2023 11:59:17 GMT"
description: >-
  Python class methods receive the class as cls, so they can build objects from alternate inputs and manage class-level behavior without an existing instance.
link: "https://swapnoneel.hashnode.dev/class-methods-in-python"
tags:
  - python
  - oop
  - backend
  - programming
updated: "2026-08-09T08:00:04.817Z"
---

## Start with the question of who owns the work

Before talking about decorators, ask one plain question: what does this method need to know?

An instance method needs one particular object, so Python gives it that object as self. A class method needs the class, so Python gives it the class as cls. A static method needs neither. That is the whole split, and most of the confusing explanations become easier once you keep that ownership question in view.

Here is a small class with one method that belongs to an object and another that belongs to the class:

~~~python
class User:
    def __init__(self, name, role):
        self.name = name
        self.role = role

    def describe(self):
        return f"{self.name} is a {self.role}."

    @classmethod
    def guest(cls):
        return cls("Guest", "reader")


user = User.guest()
print(user.describe())
~~~

describe() cannot do anything useful until a User exists, because it reads self.name and self.role. guest() has no existing user to inspect. It is a recipe for making one, so Python calls it with User as cls. The output is:

~~~text
Guest is a reader.
~~~

That is why User.guest() works before you have an instance. The decorator changes how the function is bound when you access it through the class.

## What the decorator changes

Without @classmethod, this method is an ordinary function sitting in the class body. If you call it through an instance, Python supplies that instance as the first argument. With @classmethod, Python stores a class-bound method instead and supplies the class.

You can see the practical difference by trying to use an instance method as a factory:

~~~python
class Ticket:
    def __init__(self, number):
        self.number = number

    def from_text(self, text):
        return Ticket(int(text))


# Ticket.from_text("42")  # TypeError: self is missing
ticket = Ticket(1)
print(ticket.from_text("42").number)
~~~

The commented call fails because from_text expects self. You have to create a meaningless Ticket(1) before you can use it. The class method version expresses the intent directly:

~~~python
class Ticket:
    def __init__(self, number):
        self.number = number

    @classmethod
    def from_text(cls, text):
        return cls(int(text))


ticket = Ticket.from_text("42")
print(ticket.number)
~~~

Now parsing and construction have a name of their own, and callers do not need to know how the text is converted.

## Alternative constructors are the sweet spot

The usual reason to write a class method is that one type can arrive in several input formats. Keep the normal __init__ for the canonical arguments, then add named entry points for other formats.

~~~python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    @classmethod
    def from_string(cls, text):
        name, age_text = text.split(",", maxsplit=1)
        return cls(name.strip(), int(age_text))

    @classmethod
    def child(cls, name):
        return cls(name, 0)


print(Person.from_string("John Doe, 30").age)
print(Person.child("Mina").name)
~~~

The constructor still owns the actual object setup. The class methods only translate input into the arguments that the constructor expects. If you later add validation in __init__, both alternate paths get it automatically.

There is one detail here that is easy to miss. Use cls(...), not Person(...), inside a class method:

~~~python
class Employee(Person):
    pass


employee = Employee.from_string("Ravi, 28")
print(type(employee).__name__)
~~~

The output is Employee. Python passes the class used for the call as cls, so the method stays friendly to subclasses. Hard-code Person(...) and you quietly throw that behavior away.

Bad input still fails. A string without a comma raises ValueError during unpacking, and text such as "Ravi, twenty" raises ValueError when int() runs. That is not a class method problem. It is the parser telling you that the input is not in the format it promised to accept. If the format comes from users or a file, catch those errors at the boundary and report the bad input there.

## Class methods versus static methods

A static method is useful when a function is conceptually grouped with a class but does not need either the object or the class:

~~~python
class Person:
    @staticmethod
    def valid_age(age):
        return isinstance(age, int) and age >= 0


print(Person.valid_age(30))
~~~

This could be a module-level function too. Keeping it on Person is reasonable if the rule is meaningful only in that small namespace. A class method is the better choice when the class itself matters, especially for factories that must preserve subclasses. A regular method is the right choice when the answer depends on one object's state.

My against-interest judgment is that class methods are easy to overuse. If a function does not construct an object or work with class-wide state, putting @classmethod on it adds ceremony and makes the reader wonder what cls is for. Start from the data the method needs. The first argument usually tells you which kind of method you actually have.

![Thank you label illustration](../../../assets/blog-img/2023/class-methods-in-python/painted-thank-you-label-template-23-2148689616-3f36f359.webp)
