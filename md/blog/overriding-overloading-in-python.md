---
cover: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop"
title: "Overriding & Overloading in Python"
date: "Tue, 21 Feb 2023 11:34:18 GMT"
description: "Method Overriding\nMethod overriding is a powerful feature in object-oriented programming that allows you to redefine a method in a derived class. The method in the derived class is said to override the method in the base class. When you create an ins..."
link: "https://swapnoneel.hashnode.dev/overriding-overloading-in-python"
---

# Method Overriding

Method overriding is a powerful feature in object-oriented programming that allows you to redefine a method in a derived class. The method in the derived class is said to override the method in the base class. When you create an instance of the derived class and call the overridden method, the version of the method in the derived class is executed, rather than the version in the base class.

## How can we do Method Overriding?

In Python, method overriding is a way to customize the behavior of a class based on its specific needs. For example, consider the following base class:

```python
class Shape:
    def area(self):
        pass
```

In this base class, the area method is defined but does not have any implementation. If you want to create a derived class that represents a circle, you can override the area method and provide an implementation that calculates the area of a circle:

```python
class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return 3.14 * self.radius * self.radius
```

In this example, the Circle class inherits from the Shape class and overrides the area method. The new implementation of the area method calculates the area of a circle, based on its radius.

It's important to note that when you override a method, the new implementation must have the same method signature as the original method. This means that the number and type of arguments, as well as the return type, must be the same.

Another way to customize the behavior of a class is to call the base class method from the derived class method. To do this, you can use the super function. The super function allows you to call the base class method from the derived class method and can be useful when you want to extend the behavior of the base class method, rather than replace it.

For example, consider the following base class:

```python
class Shape:
    def area(self):
        print("Calculating area...")
```

In this base class, the area method prints a message indicating that the area is being calculated. If you want to create a derived class that represents a circle, and you also want to print a message indicating the type of shape, you can use the super function to call the base class method, and add your own message:

```python
class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        print("Calculating area of a circle...")
        super().area()
        return 3.14 * self.radius * self.radius
```

In this example, the Circle class overrides the area method and calls the base class method using the super function. This allows you to extend the behavior of the base class method, while still maintaining its original behavior.

In conclusion, method overriding is a powerful feature in Python that allows you to customize the behavior of a class based on its specific needs. By using method overriding, you can create more robust and reliable code, and ensure that your classes behave in the way that you need them to. Additionally, by using the super function, you can extend the behavior of a base class method, rather than replace it, giving you even greater flexibility and control over the behavior of your classes.

# Operator Overloading

Operator Overloading is a feature in Python that allows developers to redefine the behavior of mathematical and comparison operators for custom data types. This means that you can use the standard mathematical operators (+, -, \*, /, etc.) and comparison operators (&gt;, &lt;, ==, etc.) in your own classes, just as you would for built-in data types like `int`, `float`, and `str`.

## Why do we need operator overloading?

Operator overloading allows you to create more readable and intuitive code. For instance, consider a custom class that represents a point in 2D space. You could define a method called 'add' to add two points together, but using the + operator makes the code more concise and readable:

```python
p1 = Point(1, 2)
p2 = Point(3, 4)
p3 = p1 + p2
print(p3.x, p3.y) # prints 4, 6
```

## How to overload an operator in Python?

You can overload an operator in Python by defining special methods in your class. These methods are identified by their names, which start and end with double underscores `__`. Here are some of the most commonly overloaded operators and their corresponding special methods:

```python
+ : __add__
- : __sub__
* : __mul__
/ : __truediv__
< : __lt__
> : __gt__
== : __eq__
```

For example, if you want to overload the + operator to add two instances of a custom class, you would define the **add** method:

```python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __add__(self, other):
        return Point(self.x + other.x, self.y + other.y)
```

It's important to note that operator overloading is not limited to the built-in operators, you can overload any user-defined operator as well.

In conclusion, Operator overloading is a powerful feature in Python that allows you to create more readable and intuitive code. By redefining the behavior of mathematical and comparison operators for custom data types, you can write code that is both concise and expressive. However, it's important to use operator overloading wisely, as overloading the wrong operator or using it inappropriately can lead to confusing or unexpected behavior.

# Conclusion

Well, that's a wrap for now!! Hope you folks have enriched yourself today with lots of known or unknown concepts. I wish you a great day ahead and till then keep learning and keep exploring!!

![](https://www.incimages.com/uploaded_files/image/1920x1080/getty_469566889_105923.jpg align="center")
