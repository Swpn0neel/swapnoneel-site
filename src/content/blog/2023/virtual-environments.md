---
cover: ../../../assets/blog-img/2023/virtual-environments/dcfb12a5-0142-490a-a6c0-dd45f38dc8c5-926ebc16.webp
title: "Virtual Environments in Python Explained"
date: "2023-01-27T16:11:48.129Z"
description: >-
  Python virtual environments keep each project's interpreter and packages separate. Create, activate, deactivate, and record one with requirements.txt.
link: "https://swapnoneel.hashnode.dev/virtual-environments"
tags:
  - python
  - virtualenv
  - dev-environment
  - tooling
updated: "2026-08-09T08:00:04.817Z"
---

Your Python installation is shared by default. That feels convenient until one project needs an older package and another project needs a newer one. Install both globally and you have made the interpreter responsible for an argument it cannot resolve cleanly.

A virtual environment is a project-specific directory containing an interpreter and its installed packages. It lets each project choose its own dependencies without changing every other project on the machine. The environment is not a container and it does not install a second operating system. It is a boundary around Python packages.

That boundary does not make the source code portable by itself. You still need to record the packages and the Python version your project expects. The environment is disposable; the dependency description is the part you keep.

## Creating the environment

Python includes the `venv` module. Run this command from the project directory. It creates a directory named `myenv`:

```bash
python -m venv myenv
```

Activate it with the command for your shell:

```bash
# Linux or macOS
source myenv/bin/activate

# Windows PowerShell
.\myenv\Scripts\Activate.ps1

# Windows Command Prompt
myenv\Scripts\activate.bat
```

After activation, your shell usually shows `(myenv)` in the prompt. More useful than the prompt is checking which interpreter is running:

```bash
python -c "import sys; print(sys.executable)"
```

The printed path should point inside `myenv`. Commands such as `python` and `pip` now use the environment, so an install stays with this project.

I prefer `python -m pip` because it makes the connection between the Python interpreter and its package installer explicit:

```bash
python -m pip install requests
```

If PowerShell blocks the activation script with an execution-policy error, that is a shell policy problem, not a broken Python environment. You can still run the environment's interpreter directly, or adjust the policy according to your machine's rules. Do not copy a policy command from a random post without understanding whether it changes the policy for only your user or for the whole machine.

## Leaving the environment

When you finish working, leave the environment with:

```bash
# Deactivate the virtual environment
deactivate
```

The command only changes the current shell. It does not delete the environment or uninstall its packages. If you close the terminal, the environment directory remains on disk.

## Recording the dependencies

Do not commit the `myenv` directory to your repository. It contains machine-specific paths and can become large. Record the packages your project needs in `requirements.txt` instead:

```bash
python -m pip freeze > requirements.txt
```

On another machine, create and activate a fresh environment, then install those recorded versions:

```bash
python -m pip install -r requirements.txt
```

One honest caveat: `pip freeze` records everything installed in the environment, including packages you may have added while experimenting. For a small project that is often fine. For a long-lived project, review the file before committing it. A clean environment makes that review much easier.

Add the environment directory to `.gitignore` as well:

```text
myenv/
.venv/
venv/
```

The exact directory name is your choice. `.venv` is common too; consistency matters more than the name.

For a small tutorial, `requirements.txt` is enough. A package or a larger application may eventually use `pyproject.toml` to describe dependencies and build settings. The file format can change, but the workflow does not: a new machine should be able to create a clean environment from a short, reviewable declaration.

If the environment gets confused, recreate it instead of trying to repair every installed package by hand. First update the dependency file, remove the disposable environment directory, and run `python -m venv` again. The source code is outside that directory, so rebuilding it is normally the safer fix.

## The routine that keeps it useful

Create the environment once, activate it whenever you work on the project, install packages through `python -m pip`, and deactivate it when you are done. When a teammate checks out the project, they can recreate the environment from `requirements.txt` instead of receiving a copy of yours.

The routine is not glamorous, and it does not solve every deployment problem. It does solve the common mistake of installing a package into one interpreter and running the program with another. For Python projects, that is enough reason to make virtual environments your default.

![Thank you banner image](../../../assets/blog-img/2023/overriding-overloading-in-python/getty-469566889-105923-12ce25f4.webp)
