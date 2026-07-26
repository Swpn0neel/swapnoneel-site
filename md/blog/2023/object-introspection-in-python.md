---
cover: "https://cdn.hashnode.com/res/hashnode/image/upload/v1675784844805/e2ca5f71-f017-457e-b09e-d811d53e0195.png"
title: Object Introspection in Python
date: "2023-02-07T15:48:04.393Z"
description: >-
  Introduction

  We must look into dir(), __dict__(), id() and help() attribute/methods in
  python. They make it easy for us to understand how classes resolve various
  functions and execute code. In Python, there are three built-in functions that
  are commo...
link: "https://swapnoneel.hashnode.dev/object-introspection-in-python"
tags:
  - python
  - introspection
  - debugging
  - programming
updated: "2026-07-23T13:07:48.942Z"
---

## Introduction

We must look into `dir()`, `__dict__()`, `id()` and `help()` attribute/methods in python. They make it easy for us to understand how classes resolve various functions and execute code. In Python, there are three built-in functions that are commonly used to get information about objects: `dir()`, `__dict__()`, `id()` and `help()`. Let's take a look at each of them:

### The `dir()` method

The dir() function returns a list of all the attributes and methods (including dunder methods) available for an object. It is a useful tool for discovering what you can do with an object.

#### Example

```python
my_list = [1, 2, 3]
print(dir(my_list))
```

#### Output

```python
['__add__', '__class__', '__contains__', '__delattr__', '__delitem__', '__dir__', '__doc__', '__eq__', '__format__', '__ge__', '__getattribute__', '__getitem__', '__gt__', '__hash__', '__iadd__', '__imul__', '__init__', '__init_subclass__', '__iter__', '__le__', '__len__', '__lt__', '__mul__', '__ne__', '__new__', '__reduce__', '__reduce_ex__', '__repr__', '__reversed__', '__rmul__', '__setattr__', '__setitem__', '__sizeof__', '__str__', '__subclasshook__', 'append', 'clear', 'copy', 'count', 'extend', 'index', 'insert', 'pop', 'remove', 'reverse', 'sort']
```

### The `__dict__` **attribute**

The `__dict__` attribute returns a dictionary representation of an object's attributes. It is a useful tool for introspection.

#### Example

```python
class Person:
     def __init__(self, name, age):
         self.name = name
         self.age = age

p = Person("John", 30)
p.__dict__
```

#### Output

```python
{'name': 'John', 'age': 30}
```

### The `id()` method

The `id()` function returns a unique id for the specified object. All objects in Python have their own unique id. The id is assigned to the object when it is created.

The id is the object's memory address and will be different each time you run the program. (except for some object that has a constant unique id, like integers from -5 to 256)

#### Example

```python
name = "Harry Styles"
print(id(name))
```

#### Output

```python
139919915512240
```

### The `help()` method

The help() function is used to get help documentation for an object, including a description of its attributes and methods.

#### Example

```python
>>> help(str)
Help on class str in module builtins:

class str(object)
 |  str(object='') -> str
 |  str(bytes_or_buffer[, encoding[, errors]]) -> str
 |
 |  Create a new string object from the given object. If encoding or
 |  errors is specified, then the object must expose a data buffer
 |  that will be decoded using the given encoding and error handler.
 |  Otherwise, returns the result of object.__str__() (if defined)
 |  or repr(object).
 |  encoding defaults to sys.getdefaultencoding().
 |  errors defaults to 'strict'.
```

## Conclusion

In conclusion, `dir()`, `__dict__`, `id()` and `help()` are useful built-in functions in Python that can be used to get information about objects. They are valuable tools for introspection and discovery.

And, that's a wrap!! Hope you have learned something new today and until the next blog, keep learning and keep exploring!!

![Thank you placard concept illustration](https://img.freepik.com/free-vector/thank-you-placard-concept-illustration_114360-13436.jpg?w=1380&t=st=1675784022~exp=1675784622~hmac=b4748b9ac8dd94ff98a8232e0a56aa06102f42d9595f55a3b7cdc17121e72ea8)
