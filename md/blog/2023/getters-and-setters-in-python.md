---
cover: >-
  https://cdn.hashnode.com/res/hashnode/image/upload/v1676665768059/5c47a278-9f02-4928-a098-0aee8b08d448.png?w=1200&auto=compress,format&format=webp&fm=png
title: Getters and Setters in Python Explained
date: "Sat, 18 Feb 2023 13:32:09 GMT"
description: >-
  Python property() lets a class validate or compute an attribute without making
  callers use explicit getter and setter methods.
link: "https://swapnoneel.hashnode.dev/getters-and-setters-in-python"
tags:
  - python
  - oop
  - encapsulation
  - programming
updated: "2026-08-09T21:03:04.071Z"
---

## Keep the public name simple

Suppose a Person object stores an age. You want callers to write person.age, not person.get_age() every time they read it. At first, a plain attribute is enough. The trouble begins when a caller assigns -4 or the string "old", and your class has no place to reject it.

A property keeps the pleasant attribute syntax while running Python code on reads and writes. It is a useful boundary, but it is not a magic private field. Python still trusts you to respect the interface you chose.

## A property starts as a getter

The property decorator turns a method into an attribute-like read:

```python
class Person:
    def __init__(self, age):
        self._age = age

    @property
    def age(self):
        return self._age


person = Person(30)
print(person.age)
```

The output is 30. Python sees person.age, calls the age method, and returns the value from \_age. The leading underscore is a convention that says the storage is for internal use. It does not stop someone from writing person.\_age = -4.

Because the property has no setter yet, this works:

```python
print(person.age)
```

But person.age = 31 raises AttributeError. A read-only property is useful for a value that the object calculates or exposes without allowing outside code to replace it.

## Add validation with a setter

Decorate a second method with age.setter. The method receives the value on the right side of the assignment:

```python
class Person:
    def __init__(self, age):
        self.age = age

    @property
    def age(self):
        return self._age

    @age.setter
    def age(self, value):
        if not isinstance(value, int):
            raise TypeError("age must be an integer")
        if value < 0:
            raise ValueError("age cannot be negative")
        self._age = value


person = Person(30)
person.age = 31
print(person.age)
```

The initializer assigns to self.age instead of self.\_age on purpose. That sends the first value through the same validation as every later assignment. Person(-1) raises ValueError, and Person("thirty") raises TypeError before an invalid object can escape.

The setter does not have to store the value unchanged. It can normalize it, convert units, or reject a value that violates the class's rules:

```python
class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("temperature is below absolute zero")
        self._celsius = float(value)

    @property
    def fahrenheit(self):
        return self.celsius * 9 / 5 + 32


temperature = Temperature(20)
print(temperature.fahrenheit)
```

fahrenheit is computed from celsius, so there is no second piece of state to keep in sync. If you stored both values, every update would create another chance for them to disagree.

## The recursion trap

Inside a property getter, return the backing attribute, not the property itself. Inside the setter, assign to \_age, not age:

```python
class BrokenPerson:
    @property
    def age(self):
        return self.age

    @age.setter
    def age(self, value):
        self.age = value
```

Reading age calls the getter, which reads age again, which calls the getter again until Python raises RecursionError. Assigning to age creates the same loop in the setter. The private-looking backing name prevents that accidental self-call.

## Do you need a property at all

Usually, no. A plain public attribute is a good starting point when it has no validation or calculation behind it. You can replace that attribute with a property later without changing code that reads person.age or assigns to it. That is one of the nicest parts of the pattern.

Do not create a getter and setter that only return and assign the same value for the sake of ceremony. In Python, properties earn their place when a read needs a calculation, a write needs a rule, or the stored representation should stay separate from the public name.

My caveat is to keep the public name stable and the property small. If a getter performs a database query or a setter triggers half the application, attribute syntax can hide a surprisingly expensive operation. For simple validation and computed values, property is a good fit. For larger actions, an explicit method tells the reader more honestly what a call will do.

![Thank you banner graphic](https://etiquettejulie.com/wp-content/uploads/2017/01/thank-you-from-christian-vision-alliance.jpg)
