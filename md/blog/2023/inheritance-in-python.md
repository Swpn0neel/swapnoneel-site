---
cover: >-
  https://cdn.hashnode.com/res/hashnode/image/upload/v1678204146942/71c0a906-e83b-429b-bc73-5f4edef049ee.png?w=1200&auto=compress,format&format=webp&fm=png
title: Inheritance in Python with Examples
date: "Tue, 07 Mar 2023 15:49:19 GMT"
description: >-
  Python inheritance lets a class reuse or replace behavior from a parent. This
  guide covers single, multiple, multilevel, hybrid, and hierarchical
  inheritance with examples.
link: "https://swapnoneel.hashnode.dev/inheritance-in-python"
tags:
  - python
  - oop
  - inheritance
  - programming
updated: "2026-08-09T21:03:04.071Z"
---

## Start with the relationship

Inheritance lets one class begin with behavior from another class. The new class is the child or subclass, and the existing class is the parent or base class.

```python
class Animal:
    def eat(self):
        print("eating")


class Dog(Animal):
    pass


dog = Dog()
dog.eat()
```

Dog gets eat from Animal, so the last line prints eating even though Dog has no method of its own. Python looks in Dog first, then follows the class's method resolution order until it finds the requested name.

That sounds simple, and it is. The design question is harder: should Dog really be treated as an Animal? Inheritance fits an "is a" relationship. A Dog is an Animal. A Dog has a Collar, so a collar would usually be another object stored on the dog, not a parent class. That distinction prevents a lot of awkward hierarchies.

## Single inheritance

Single inheritance gives a class one direct parent. It is the easiest form to read because the lookup path has one branch.

![Single inheritance diagram](https://media.geeksforgeeks.org/wp-content/uploads/20200108135809/inheritance11.png)

Here, Dog reuses the name setup from Animal and replaces the generic sound:

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def make_sound(self):
        print("A sound comes from the animal.")


class Dog(Animal):
    def make_sound(self):
        print("Bark!")


dog = Dog("Max")
print(dog.name)
dog.make_sound()
```

Dog does not define **init**, so Python finds Animal.**init** and uses it. Dog does define make_sound, so its method wins over the parent version. The output is:

```text
Max
Bark!
```

Override a method when the child has a genuinely more specific version of the same behavior. If the child merely needs to add a little work, call the parent implementation with super() rather than copying its body.

## Multiple inheritance

Multiple inheritance gives one class more than one direct parent. Small mixins are the least surprising use case: each parent supplies a separate behavior, and the child combines them.

![Multiple inheritance diagram](https://media.geeksforgeeks.org/wp-content/uploads/20200108144424/multiple-inheritance1.png)

```python
class Swimmer:
    def swim(self):
        print("Swimming")


class Runner:
    def run(self):
        print("Running")


class Triathlete(Swimmer, Runner):
    pass


athlete = Triathlete()
athlete.swim()
athlete.run()
print(Triathlete.__mro__)
```

The class gets swim from Swimmer and run from Runner. The final print shows the order Python searches, ending with object. If both parents define the same method, Swimmer wins in this example because it appears first in the class definition.

That does not mean you should pick a parent order at random. The method resolution order is part of the behavior. Also, parent initializers need care. Calling ParentA.**init** and ParentB.**init** manually can work, but it becomes fragile when a third class enters the hierarchy. Cooperative classes use super() and accept compatible arguments so Python can walk the whole MRO once.

## Multilevel inheritance

Multilevel inheritance creates a chain. One class extends a parent, and another class extends that child. It is useful when each level describes a real increase in specialization.

![Multilevel inheritance diagram](https://media.geeksforgeeks.org/wp-content/uploads/20200108144705/Multilevel-inheritance1.png)

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def show_details(self):
        print(f"Name: {self.name}")


class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)
        self.breed = breed

    def show_details(self):
        super().show_details()
        print(f"Breed: {self.breed}")


class GoldenRetriever(Dog):
    def __init__(self, name, color):
        super().__init__(name, "Golden Retriever")
        self.color = color

    def show_details(self):
        super().show_details()
        print(f"Color: {self.color}")


dog = GoldenRetriever("Max", "Golden")
dog.show_details()
```

The call to GoldenRetriever.show_details travels through all three implementations because each method does its own work and then calls super(). The output is:

```text
Name: Max
Breed: Golden Retriever
Color: Golden
```

Notice that super() does not mean "call my immediate parent by name" in a simple fixed sense. It follows the MRO from the current class. That detail becomes valuable in cooperative multiple inheritance, and it is also why direct calls such as Animal.show_details(self) can make a hierarchy harder to extend.

## Hybrid inheritance and the MRO

Hybrid inheritance combines shapes. A common example has two branches that share a base class, followed by a child that inherits from both branches:

![Hybrid inheritance diagram](https://media.geeksforgeeks.org/wp-content/uploads/Hybrid-Inheritance.png)

```python
class Person:
    def __init__(self, name):
        self.name = name


class Student(Person):
    def study(self):
        print(f"{self.name} is studying.")


class Athlete(Person):
    def train(self):
        print(f"{self.name} is training.")


class StudentAthlete(Student, Athlete):
    pass


person = StudentAthlete("Mina")
person.study()
person.train()
print(StudentAthlete.__mro__)
```

StudentAthlete can use study and train, and the inherited Person initializer supplies name. The MRO prevents Person from being visited twice in the diamond-shaped path. That is the part you need to understand before adding parent initializers or methods with the same name.

If each branch has its own setup, make the constructors cooperate:

```python
class Person:
    def __init__(self, name, **kwargs):
        super().__init__(**kwargs)
        self.name = name


class Student(Person):
    def __init__(self, name, subject, **kwargs):
        super().__init__(name=name, **kwargs)
        self.subject = subject


class Athlete(Person):
    def __init__(self, name, sport, **kwargs):
        super().__init__(name=name, **kwargs)
        self.sport = sport


class StudentAthlete(Student, Athlete):
    def __init__(self, name, subject, sport):
        super().__init__(name=name, subject=subject, sport=sport)
```

This pattern is more work than the earlier example, but each initializer passes the remaining keyword arguments along. A mismatch in the signatures will raise TypeError, which is much easier to fix than silently skipping half of an object's state.

## Hierarchical inheritance

Hierarchical inheritance has several children sharing one parent. The parent holds the common setup, while each child adds or replaces the part that differs.

![Hierarchical inheritance diagram](https://media.geeksforgeeks.org/wp-content/uploads/20200108144949/Hierarchical-inheritance1.png)

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def show_details(self):
        print(f"Name: {self.name}")


class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)
        self.breed = breed

    def show_details(self):
        super().show_details()
        print(f"Breed: {self.breed}")


class Cat(Animal):
    def __init__(self, name, color):
        super().__init__(name)
        self.color = color

    def show_details(self):
        super().show_details()
        print(f"Color: {self.color}")


Dog("Max", "Golden Retriever").show_details()
Cat("Luna", "Black").show_details()
```

Dog and Cat both inherit the name handling, but they do not need to share their breed and color fields. This shape is often cleaner than making one large Animal class full of conditionals about which species is currently active.

## Where inheritance stops helping

Inheritance is useful when the child can be passed to code that expects the parent. It is less useful when several classes merely share a few lines. In that situation, a helper function, a small mixin, or composition can keep the relationship honest.

My against-interest judgment is that inheritance feels cheap at first and expensive after several layers. A subclass can depend on a parent method, an attribute name, an initializer order, and an MRO detail without making those dependencies visible at the call site. I would rather repeat a small, clear function than force unrelated classes into the same family. Use inheritance for a real type relationship, then stop the hierarchy before it becomes archaeology.

![Thank you lettering graphic](https://static.vecteezy.com/system/resources/previews/017/125/080/large_2x/thank-you-design-lettering-free-vector.jpg)
