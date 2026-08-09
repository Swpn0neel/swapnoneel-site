---
cover: ../../../assets/blog-img/2023/overriding-overloading-in-python/522eb53e-7247-4c31-a43d-a85a1bd1ea1c-ec2374fb.webp
title: "Overriding and Overloading in Python Explained"
date: "Tue, 21 Feb 2023 11:34:18 GMT"
description: >-
  Method overriding replaces inherited behavior, while operator overloading gives expressions such as + a meaning for your own objects.
link: "https://swapnoneel.hashnode.dev/overriding-overloading-in-python"
tags:
  - python
  - oop
  - polymorphism
  - programming
updated: "2026-08-09T08:00:04.817Z"
---

Inheritance becomes useful when the calling code can ask different objects to do the same job. A `Circle` and a `Rectangle` can both answer `area()`, even though the calculation is different. The caller keeps one method name, while each class supplies the behavior that belongs to it.

There are two different ideas in this post. Method overriding changes inherited behavior. Operator overloading gives a familiar operator, such as `+`, a meaning for your own class. They are related because both depend on Python choosing a method at runtime, but they solve different problems.

## Replacing inherited behavior

When a child class defines a method with the same name as a method in its parent, Python finds the child implementation first. That is method overriding.

Here is a complete example with one common interface:

```python
class Shape:
    def area(self):
        raise NotImplementedError("Each shape must define area()")


class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return 3.14159 * self.radius ** 2


class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height


shapes = [Circle(2), Rectangle(3, 4)]
for shape in shapes:
    print(shape.area())
```

The output is approximately `12.56636` followed by `12`. The loop does not need an `isinstance()` check because every object follows the same `area()` contract. That is the useful part of overriding: the caller can stay ignorant of the concrete class.

Python does not enforce an identical signature or return type when you override a method. Your design still should. If every shape is expected to answer `area()` without arguments, adding a required argument in one child breaks the promise made by the parent. Inheritance does not remove the need to keep an interface consistent.

## Keeping part of the parent behavior

Sometimes the child needs to add a detail rather than replace everything. `super()` calls the next implementation in Python's method resolution order, which is usually the parent method in a simple hierarchy.

For example, the parent can provide a general description:

```python
class Shape:
    def describe(self):
        return "This object is a shape."


class Circle(Shape):
    def describe(self):
        parent_description = super().describe()
        return f"{parent_description} It is specifically a circle."


print(Circle().describe())
```

The output contains both sentences. My caveat is that `super()` is easy to add mechanically and harder to justify mechanically. Use it when the parent's work remains part of the child behavior. If the child is meant to replace that behavior completely, calling `super()` only makes the result harder to follow.

## Giving operators a meaning

Operator overloading lets a class define what an operator means for its instances. Python translates an expression such as `p1 + p2` into a special method call, roughly `p1.__add__(p2)`. These are called dunder methods because their names begin and end with two underscores.

### A point that can be added

Suppose a point has an `x` coordinate and a `y` coordinate. Adding two points coordinate by coordinate is a meaning a reader can understand, so `+` is a reasonable fit:

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __add__(self, other):
        if not isinstance(other, Point):
            return NotImplemented
        return Point(self.x + other.x, self.y + other.y)


p1 = Point(1, 2)
p2 = Point(3, 4)
p3 = p1 + p2
print(p3.x, p3.y)
```

The output is `4 6`. Returning `NotImplemented` tells Python that this operand type is unsupported and gives the other operand a chance to handle the operation. Returning `None` would be different: the expression would appear to work and leave you with an unusable result.

The same idea maps other operators to special methods: `-` calls `__sub__()`, `*` calls `__mul__()`, `<` calls `__lt__()`, and `==` calls `__eq__()`.

There is one naming trap. Python does not support traditional method overloading where several methods share one name and differ only by parameter types. If you define `load()` twice, the second definition replaces the first. Default arguments or `*args` can support different call shapes, but a single clear method is usually easier to test.

So the judgment is fairly simple. Override a parent method when a child needs a different implementation of the same contract. Overload an operator when the resulting expression reads naturally and rejects unsupported types clearly. If the expression needs a paragraph of explanation before it makes sense, a named method is probably the better design.

![Thank you banner graphic](../../../assets/blog-img/2023/overriding-overloading-in-python/getty-469566889-105923-12ce25f4.webp)
