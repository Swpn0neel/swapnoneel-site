---
cover: "https://cdn.hashnode.com/res/hashnode/image/upload/v1676362325400/bfe1526a-0cc1-40a8-9aa5-a931dcf8c69d.png?w=1200&auto=compress,format&format=webp&fm=png"
title: "Enumerate Function in Python"
date: "2023-02-14T08:12:35.719Z"
description: "Introduction\nThe enumerate function in Python converts a data collection object into an enumerate object. Enumerate returns an object that contains a counter as a key for each value within an object, making items within the collection easier to acces..."
link: "https://swapnoneel.hashnode.dev/enumerate-function-in-python"
---

# Introduction

The enumerate function in Python **converts a data collection object into an enumerate object**. Enumerate returns an object that contains a counter as a key for each value within an object, making items within the collection easier to access.

# Enumerate Function

The enumerate function is a built-in function in Python that allows you to loop over a sequence (such as a list, tuple, or string) and get the index and value of each element in the sequence at the same time. Here's a basic example of how it works:

```python
# Loop over a list and print the index and value of each element
fruits = ['apple', 'banana', 'mango']
for index, fruit in enumerate(fruits):
    print(index, fruit)
```

The output of this code will be:

```python
0 apple
1 banana
2 mango
```

As you can see, the enumerate function returns a tuple containing the index and value of each element in the sequence. You can use the for loop to unpack these tuples and assign them to variables, as shown in the example above.

## Changing the start index

By default, the enumerate function starts the index at 0, but you can specify a different starting index by passing it as an argument to the enumerate function:

```python
# Loop over a list and print the index (starting at 1) and value of each element
fruits = ['apple', 'banana', 'mango']
for index, fruit in enumerate(fruits, start=1):
    print(index, fruit)
```

The output will be:

```python
1 apple
2 banana
3 mango
```

The enumerate function is often used when you need to loop over a sequence and perform some action with both the index and value of each element. For example, you might use it to loop over a list of strings and print the index and value of each string in a formatted way:

```python
fruits = ['apple', 'banana', 'mango']
for index, fruit in enumerate(fruits):
    print(f'{index+1}: {fruit}')
```

And, the output is,

```python
1: apple
2: banana
3: mango
```

In addition to lists, you can use the enumerate function with any other sequence type in Python, such as tuples and strings. Here's an example with a tuple:

```python
# Loop over a tuple and print the index and value of each element
colors = ('red', 'green', 'blue')
for index, color in enumerate(colors):
    print(index, color)
```

And here's an example with a string:

```python
# Loop over a string and print the index and value of each character
s = 'hello'
for index, c in enumerate(s):
    print(index, c)
```

# Conclusion

Well, that's a wrap for now!! Hope you folks have enriched yourself today with lots of known or unknown concepts. I wish you a great day ahead and till then keep learning and keep exploring!!

![](https://img.freepik.com/free-vector/handwritten-style-thank-you-typography_53876-43732.jpg?w=1380&t=st=1676362202~exp=1676362802~hmac=b258d692e9dd15ac0383a1e618b301eb654bb0aa68d3529c487992087a2162cc align="center")
