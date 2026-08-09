---
cover: ../../../assets/blog-img/2023/string-formatting-in-python/d3ced512-3d06-4b0a-8b25-c81b0e8e626b-c887163b.webp
title: "String Formatting in Python with Examples"
date: "2023-01-25T07:50:52.768Z"
description: >-
  Python string formatting turns values into readable text. Compare str.format() and f-strings, then use format specifications for prices, percentages, and separators.
link: "https://swapnoneel.hashnode.dev/string-formatting-in-python"
tags:
  - python
  - strings
  - f-strings
  - programming
updated: "2026-08-09T08:00:04.817Z"
---

Printing a value is easy. Printing it in the exact shape a person expects takes a little more thought. A price may need two decimal places, a percentage may need a percent sign, and a report line may need every column to line up.

String formatting separates the message from the rule for displaying each value. Python gives you a few styles, but `str.format()` and f-strings cover most code you will write today.

## Using str.format()

The `str.format()` method replaces placeholders inside a string. A format specification after the colon controls the output:

```python
txt = "For only {price:.2f} dollars!"
print(txt.format(price = 49))
```

Here `price` is inserted with two digits after the decimal point, so the output is `For only 49.00 dollars!`. The original number remains an integer; only its text representation changes.

The braces can contain a position or a name. Positional placeholders start at zero:

```python
message = "{} scored {} points."
print(message.format("Maya", 42))
```

Named placeholders make a template easier to read when it has several values:

```python
message = "{name} has {count} messages."
print(message.format(name="Maya", count=42))
```

The values do not need to be strings. Python converts them while building the final text, and the format specification tells it how to display a value. Named fields are especially useful when the same template is stored in one place and values arrive later.

You can also align text and numbers:

```python
rows = [("Tea", 3), ("Coffee", 12)]
for name, count in rows:
    print("{:<10} {:>3}".format(name, count))
```

The output is:

```text
Tea          3
Coffee      12
```

`<` aligns to the left and `>` aligns to the right. The `10` and `3` are field widths, not limits on the values. A long string can still spill past its field.

## Writing f-strings

An f-string puts the letter `f` before the opening quote. Expressions inside `{}` are evaluated when Python creates the string:

```python
name = "Tushar"
age = 23
print(f"Hello, my name is {name} and I am {age} years old.")
```

The output is:

```text
Hello, my name is Tushar and I am 23 years old.
```

You can put an expression inside the braces, not just a variable:

```python
items = 4
price = 12.5
print(f"Total: {items * price:.2f}")
```

This prints:

```text
Total: 50.00
```

The part after the colon is a format specification. `.2f` asks for a floating-point value with two digits after the decimal point. Python evaluates `items * price` first, then applies `.2f` to the result.

The same syntax handles percentages, alignment, and thousands separators:

```python
completion = 0.875
total = 1250000
print(f"Completion: {completion:.1%}")
print(f"Total: {total:,}")
```

This prints `Completion: 87.5%` and `Total: 1,250,000`. The stored values are still `0.875` and `1250000`; formatting changes what the reader sees.

If you need a literal brace, double it:

```python
name = "Maya"
print(f"{{user}}: {name}")
```

The output is `{user}: Maya`. A single unmatched brace causes a `SyntaxError`, which is an annoying failure when a message is assembled from several pieces, so keep complicated templates readable.

## Which style should you use

F-strings are usually easier to read when the values are already in scope. `str.format()` is still useful when the template is stored separately or when you want to pass named values explicitly.

Older code may use percent formatting, such as `"Hello, %s" % name`. It still works, but several values and format rules become harder to read. When you control the Python version, reach for an f-string first, then use `str.format()` when the template and values need to stay separate.

There is a safety boundary here. An f-string evaluates its Python expressions immediately, and formatting does not validate a value or escape it for HTML, SQL, or a shell command. Use the output library's escaping or parameter handling for those contexts. A nicely formatted string can still be unsafe input.

My default is f-strings for local variables and calculations, `str.format()` for reusable templates, and neither one as a substitute for validation. Once you know whether you are changing the value or only changing its display, the syntax becomes much less mysterious.

![Thank you graphic for Python string formatting blog](../../../assets/blog-img/2023/sets-in-python/pexels-photo-2072165-8442d23b.webp)
