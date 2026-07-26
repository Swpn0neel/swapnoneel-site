---
cover: >-
  https://cdn.hashnode.com/res/hashnode/image/upload/v1674921636996/6039154e-d731-486b-8d15-888cb8bba647.png?w=1200&h=630&fit=crop&crop=entropy&auto=compress,format&format=webp&fm=png
title: Docstrings in python
date: "2023-01-25T14:42:32.056Z"
description: >-
  Introduction

  Python docstrings are the string literals that appear right after the
  definition of a function, method, class, or module.

  Example

  def square(n):
      '''Takes in a number n, returns the square of n'''
      print(n**2)
  square(5)


  Here,

  '''T...
link: "https://swapnoneel.hashnode.dev/docstrings-in-python"
tags:
  - python
  - documentation
  - clean-code
  - programming
updated: "2026-07-23T13:07:48.942Z"
---

## Introduction

Python docstrings are the string literals that appear right after the definition of a function, method, class, or module.

### Example

```python
def square(n):
    '''Takes in a number n, returns the square of n'''
    print(n**2)
square(5)
```

Here,

'''Takes in a number n, returns the square of n''' is a docstring which will not appear in output

### Output

```python
def add(num1, num2):
    """
    Add up two integer numbers.

    This function simply wraps the ``+`` operator, and does not
    do anything interesting, except for illustrating what
    the docstring of a very simple function looks like.

    Parameters
    ----------
    num1 : int
        First number to add.
    num2 : int
        Second number to add.

    Returns
    -------
    int
        The sum of ``num1`` and ``num2``.

    See Also
    --------
    subtract : Subtract one integer from another.

    Examples
    --------
    >>> add(2, 2)
    4
    >>> add(25, 0)
    25
    >>> add(10, -10)
    0
    """
    return num1 + num2
```

## Python Comments vs Docstrings

### Python Comments

Comments are descriptions that help programmers better understand the intent and functionality of the program. They are completely ignored by the Python interpreter.

### Python docstrings

As mentioned above, Python docstrings are strings used right after the definition of a function, method, class, or module (like in Example 1). They are used to document our code.

We can access these docstrings using the **doc** attribute.

## Python **doc** attribute

Whenever string literals are present just after the definition of a function, module, class or method, they are associated with the object as their **doc** attribute. We can later use this attribute to retrieve this docstring.

### Example

```python
def square(n):
    '''Takes in a number n, returns the square of n'''
    return n**2

print(square.__doc__)
```

### Output

Takes in a number n, returns the square of n

## Conclusion

Thanks for reading this blog!! Hope you have learnt something new today and I wish you a great day ahead ❤

![Thank you card in blue tones](https://img.freepik.com/free-vector/thank-you-card-blue-tones_23-2148665027.jpg?w=1380&t=st=1674657663~exp=1674658263~hmac=4b0703b3e652f76dd18a3a9e99932842361293d22d9096d3abafe7d2f2280837)
