---
cover: "https://cdn.hashnode.com/res/hashnode/image/upload/v1678204146942/71c0a906-e83b-429b-bc73-5f4edef049ee.png?w=1200&auto=compress,format&format=webp&fm=png"
title: "Inheritance in Python"
date: "Tue, 07 Mar 2023 15:49:19 GMT"
description: "Introduction\nInheritance is a key concept in object-oriented programming that allows classes to inherit attributes and methods from other classes. In Python, inheritance is a powerful tool that can help you write more efficient and maintainable code ..."
link: "https://swapnoneel.hashnode.dev/inheritance-in-python"
---

## Introduction

Inheritance is a key concept in object-oriented programming that allows classes to inherit attributes and methods from other classes. In Python, inheritance is a powerful tool that can help you write more efficient and maintainable code by reusing existing code and building upon it. Python offers several types of inheritance, including single inheritance, multiple inheritance, multilevel inheritance, hierarchical inheritance, and hybrid inheritance. Each type of inheritance has its own syntax and use cases, and understanding them is crucial for building complex and scalable programs in Python. In this article, we will explore the different types of inheritance in Python and provide examples to help you understand how to use them in your own code.

## Definition

When a class derives from another class. The child class will inherit all the public and protected properties and methods from the parent class. In addition, it can have its own properties and methods, this is called inheritance.

### General Syntax for Inheritance

```python
class BaseClass:
  Body of base class
class DerivedClass(BaseClass):
  Body of derived class
```

The derived class inherits features from the base class where new features can be added to it. This results in the re-usability of code.

## Types of Inheritance

1. Single Inheritance
    
2. Multiple Inheritance
    
3. Multilevel Inheritance
    
4. Hierarchical Inheritance
    
5. Hybrid Inheritance
    

## Single Inheritance

Single inheritance is a type of inheritance where a class inherits properties and behaviors from a single-parent class. This is the simplest and most common form of inheritance.

Single inheritance is a powerful tool in Python that allows you to create new classes based on existing classes. It allows you to reuse code, extend it to fit your needs and make it easier to manage complex systems. Understanding single inheritance is an important step in becoming proficient in object-oriented programming in Python.

![](https://media.geeksforgeeks.org/wp-content/uploads/20200108135809/inheritance11.png align="center")

### Syntax

The syntax for single inheritance in Python is straightforward and easy to understand. To create a new class that inherits from a parent class, simply specify the parent class in the class definition, inside the parentheses, like this:

```python
class ChildClass(ParentClass):
    # class body
```

### Example

Let's consider a simple example of single inheritance in Python. Consider a class named "Animal" that contains the attributes and behaviors that are common to all animals.

```python
class Animal:
    def __init__(self, name, species):
        self.name = name
        self.species = species
        
    def make_sound(self):
        print("Sound made by the animal")
```

If we want to create a new class for a specific type of animal, such as a dog, we can create a new class named "Dog" that inherits from the Animal class.

```python
class Dog(Animal):
    def __init__(self, name, breed):
        Animal.__init__(self, name, species="Dog")
        self.breed = breed
        
    def make_sound(self):
        print("Bark!")
```

The Dog class inherits all the attributes and behaviors of the Animal class, including the `__init__` method and the `make_sound` method. Additionally, the Dog class has its own `__init__` method that adds a new attribute for the breed of the dog, and it also overrides the `make_sound` method to specify the sound that a dog makes.

## Multiple Inheritance

Multiple inheritance is a powerful feature in object-oriented programming that allows a class to inherit attributes and methods from multiple parent classes. This can be useful in situations where a class needs to inherit functionality from multiple sources.

![](https://media.geeksforgeeks.org/wp-content/uploads/20200108144424/multiple-inheritance1.png align="center")

### Syntax

In Python, multiple inheritance is implemented by specifying multiple parent classes in the class definition, separated by commas.

```python
class ChildClass(ParentClass1, ParentClass2, ParentClass3):
    # class body
```

In this example, the `ChildClass` inherits attributes and methods from all three parent classes: `ParentClass1`, `ParentClass2`, and `ParentClass3`.

It's important to note that, in the case of multiple inheritance, Python follows a `method resolution order (MRO)` to resolve conflicts between methods or attributes from different parent classes. The MRO determines the order in which parent classes are searched for attributes and methods.

### Example

```python
class Animal:
    def __init__(self, name, species):
        self.name = name
        self.species = species
        
    def make_sound(self):
        print("Sound made by the animal")
        
class Mammal:
    def __init__(self, name, fur_color):
        self.name = name
        self.fur_color = fur_color
        
class Dog(Animal, Mammal):
    def __init__(self, name, breed, fur_color):
        Animal.__init__(self, name, species="Dog")
        Mammal.__init__(self, name, fur_color)
        self.breed = breed
        
    def make_sound(self):
        print("Bark!")
```

In this example, the `Dog` class inherits from both the `Animal` and `Mammal` classes, so it can use attributes and methods from both parent classes.

## Multilevel Inheritance

Multilevel inheritance is a type of inheritance in object-oriented programming where a derived class inherits from another derived class. This type of inheritance allows you to build a hierarchy of classes where one class builds upon another, leading to a more specialized class.

In Python, multilevel inheritance is achieved by using the class hierarchy. The syntax for multilevel inheritance is quite simple and follows the same syntax as single inheritance.

![](https://media.geeksforgeeks.org/wp-content/uploads/20200108144705/Multilevel-inheritance1.png align="center")

### Syntax

```python
class BaseClass:
    # Base class code
    
class DerivedClass1(BaseClass):
    # Derived class 1 code
    
class DerivedClass2(DerivedClass1):
    # Derived class 2 code
```

In the above example, we have three classes: `BaseClass`, `DerivedClass1`, and `DerivedClass2`. The `DerivedClass1` class inherits from the `BaseClass`, and the `DerivedClass2` class inherits from the `DerivedClass1` class. This creates a hierarchy where `DerivedClass2` has access to all the attributes and methods of both `DerivedClass1` and `BaseClass`.

### Example

Let's take a look at an example to understand how multilevel inheritance works in Python. Consider the following classes:

```python
class Animal:
    def __init__(self, name, species):
        self.name = name
        self.species = species
        
    def show_details(self):
        print(f"Name: {self.name}")
        print(f"Species: {self.species}")
        
class Dog(Animal):
    def __init__(self, name, breed):
        Animal.__init__(self, name, species="Dog")
        self.breed = breed
        
    def show_details(self):
        Animal.show_details(self)
        print(f"Breed: {self.breed}")
        
class GoldenRetriever(Dog):
    def __init__(self, name, color):
        Dog.__init__(self, name, breed="Golden Retriever")
        self.color = color
        
    def show_details(self):
        Dog.show_details(self)
        print(f"Color: {self.color}")
```

In this example, we have three classes: `Animal`, `Dog`, and `GoldenRetriever`. The `Dog` class inherits from the `Animal` class, and the `GoldenRetriever` class inherits from the `Dog` class.

Now, when we create an object of the `GoldenRetriever` class; it has access to all the attributes and methods of the `Animal` class and the `Dog` class. We can also see that the `GoldenRetriever` class has its own attributes and methods that are specific to the class.

```python
dog = GoldenRetriever("Max", "Golden")
dog.show_details()
```

### Output

```python
Name: Max
Species: Dog
Breed: Golden Retriever
Color: Golden
```

As we can see from the output, the `GoldenRetriever` object has access to all the attributes and methods of the `Animal` and `Dog` classes, and, it has also added its own unique attributes and methods. This is a powerful feature of multilevel inheritance, as it allows you to create more complex and intricate classes by building upon existing ones.

Another important aspect of multilevel inheritance is that it allows you to reuse code and avoid repeating the same logic multiple times. This can lead to better maintainability and readability of your code, as you can abstract away complex logic into base classes and build upon them.

In conclusion, multilevel inheritance is a powerful feature in object-oriented programming that allows you to create complex and intricate classes by building upon existing ones. It provides the benefits of code reuse, maintainability, and readability, while also requiring careful consideration to avoid potential problems.

## Hybrid Inheritance

Hybrid inheritance is a combination of multiple inheritance and single inheritance in object-oriented programming. It is a type of inheritance in which multiple inheritance is used to inherit the properties of multiple base classes into a single derived class, and single inheritance is used to inherit the properties of the derived class into a sub-derived class.

In Python, hybrid inheritance can be implemented by creating a class hierarchy, in which a base class is inherited by multiple derived classes, and one of the derived classes is further inherited by a sub-derived class.

![](https://media.geeksforgeeks.org/wp-content/uploads/Hybrid-Inheritance.png align="center")

### Syntax

The syntax for implementing Hybrid Inheritance in Python is the same as for implementing Single Inheritance, Multiple Inheritance, or Hierarchical Inheritance.

Here's the syntax for defining a hybrid inheritance class hierarchy:

```python
class BaseClass1:
  # attributes and methods

class BaseClass2:
  # attributes and methods

class DerivedClass(BaseClass1, BaseClass2):
  # attributes and methods
```

### Example

Consider the example of a `Student` class that inherits from the `Person` class, which in turn inherits from the `Human` class. The `Student` class also has a `Program` class that it is associated with.

```python
class Human:
  def __init__(self, name, age):
    self.name = name
    self.age = age
    
  def show_details(self):
    print("Name:", self.name)
    print("Age:", self.age)
    
class Person(Human):
  def __init__(self, name, age, address):
    Human.__init__(self, name, age)
    self.address = address
    
  def show_details(self):
    Human.show_details(self)
    print("Address:", self.address)
    
class Program:
  def __init__(self, program_name, duration):
    self.program_name = program_name
    self.duration = duration
    
  def show_details(self):
    print("Program Name:", self.program_name)
    print("Duration:", self.duration)
    
class Student(Person):
  def __init__(self, name, age, address, program):
    Person.__init__(self, name, age, address)
    self.program = program
    
  def show_details(self):
    Person.show_details(self)
    self.program.show_details()
```

In this example, the `Student` class inherits from the `Person` class, which in turn inherits from the `Human` class. The `Student` class also has an association with the `Program` class. This is an example of Hybrid Inheritance in action, as it uses both Single Inheritance and Association to achieve the desired inheritance structure.

To create a `Student` object, we can do the following:

```python
program = Program("Computer Science", 4)
student = Student("John Doe", 25, "123 Main St.", program)
student.show_details()
```

### Output

```python
Name: John Doe
Age: 25
Address: 123 Main St.
Program Name: Computer Science
Duration: 4
```

As we can see from the output, the `Student` object has access to all the attributes and methods of the `Person` and `Human` classes, as well as the `Program` class through association.

In this way, hybrid inheritance allows for a flexible and powerful way to inherit attributes and behaviors from multiple classes in a hierarchy or chain.

## Hierarchical Inheritance

Hierarchical Inheritance is a type of inheritance in Object-Oriented Programming where multiple subclasses inherit from a single base class. In other words, a single base class acts as a parent class for multiple subclasses. This is a way of establishing relationships between classes in a hierarchical manner.

![](https://media.geeksforgeeks.org/wp-content/uploads/20200108144949/Hierarchical-inheritance1.png align="center")

Here's an example to illustrate the concept of hierarchical inheritance in Python:

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def show_details(self):
        print("Name:", self.name)

class Dog(Animal):
    def __init__(self, name, breed):
        Animal.__init__(self, name)
        self.breed = breed

    def show_details(self):
        Animal.show_details(self)
        print("Species: Dog")
        print("Breed:", self.breed)

class Cat(Animal):
    def __init__(self, name, color):
        Animal.__init__(self, name)
        self.color = color

    def show_details(self):
        Animal.show_details(self)
        print("Species: Cat")
        print("Color:", self.color)
```

In the above code, the `Animal` class acts as the base class for two subclasses, `Dog` and `Cat`. The `Dog` class and the `Cat` class inherits the attributes and methods of the `Animal` class. However, they can also add their own unique attributes and methods.

Here's an example of creating objects of the `Dog` and `Cat` classes and accessing their attributes and methods:

```python
dog = Dog("Max", "Golden Retriever")
dog.show_details()
cat = Cat("Luna", "Black")
cat.show_details()
```

### Output

```python
Name: Max
Species: Dog
Breed: Golden Retriever
Name: Luna
Species: Cat
Color: Black
```

As we can see from the outputs, the `Dog` and `Cat` classes have inherited the attributes and methods of the `Animal` class, and have also added their own unique attributes and methods.

In conclusion, hierarchical inheritance is a way of establishing relationships between classes in a hierarchical manner. It allows multiple subclasses to inherit from a single base class, which helps in code reuse and organization of code in a more structured manner.

## Conclusion

Inheritance is a fundamental concept in object-oriented programming that allows you to create new classes based on existing classes. Python offers a variety of inheritance types, including single inheritance, multiple inheritance, multilevel inheritance, hierarchical inheritance, and hybrid inheritance. Each type of inheritance has its own syntax and use cases. Understanding inheritance is crucial for building complex and scalable programs in Python. By leveraging inheritance, you can reuse code, extend it to fit your needs, and make it easier to manage complex systems. Overall, inheritance is a powerful tool that can help you write more efficient and maintainable code in Python.

Well, that's a wrap for now!! Hope you folks have enriched yourself today with lots of known or unknown concepts. I wish you a great day ahead and till then keep learning and keep exploring!!

![](https://static.vecteezy.com/system/resources/previews/017/125/080/large_2x/thank-you-design-lettering-free-vector.jpg align="center")
