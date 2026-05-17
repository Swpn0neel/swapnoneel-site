---
cover: "https://images.unsplash.com/photo-1618401471353-b98aedd07871?q=80&w=1200&auto=format&fit=crop"
title: "Understanding Semantic Versioning"
date: "Sat, 01 Jun 2024 19:35:38 GMT"
description: "Learn the basics of Semantic Versioning and how it helps developers manage software changes effectively..."
link: "https://swapnoneel.hashnode.dev/understanding-semantic-versioning"
---

Often enough, we see version numbers like 1.0.2, 2.5.6 or something similar, associated with a software product. But, you may think what do these numbers actually represent, and why do we use them? We could've simply used numbers like 1, 2, 3, etc. for naming each versions!

But, let me tell you, we use them because we’re following a best practice called Semantic Versioning. When we use Semantic Versioning, developers can easily predict whether a change will break their code or not. And also, the numbers give a clue to the kind of changes that have occurred.

Now, let's dive deep, and understand each and everything about semantic versioning!

## What is Semantic Versioning?

Semantic Versioning, sometimes abbreviated to SemVer, is a software versioning scheme using a three-part number format MAJOR.MINOR.PATCH, and this versioning scheme helps developers and users understand the nature of changes in the software.

![Semantic Versioning Structure](https://cdn.hashnode.com/res/hashnode/image/upload/v1717267689583/94e58a9e-c8c5-4fbc-9a80-29081327b784.png)

For the 2.6.8 version, for example:
- 2 is its MAJOR version.
- 6 is the MINOR version.
- 8 is the PATCH version.

Now, let's break down these 3 components and try to understand them individually:

### Patch Version

Patch versions are generally used for bugfixes, and there are no functionality changes. You have heard about the term "hotfix", it's the patch version update that fixes any breaking changes!

![Patch Version](https://cdn.hashnode.com/res/hashnode/image/upload/v1717267567041/f64b3f07-0d5d-4c47-90d6-a5af7e6f262a.png)

When you increase a new patch, you increase the rightmost number by 1. From 1, you increase it to 2, then to 3, and so on and to keep in mind, there are no limits to these numbers, so once you reach 9, you continue from 10, 11, 12 and so on.

### Minor Version

The second number in the middle is called the minor version number. It is used when you release new functionality in your project. It could be a completely new feature or some added functionality to an already existing feature.

![Minor Version](https://cdn.hashnode.com/res/hashnode/image/upload/v1717267591031/fd410534-b0a2-46f0-abd8-2318835f5031.png)

When you increase the minor version, you also increase it by one, and just like patch versions, it doesn't have any limits. But when you increase the minor version, you must reset the patch version to zero.

### Major Version

The leftmost number is a major version. When you increase the major version, you tell people that there are backward-incompatible changes. People may experience breakage if they use the next version. It's often associated with a complete overhaul of the product. But, in some cases, it may also happen that we increment the major version, when a lot of new features along with a lot of improvements to the pre-existing features are launched at once!

![Major Version](https://cdn.hashnode.com/res/hashnode/image/upload/v1717267684973/accc1756-5772-478f-83dc-dcc5d7c7c6fa.png)

When you increase the major version number, you have to reset both patch version and minor versions.

## Additional version types

The above mentioned three version types are well-defined by some systematic rules, but for the upcoming version types or details that we are about to discuss doesn't have any proper rules and regulations and it varies between different products and organizations.

### Pre-release version

If you want to create a pre-release version (like an alpha or beta version), you can add a hyphen `-`, followed by the words `alpha` or `beta`. There are no hard and fast rules for pre-releases, so you can name them anything you want. Usually, we use alpha or beta, followed by a number. For example, version `2.0.3-alpha2` is the second alpha release built on top of version `2.0.3` of the actual product.

A pre-release version means the version is unstable and might not meet the intended final quality level. It often contains known and identified bugs, which are desired to be fixed, and even incomplete feature implementation. It's often released for closed/public testing to gather feedback or just to test the current implementation.

### Build Metadata

Build metadata are specified by appending a plus sign and a series of dot-separated identifiers. For example, version 1.2.0+20130313144700.

It provides details beyond the core version number, typically used for internal tracking purposes during development and testing.

You can encode full commit id in the build metadata, so it's faster to analyze from what commit this software was actually build on, or you can encode the date/time of the particular build, machine it was build on.

## Initial Development

Version `0.y.z` is for software in the initial development stage. Software using a 0 MAJOR version indicates that it is at an early development phase, and with any version, anything might get changed. During this period, the product is considered to be unfit for public usage, and is purely in the development stage.

During this phase, we generally start our project with version `0.1.0` and when we reach a stable state and our product is almost feature complete for the launch, we generally test it in the `alpha` and `beta` release. After that, we increase the version to `1.0.0` upon release.

## Conclusion

By now, I think you have realized that by providing clear rules and guidelines for incrementing version numbers, it helps developers communicate changes effectively, manage dependencies, and ensure predictable updates.

Also, if you want to see an example of how semantic versioning is implemented in a real-world project, you can check out my latest project [Get Response](https://www.npmjs.com/package/get-response), which is a Node.js based command-line interface (CLI) tool that interacts with the Google's Gemini API to generate content based on the user input, and can also automate task for you.

Hence, that's a wrap for now, and if you want to learn new things like this, you can follow me at [Swapnoneel Saha](https://hashnode.com/@Swapn0neel) and also follow me on [Twitter (swapnoneel123)](http://twitter.com/swapnoneel123) where I share more such content through my tweets and threads. I wish you a great day ahead and till then keep learning and keep exploring!!
