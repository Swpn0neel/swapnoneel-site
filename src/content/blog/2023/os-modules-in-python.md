---
cover: ../../../assets/blog-img/2023/os-modules-in-python/63b57168-8c4b-4acc-9266-b8345e942e2e-fde6c115.webp
title: "OS Modules in Python with Examples"
date: "2023-02-12T13:58:39.078Z"
description: >-
  The Python os module connects your code to the operating system. Read and write files, inspect folders, create directories, and run shell commands with care.
link: "https://swapnoneel.hashnode.dev/os-modules-in-python"
tags:
  - python
  - os-module
  - automation
  - programming
updated: "2026-08-09T08:00:04.817Z"
---

Python usually lets you forget that a program is running on top of an operating system. You call `open()`, read a string, and carry on. The `os` module is where that boundary becomes visible: folders have names, files have descriptors, processes have exit codes, and each operating system has its own path rules.

You do not need to memorize the whole module. Think in three buckets. Are you working with a path, with a file at a lower level, or with a command that another process should run? The answer points you toward a different part of `os`.

## Opening files at the lower level

Most Python code should use the built-in `open()` function because it gives you a convenient file object and closes it neatly with `with`. `os.open()` is lower level. It returns an integer file descriptor, and you are responsible for reading bytes and closing that descriptor.

This complete example creates a small file, reads it back, and removes it at the end. Run it in a scratch directory if you want to watch the file appear:

```python
import os

path = "os-module-demo.txt"

try:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
    try:
        os.write(fd, b"Hello from a file descriptor!")
    finally:
        os.close(fd)

    fd = os.open(path, os.O_RDONLY)
    try:
        contents = os.read(fd, 1024)
        print(contents.decode("utf-8"))
    finally:
        os.close(fd)
finally:
    if os.path.exists(path):
        os.remove(path)
```

The printed text is `Hello from a file descriptor!`. The flags explain the first open call: `O_WRONLY` requests writing, `O_CREAT` creates the file if it is missing, and `O_TRUNC` clears old contents. The numeric mode controls permissions on systems that use them. The `try` and `finally` blocks matter because leaving a descriptor open can exhaust the process's file handles.

For normal text files, this is more work than you need. Use `os.open()` when an API requires a descriptor or when you genuinely need low-level flags. The built-in file object is the better default.

```python
import os

# The high-level version closes the file for you
with open("message.txt", "w", encoding="utf-8") as file:
    file.write("Hello, world!")
```

## Inspecting paths and folders

`os.listdir()` returns the names inside a directory as strings. The result is not sorted, so sort it when the order is part of what a person will read:

```python
import os

files = sorted(os.listdir("."))
print(files)
```

`os.mkdir()` creates one directory and raises an error if the directory already exists. `os.makedirs()` is more useful when the path may contain missing parents:

```python
import os

os.makedirs("reports/2023", exist_ok=True)
```

The `exist_ok=True` argument makes a second run harmless. For paths that combine several parts, use `os.path.join()` instead of typing `/` or `\\` yourself:

```python
import os

config_path = os.path.join("config", "settings.json")
print(config_path)
```

The printed separator depends on the operating system. That is why joining path parts is safer than assembling one string by hand. You can also inspect a value without guessing what it means:

```python
import os

print(os.path.abspath("reports"))
print(os.path.exists("reports"))
```

The first line gives the full path, while the second prints `True` if the directory exists. These checks still have a race condition if another process changes the filesystem immediately afterward, so handle the actual operation's exception as well when the code matters.

## Asking the shell to do something

`os.system()` sends a string to the system shell and returns an exit status. It does not give your Python code the command's printed text:

```python
import os

status = os.system("echo Hello from the shell")
print(f"exit status: {status}")
```

The shell prints `Hello from the shell`, then Python prints a status. A zero status generally means the command completed successfully, but the exact value can be represented differently across platforms.

`os.popen()` gives you a file-like object for command output:

```python
import os

with os.popen("echo Hello from the shell") as output_file:
    output = output_file.read()

print(output.strip())
```

Do not build a shell command by joining untrusted user input into a string. Shell metacharacters can change what actually runs. For new code that needs arguments, error handling, or separate output streams, use `subprocess.run()` with a list of arguments instead. The `os` shortcuts are useful for learning the boundary, but they are easy to outgrow.

## The practical rule

Start with Python's high-level file and path tools. Reach for `os.path`, `os.listdir()`, or `os.makedirs()` when you need to inspect the machine. Use `os.open()` and shell calls only when their lower-level behavior is the reason you are writing the code. That boundary keeps the module useful without turning every file operation into a permissions and cleanup puzzle.

![Thank you placard concept illustration](../../../assets/blog-img/2023/object-introspection-in-python/thank-you-placard-concept-illustration-114360-13-6bc006f6.webp)
