---
cover: "https://cdn.hashnode.com/res/hashnode/image/upload/v1676646935359/8a36f405-f26f-4a80-8636-2eb562b13eeb.png?w=1200&auto=compress,format&format=webp&fm=png"
title: "Constructors and Decorators in Python"
date: "Fri, 17 Feb 2023 15:16:04 GMT"
description: "Introduction\nPython is a versatile programming language that provides a wide range of features and tools to developers for building robust and efficient software applications. Among the most important aspects of Python are constructors and decorators..."
link: "https://swapnoneel.hashnode.dev/constructors-and-decorators-in-python"
---

# Introduction

Python is a versatile programming language that provides a wide range of features and tools to developers for building robust and efficient software applications. Among the most important aspects of Python are constructors and decorators, which allow programmers to create and modify objects and functions in powerful ways.

In this blog post, we'll dive into the world of Python constructors and decorators, exploring their fundamental concepts, syntax, and use cases. We'll cover how constructors work in Python classes to initialize object properties and states, and how decorators can modify functions and methods to add functionality, behavior, or metadata. Understanding constructors and decorators are crucial to writing clean, maintainable, and extensible code. So let's get started and learn how to leverage these powerful tools in your Python development journey.

# Constructors

A constructor is a special method in a class used to create and initialize an object of a class. There are different types of constructors. Constructor is invoked automatically when an object of a class is created.

A constructor is a unique function that gets called automatically when an object is created of a class. The main purpose of a constructor is to initialize or assign values to the data members of that class. It cannot return any value other than None.

## Syntax of Python Constructor

```python
def __init__(self):
	# initializations
```

`__init__` is one of the reserved functions(<mark>dunder methods*</mark>) in Python. In Object Oriented Programming, it is known as a constructor.

*\*We will be covering Dunder Methods in Python in complete detail in the upcoming blogs, so make sure to follow me on Hashnode to get notified.*

## Types of Constructors

In Python, there are two types of Constructors; namely,

1. Parameterizedd Constructor
    
2. Default Constructor
    

### Parameterized Constructor

When the constructor accepts arguments along with self, it is known as parameterized constructor.

These arguments can be used inside the class to assign the values to the data members.

**<mark>Example:</mark>**

```python
class Details:
    def __init__(self, animal, group):
        self.animal = animal
        self.group = group

obj1 = Details("Crab", "Crustaceans")
print(obj1.animal, "belongs to the", obj1.group, "group.")
```

**<mark>Output:</mark>**

```python
Crab belongs to the Crustaceans group.
```

### Default Constructor

When the constructor doesn't accept any arguments from the object and has only one argument, self, in the constructor, it is known as a Default constructor.

**<mark>Example:</mark>**

```python
class Details:
  def __init__(self):
    print("animal Crab belongs to Crustaceans group")
obj1=Details()
```

**<mark>Output:</mark>**

```python
animal Crab belongs to Crustaceans group
```

# Decorators

Python decorators are a powerful and versatile tool that allows you to modify the behavior of functions and methods. They are a way to extend the functionality of a function or method without modifying its source code.

A decorator is a function that takes another function as an argument and returns a new function that modifies the behavior of the original function. The new function is often referred to as a "decorated" function. The basic syntax for using a decorator is the following:

```python
@decorator_function
def my_function():
    pass
```

The `@decorator_function` notation is just a shorthand for the following code:

```python
def my_function():
    pass
my_function = decorator_function(my_function)
```

Decorators are often used to add functionality to functions and methods, such as logging, memoization, and access control.

## Use-Case Scenario

One common use of decorators is to add logging to a function. For example, you could use a decorator to log the arguments and return value of a function each time it is called:

```python
import logging

def log_function_call(func):
    def decorated(*args, **kwargs):
        logging.info(f"Calling {func.__name__} with args={args}, kwargs={kwargs}")
        result = func(*args, **kwargs)
        logging.info(f"{func.__name__} returned {result}")
        return result
    return decorated

@log_function_call
def my_function(a, b):
    return a + b
```

In this example, the `log_function_call` decorator takes a function as an argument and returns a new function that logs the function call before and after the original function is called.

Decorators are a powerful and flexible feature in Python that can be used to add functionality to functions and methods without modifying their source code. They are a great tool for separating concerns, reducing code duplication, and making your code more readable and maintainable. Python decorators are a way to extend the functionality of functions and methods, by modifying their behavior without modifying the source code. They are used for a variety of purposes, such as logging, memoization, access control, and more. It is a powerful tool that can be used to make your code more readable, maintainable, and extendable.

# Conclusion

In this blog post, we've explored the key concepts and applications of constructors and decorators in Python. We've seen how constructors provide a way to initialize object properties and states, and how decorators can flexibly modify functions and methods.

By using constructors and decorators effectively in your Python projects, you can write more efficient, maintainable, and scalable code. Whether you're working on web development, data science, or any other field that uses Python, understanding constructors and decorators is a crucial part of your skill set.

So, as you continue your Python development journey, remember to experiment with constructors and decorators to take your code to the next level. With practice and experience, you'll be able to leverage these tools to build more complex, sophisticated, and impactful software applications.

Thank you for reading, and happy coding!

![](https://cdn.pizap.com/pizapfiles/images/thank_you_card_maker_app01.jpg align="center")
