---
cover: "https://cdn.hashnode.com/res/hashnode/image/upload/v1676894340817/c0f1b8e2-f5dc-4950-82e9-dc74866f3c74.png?w=1200&auto=compress,format&format=webp&fm=png"
title: "Class Methods in Python"
date: "Mon, 20 Feb 2023 11:59:17 GMT"
description: "Introduction\nIn Python, classes are a way to define custom data types that can store data and define functions that can manipulate that data. One type of function that can be defined within a class is called a \"method.\" In this blog post, we will exp..."
link: "https://swapnoneel.hashnode.dev/class-methods-in-python"
---

## Introduction

In Python, classes are a way to define custom data types that can store data and define functions that can manipulate that data. One type of function that can be defined within a class is called a "method." In this blog post, we will explore what Python class methods are, why they are useful, and how to use them.

## What are Python Class Methods?

A class method is a type of method that is bound to the class and not the instance of the class. In other words, it operates on the class as a whole, rather than on a specific instance of the class. Class methods are defined using the `@classmethod` decorator, followed by a function definition. The first argument of the function is always `cls`, which represents the class itself.

## Why Use Python Class Methods?

Class methods are useful in several situations. For example, you might want to create a factory method that creates instances of your class in a specific way. You could define a class method that creates the instance and returns it to the caller. Another common use case is to provide alternative constructors for your class. This can be useful if you want to create instances of your class in multiple ways, but still have a consistent interface for doing so.

### How to Use Python Class Methods?

To define a class method, you simply use the `@classmethod` decorator before the method definition. The first argument of the method should always be `cls`, which represents the class itself. Here is an example of how to define a class method:

```python
class ExampleClass:
    @classmethod
    def factory_method(cls, argument1, argument2):
        return cls(argument1, argument2)
```

In this example, the `factory_method` is a class method that takes two arguments, `argument1` and `argument2`. It creates a new instance of the class `ExampleClass` using the `cls` keyword, and returns the new instance to the caller.

It's important to note that class methods cannot modify the class in any way. If you need to modify the class, you should use a class-level variable instead.

## Class Methods as Alternative Constructors

In object-oriented programming, the term "constructor" refers to a special type of method that is automatically executed when an object is created from a class. The purpose of a constructor is to initialize the object's attributes, allowing the object to be fully functional and ready to use.

However, there are times when you may want to create an object in a different way, or with different initial values than what is provided by the default constructor. This is where class methods can be used as alternative constructors.

A class method belongs to the class rather than to an instance of the class. One common use case for class methods as alternative constructors is when you want to create an object from data that is stored in a different format, such as a string or a dictionary. For example, consider a class named `Person` that has two attributes: `name` and `age`. The default constructor for the class might look like this:

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age
```

But what if you want to create a Person object from a string that contains the person's name and age, separated by a comma? You can define a class method named `from_string` to do this:

```python
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    @classmethod
    def from_string(cls, string):
        name, age = string.split(',')
        return cls(name, int(age))
```

Now you can create a Person object from a string like this:

```python
person = Person.from_string("John Doe, 30")
```

Another common use case for class methods as alternative constructors is when you want to create an object with a different set of default values than what is provided by the default constructor. For example, consider a class named `Rectangle` that has two attributes: `width` and `height`. The default constructor for the class might look like this:

```python
class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height
```

But what if you want to create a Rectangle object with a default width of 10 and a default height of 5? You can define a class method named `square` to do this:

```python
class Rectangle:
  def __init__(self, width, height):
    self.width = width
    self.height = height

  @classmethod
  def square(cls, size):
    return cls(size, size)
```

Now you can create a square and rectangle like this:

```python
rectangle = Rectangle.square(10)
```

## Conclusion

Python class methods are a powerful tool for defining functions that operate on the class as a whole, rather than on a specific instance of the class. They are useful for creating factory methods, alternative constructors, and other types of methods that operate at the class level. With the knowledge of how to define and use class methods, you can start writing more complex and organized code in Python.

Thanks for reading the blog, and I hope you have learned something new today. And until the next one, keep learning and keep exploring.

![](https://img.freepik.com/free-vector/painted-thank-you-label-template_23-2148689616.jpg?w=1380&t=st=1676893691~exp=1676894291~hmac=9f0960bb4730c2bbfdc9558840a6a8ed356377041f759a66392bdfff8f0612f2 align="center")
