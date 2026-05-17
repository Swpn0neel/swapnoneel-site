---
cover: "https://cdn.hashnode.com/res/hashnode/image/upload/v1677076939156/3f57eaef-0577-4c41-ba36-a47eff63c664.png?w=1200&auto=compress,format&format=webp&fm=png"
title: "Magic Methods in Python"
date: "Wed, 22 Feb 2023 14:42:38 GMT"
description: "Introduction\nMagic Methods are special methods that you can define in your classes, and when invoked, they give you a powerful way to manipulate objects and their behavior.\nMagic methods, also known as “dunders” from the double underscores surroundin..."
link: "https://swapnoneel.hashnode.dev/magic-methods-in-python"
---

## Introduction

Magic Methods are special methods that you can define in your classes, and when invoked, they give you a powerful way to manipulate objects and their behavior.

Magic methods, also known as “dunders” from the double underscores surrounding their names, are powerful tools that allow you to customize the behavior of your classes. They are used to implement special methods such as addition, subtraction and comparison operators, as well as some more advanced techniques like descriptors and properties.

Let’s take a look at some of the most commonly used magic methods in Python.

## `__init__` method

The `__init__` method is a special method that is automatically invoked when you create a new instance of a class. This method is responsible for setting up the object’s initial state, and it is where you would typically define any instance variables that you need. It is also called "constructor", which we have discussed earlier.

## `__str__ and __repr__` methods

The `__str__` and `__repr__` methods are both used to convert an object to a string representation. The **str** method is used when you want to print out an object, while the **repr** method is used when you want to get a string representation of an object that can be used to recreate the object.

## `__len__` method

The `__len__` method is used to get the length of an object. This is useful when you want to be able to find the size of a data structure, such as a list or dictionary.

## `__call__` method

The `__call__` method is used to make an object callable, meaning that you can pass it as a parameter to a function and it will be executed when the function is called. This is an incredibly powerful tool that allows you to create objects that behave like functions.

## Conclusion

These are just a few of the many magic methods available in Python. They are incredibly powerful tools that allow you to customize the behavior of your objects and can make your code much cleaner and easier to understand. So if you’re looking for a way to take your Python code to the next level, take some time to learn about these magic methods.

Well, that's a wrap for now!! Hope you folks have enriched yourself today with lots of known or unknown concepts. I wish you a great day ahead and till then keep learning and keep exploring!!

![](https://img.freepik.com/free-vector/painted-thank-you-label-template_23-2148689616.jpg?w=1380&t=st=1677075508~exp=1677076108~hmac=168e84f6c0a2f5c63b505e2ac25f9d6200ecf461d2fea92d9e8526809c011186 align="center")
