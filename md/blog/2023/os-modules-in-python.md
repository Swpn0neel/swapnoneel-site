---
cover: >-
  https://cdn.hashnode.com/res/hashnode/image/upload/v1676210306432/63b57168-8c4b-4acc-9266-b8345e942e2e.png?w=1200&auto=compress,format&format=webp&fm=png
title: OS Modules in Python
date: '2023-02-12T13:58:39.078Z'
description: >-
  Introduction

  The os module in Python is a built-in library that provides functions for
  interacting with the operating system. It allows you to perform a wide variety
  of tasks, such as reading and writing files, interacting with the file system,
  and r...
link: 'https://swapnoneel.hashnode.dev/os-modules-in-python'
tags:
  - python
  - os-module
  - automation
  - programming
updated: '2026-07-23T13:07:48.942Z'
---

## Introduction

The os module in Python is a built-in library that provides functions for interacting with the operating system. It allows you to perform a wide variety of tasks, such as reading and writing files, interacting with the file system, and running system commands.

There are a lot of methods in the os module. But, here we will be discussing only the most important and commonly used methods of the os module.

## Reading and Writing Files

The os module provides functions for opening, reading, and writing files. For example, to open a file for reading, you can use the open function:

```python
import os

# Open the file in read-only mode
f = os.open("myfile.txt", os.O_RDONLY)

# Read the contents of the file
contents = os.read(f, 1024)

# Close the file
os.close(f)
```

To open a file for writing, you can use the `os.O_WRONLY` flag:

```python
import os

# Open the file in write-only mode
f = os.open("myfile.txt", os.O_WRONLY)

# Write to the file
os.write(f, b"Hello, world!")

# Close the file
os.close(f)
```

## Interacting with the File System

The os module also provides functions for interacting with the file system. For example, you can use the `os.listdir` function to get a list of the files in a directory:

```python
import os

# Get a list of the files in the current directory
files = os.listdir(".")
print(files)  # Output: ['myfile.txt', 'otherfile.txt']
```

You can also use the `os.mkdir` function to create a new directory:

```python
import os

# Create a new directory
os.mkdir("newdir")
```

## Running System Commands

Finally, the os module provides functions for running system commands. For example, you can use the `os.system` function to run a command and get the output:

```python
import os

# Run the "ls" command and print the output
output = os.system("ls")
print(output)  # Output: ['myfile.txt', 'otherfile.txt']
```

You can also use the `os.popen` function to run a command and get the output as a file-like object:

```python
import os

# Run the "ls" command and get the output as a file-like object
f = os.popen("ls")

# Read the contents of the output
output = f.read()
print(output)  # Output: ['myfile.txt', 'otherfile.txt']

# Close the file-like object
f.close()
```

## Conclusion

In summary, the os module in Python is a built-in library that provides a wide variety of functions for interacting with the operating system. It allows you to perform tasks such as reading and writing files, interacting with the file system, and running system commands. The above-discussed methods are the most commonly used and are very important to remember.

Well, that's a wrap for now!! Hope you folks have enriched yourself today with lots of known or unknown concepts. I wish you a great day ahead and till then keep learning and keep exploring!!

![Thank you placard concept illustration](https://img.freepik.com/free-vector/thank-you-placard-concept-illustration_114360-13436.jpg?w=1380&t=st=1675784022~exp=1675784622~hmac=b4748b9ac8dd94ff98a8232e0a56aa06102f42d9595f55a3b7cdc17121e72ea8)
