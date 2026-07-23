---
title: Installing Node.js and managing it's versions were this easy?
date: '2024-05-24T14:42:50.142Z'
description: >-
  Introduction

  We all know that, Node.js is the runtime environment for JavaScript that
  executes JavaScript code outside the web browser. And, npm stands for Node
  Package Manager and is the default package manager for Node.js and is also a
  platform for...
cover: >-
  https://web.archive.org/web/20240526000304/https://cdn.hashnode.com/res/hashnode/image/upload/v1716561929669/7be53812-2eb8-4dd7-84a4-3a0f8546086f.png
link: 'https://swapnoneel.hashnode.dev/nodejs-npm-nvm'
tags:
  - nodejs
  - npm
  - nvm
  - javascript
updated: '2026-07-23T13:07:48.942Z'
---

## Introduction

We all know that, **Node.js** is the runtime environment for JavaScript that executes JavaScript code outside the web browser. And, **npm** stands for Node Package Manager and is the default package manager for Node.js and is also a platform for managing JavaScript packages. It provides a command-line interface (CLI) for interacting with the npm registry, which hosts thousands of open-source libraries and modules.

## How to install node.js and npm locally?

Based on the operating systems, the installation process is different and varied. That's why, I'm classifying them here so that you folks don't get confused between them.

![Node.js architecture and runtime overview](https://cdn.hashnode.com/res/hashnode/image/upload/v1716554172337/62142e92-545a-4b6b-9b5e-b018bcf9d0e8.png)

### Windows

1. **Download the Installer**:
   - Go to the official Node.js website: [nodejs.org](https://nodejs.org/).
   - Download the LTS (Long Term Support) version, because it happens to be the most stable version.

2. **Run the Installer**:
   - Open the downloaded `.msi` file and run the installer.
   - Follow the installation steps, and please **make sure to check the box that says "Install Node.js and npm."**

### _macOS_

1. You have to install **Homebrew** if you haven't already. To do that, open the terminal and run:

   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Now, we can install `node.js` and `npm` with Homebrew:

   ```bash
   brew install node
   ```

### _Linux_

It's extremely easy to install `node.js` and `npm` in Linux. Just run these two commands in the terminal:

```bash
sudo apt update
sudo apt install nodejs npm
```

## Verify your installation

You can verify the installation of `node.js` and `npm` by running the following two commands in your terminal:

```bash
node -v
npm -v
```

> _If you are on Windows, Powershell may cause some issues, so try to use Command Prompt in that case. It will work!!_

![Terminal verification of node and npm versions](https://cdn.hashnode.com/res/hashnode/image/upload/v1716553688790/eaf89f25-9858-410e-9ebc-082022a6697e.png)

## Managing node versions using NVM

NVM stands for Node Version Manager and it's a command-line tool that helps us to manage and switch different versions of Node.js with ease and convenience!!

![NVM Node Version Manager overview banner](https://cdn.hashnode.com/res/hashnode/image/upload/v1716554276508/db2ae459-9cd3-41fe-837f-29c2ea3d8671.png)

1. ### Check available node versions

Before installing any node version, let's first check the available Node versions. To do that, we can simply run the following command in our terminal:

```bash
nvm ls available
```

After running this, you get something like this:

![Terminal output of nvm ls available command](https://cdn.hashnode.com/res/hashnode/image/upload/v1716555882030/1d1e966c-c139-4c92-a68e-a64cbde6b661.png)

2. ### Installing the latest node version

To install the latest version of node.js, you can simply run this command,

```bash
nvm install latest
```

But remember, it's always better to install the LTS (long-term support) version of node, because it's less buggy and is overall more stable!!

To install the LTS version of Node, run the command,-

```bash
nvm install lts
```

3. ### Install multiple Node versions

One of the most interesting part of NVM is you can install multiple versions of Node at the same time and use any of them based on your convenience!!

For this, nvm has the `nvm install` command. You can install specific versions by running this command followed by the version you want. For example,

```bash
nvm install 18.17.0
nvm install 20.11.1
nvm install 20.12
```

Also, as NVM follows semantic versioning, you can install v18.17 and use any of the following version under 18.17, like 18.17.0, 18.17.1, etc. Here, 18 represents the major version, 17 represents the minor version, and 1 represents the patch version!!

4. ### Installing specific Node versions

You can install any specific node version, by running this command,-

```bash
nvm install <node_version_number>
```

Replace the `<node_version_number>` with your desired Node version.

But, to ensure that your given version is valid, make sure to run `nvm ls available` and put a correct version from the list!!

Also, once you install a version of Node, the corresponding version of NPM is also installed alongside with it. So you don’t need to install NPM separately!!

5. ### Check installed Node versions in your system

To check the list of all node versions that you have installed on your system, you can simply run,-

```bash
nvm list
```

And, you will see a response like this:

![Terminal output of nvm list showing installed Node versions](https://cdn.hashnode.com/res/hashnode/image/upload/v1716560504142/21e3f56e-e0d9-415f-96e9-816e2ccb40da.png)

6. ### Switching Node versions

As you can see in the previous image that I'm currently using `20.13.1`. Now, if I want to switch my version to another one like `18.17.0`. I can simply use the following command:

```bash
nvm use 18.17.0
```

In your case, you can put your desired version in place of `18.17.0`, but first make sure it is a valid version number and it is installed on your system!!

7. ### Uninstall a Node version

To uninstall an already installed Node version that you no longer think is useful, you can do that by running the command,-

```bash
nvm uninstall <node_version_number>
```

Replace the `<node_version_number>` with your desired and installed Node version.

## Conclusion

> TLDR: This article provides a comprehensive guide on installing Node.js and npm across different operating systems (Windows, macOS, and Linux), verifying installations, and managing Node.js versions using NVM (Node Version Manager). It covers steps to install specific Node.js versions, switch between versions, and uninstall versions when no longer needed. The guide emphasizes the importance of using the LTS (Long Term Support) version for stability and includes detailed commands for each process.

Well, that's a wrap for now!! Hope you folks have enriched yourself today with lots of known or unknown concepts. I wish you a great day ahead and till then keep learning and keep exploring!!

![Thank you graphic for Node.js npm NVM guide](https://cdn.hashnode.com/res/hashnode/image/upload/v1716561409967/1916dd93-56c0-4df1-8be1-19b75342aad1.png)
