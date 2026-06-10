---
cover: "https://cdn.hashnode.com/res/hashnode/image/upload/v1676570291151/466fa74a-d06c-4241-83c6-7ac394ae1242.png?w=1200&auto=compress,format&format=webp&fm=png"
title: "Introduction to OOPs"
date: "Thu, 16 Feb 2023 17:58:21 GMT"
description: "Introduction\nIn programming languages, mainly there are two approaches that are used to write programs or code.\n\nProcedural Programming\n\nObject-Oriented Programming\n\n\nIn the previous blogs, I have covered almost all of the advanced nitty-gritty of Py..."
link: "https://swapnoneel.hashnode.dev/introduction-to-oops"
---

## Introduction

In programming languages, mainly there are two approaches that are used to write programs or code.

- Procedural Programming
- Object-Oriented Programming

In the previous blogs, I have covered almost all of the advanced nitty-gritty of Python. So, in this one and also in the upcoming blogs we will be diving right into the space of Object Oriented Programming(OOP). The basic idea of object-oriented programming (OOP) is to use classes and objects to represent real-world concepts and entities.

## Class

A class is a blueprint or template for creating objects. It defines the properties and methods that an object of that class will have. Properties are the data or state of an object, and methods are the actions or behaviors that an object can perform. It is used for creating objects, providing initial values for state (member variables or attributes), and implementations of behavior (member functions or methods). The user-defined objects are created using the class keyword.

### Creating a Class

Let us now create a class using the class keyword.

```python
class Details:
    name = "Ryan"
    age = 20
```

## Object

An object is an instance of a class, and it contains its own data and methods. For example, you could create a class called "Person" that has properties such as name and age, and methods such as speak() and walk(). Each instance of the Person class would be a unique object with its own name and age, but they would all have the same methods to speak and walk.

### Creating an Object

Let us now create an object of the previous class `Details`.

```python
obj1 = Details()
```

## Features of OOPs

Object Oriented Programming provides some unique features, namely ---- Abstraction, Encapsulation, Inheritance and Polymorphism.

### Abstraction

**Abstraction** is defined as a process of handling complexity by hiding unnecessary information from the user. This is one of the core [](https://stackify.com/oops-concepts-in-java/)concepts of object-oriented programming (OOP) languages. That enables the user to implement even more complex logic on top of the provided abstraction without understanding or even thinking about all the hidden background/back-end complexity.

### Encapsulation

One of the key features of OOP in Python is encapsulation, which means that the internal state of an object is hidden and can only be accessed or modified through the object's methods. This helps to protect the object's data and prevent it from being modified in unexpected ways.

### Inheritance

Another key feature of OOP in Python is inheritance, which allows new classes to be created that inherit the properties and methods of an existing class. This allows for code reuse and makes it easy to create new classes that have similar functionality to existing classes.

### Polymorphism

Polymorphism is also supported in Python, which means that objects of different classes can be treated as if they were objects of a common class. This allows for greater flexibility in code and makes it easier to write code that can work with multiple types of objects.

## Conclusion

In summary, OOP in Python allows developers to model real-world concepts and entities using classes and objects, encapsulate data, reuse code through inheritance, and write more flexible code through polymorphism.

We will get into the details of every topic mentioned here in my upcoming blogs. So, follow me to get notified about them!!

![](https://iag.me/assets/thank-you.jpg.webp align="center")
