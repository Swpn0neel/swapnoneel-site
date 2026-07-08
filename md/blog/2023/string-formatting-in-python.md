---
cover: "https://cdn.hashnode.com/res/hashnode/image/upload/v1674633040452/4d7032cc-d320-44c8-9bb1-3db7076b1e9a.png?w=1200&auto=compress,format&format=webp&fm=png"
title: "String formatting in python"
date: "2023-01-25T07:50:52.768Z"
description: "Introduction\nString formatting can be done in python using the format method.\ntxt = \"For only {price:.2f} dollars!\"\nprint(txt.format(price = 49))\n\nf-strings in python\nIt is a new string formatting mechanism introduced by the PEP 498. It is also known..."
link: "https://swapnoneel.hashnode.dev/string-formatting-in-python"
---

### Introduction

String formatting can be done in python using the format method.

```python
txt = "For only {price:.2f} dollars!"
print(txt.format(price = 49))
```

## f-strings in python

It is a new string formatting mechanism introduced by the PEP 498. It is also known as Literal String Interpolation or more commonly as F-strings (f character preceding the string literal). The primary focus of this mechanism is to make the interpolation easier.

When we prefix the string with the letter 'f', the string becomes the f-string itself. The f-string can be formatted in much same as the str.format() method. The f-string offers a convenient way to embed Python expression inside string literals for formatting.

### Example

```python
val = 'Geeks'
print(f"{val}for{val} is a portal for {val}.")
name = 'Tushar'
age = 23
print(f"Hello, My name is {name} and I'm {age} years old.")
```

### Output:

```python
Hello, My name is Tushar and I'm 23 years old.
```

In the above code, we have used the f-string to format the string. It evaluates at runtime; we can put all valid Python expressions in them.

We can use it in a single statement as well.

### Example

```python
print(f"{2 * 30})"
```

### Output:

```python
60
```

## Conclusion:

Thanks for reading this blog, hope you have understood something new today.

![](https://images.pexels.com/photos/4439457/pexels-photo-4439457.jpeg align="center")
