---
cover: "https://cdn.hashnode.com/res/hashnode/image/upload/v1676806711688/0c46e75c-e465-45b9-880c-be4cff7fdb14.png?w=1200&auto=compress,format&format=webp&fm=png"
title: "Class Variables vs Instance Variables"
date: "Sun, 19 Feb 2023 11:38:55 GMT"
description: "Introduction\nIn Python, variables can be defined at the class level or at the instance level. Understanding the difference between these types of variables is crucial for writing efficient and maintainable code. So, let's just dive into it !!\nClass V..."
link: "https://swapnoneel.hashnode.dev/class-variables-vs-instance-variables"
---

## Introduction

In Python, variables can be defined at the class level or at the instance level. Understanding the difference between these types of variables is crucial for writing efficient and maintainable code. So, let's just dive into it !!

## Class Variables

Class variables are defined at the class level and are shared among all instances of the class. They are defined outside of any method and are usually used to store information that is common to all instances of the class. For example, a class variable can be used to store the number of instances of a class that have been created.

```python
class MyClass:
    class_variable = 0

    def __init__(self):
        MyClass.class_variable += 1

    def print_class_variable(self):
        print(MyClass.class_variable)


obj1 = MyClass()
obj2 = MyClass()

obj1.print_class_variable() # Output: 2
obj2.print_class_variable() # Output: 2
```

In the example above, the `class_variable` is shared among all instances of the class `MyClass`. When we create new instances of `MyClass`, the value of `class_variable` is incremented. When we call the `print_class_variable` method on `obj1` and `obj2`, we get the same value of `class_variable`.

## Instance Variables

Instance variables are defined at the instance level and are unique to each instance of the class. They are defined inside the **init** method and are usually used to store information that is specific to each instance of the class. For example, an instance variable can be used to store the name of an employee in a class that represents an employee.

```python
class MyClass:
    def __init__(self, name):
        self.name = name

    def print_name(self):
        print(self.name)

obj1 = MyClass("John")
obj2 = MyClass("Jane")

obj1.print_name() # Output: John
obj2.print_name() # Output: Jane
```

In the example above, each instance of the class `MyClass` has its own value for the name variable. When we call the `print_name` method on `obj1` and `obj2`, we get different values for the name.

## Summary

In summary, class variables are shared among all instances of a class and are used to store information that is common to all instances. Instance variables are unique to each instance of a class and are used to store information that is specific to each instance. Understanding the difference between class variables and instance variables is crucial for writing efficient and maintainable code in Python.

It's also worth noting that, in python, class variables are defined outside of any methods and don't need to be explicitly declared as class variables. They are defined at the class level and can be accessed via `class_name.varibale_name` or `self.class.variable_name`. But instance variables are defined inside the methods and need to be explicitly declared as instance variables by using `self.variable_name`.

## Conclusion

Well, that's a wrap for now!! Hope you folks have enriched yourself today with lots of known or unknown concepts. I wish you a great day ahead and till then keep learning and keep exploring!!

![](https://images.unsplash.com/photo-1487712010531-65e9aa8b4b1a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80 align="center")
