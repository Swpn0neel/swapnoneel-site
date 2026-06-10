---
title: "Publishing your own NPM Package is too simple!!"
date: "2024-05-25T15:55:48.764Z"
description: "Introduction\nIsn't it cool if you can run command like npx <you_name> in someone's terminal, and they can read about you, your works, and find details like your social media handles, right at their terminal?\nOr maybe you have created some cool React ..."
cover: "https://web.archive.org/web/20240527171209/https://cdn.hashnode.com/res/hashnode/image/upload/v1716652494165/d4d1de8a-1201-411d-af7d-9b40fa4b6a21.png"
link: "https://swapnoneel.hashnode.dev/publish-your-own-npm-package"
---

## Introduction

Isn't it cool if you can run command like `npx <you_name>` in someone's terminal, and they can read about you, your works, and find details like your social media handles, right at their terminal?

Or maybe you have created some cool React component, wouldn't that be even more cooler if other folks can use them in their projects just by installing an `npm` package?

I think you have got the drill already... Publishing your own NPM package is really cool and can help a lot of folks globally!! So, before we start about how to publish your own NPM package, I think you should run these two commands first at your terminal `npx swapnoneel` and `npx get-response`, to properly understand what I mean by "cool" and "helpful"!!

## Create your NPM account

This is the most obvious step, if you want to publish your own package!!

Just head over to [https://www.npmjs.com](https://www.npmjs.com) and create your account.

Also, remember to do two-factor authentication of your account. You can use an Authenticator app like [TOTP Authenticator](https://play.google.com/store/apps/details?id=com.authenticator.authservice2&hl=en&gl=US)!!

We will talk later, about how and when to use our account. For now, let's continue to the next step!!

## Choose the name of your NPM package

The very first thing you need to do before creating your package is to choose a name. This is important because your package needs to have a unique name and you cannot choose a name that has been used already.

After you choose a name, you've to go to the [NPM registry](https://www.npmjs.com/) and run a search. Be sure there's no exact match to the name you chose or a match that is too similar. Otherwise, you have to try choosing a different name!!

## Let's start creating the NPM package

As I've stated in the title itself, that creating your own NPM package is extremely simple; now you will understand, why!

### Install Node and NPM

If you don't have Node installed already, you should go and refer to [this article](https://swapnoneel.hashnode.dev/nodejs-npm-nvm) and install it. In the article, you will find the step-by-step guide about how to install and maintain the different Node versions!!

### Initialize git repository

Create a new project folder for your package and navigate into the folder. Then, run the following command in your terminal:

```bash
git init
```

This will help us track the changes in our package. Also, make sure that it remains hosted on GitHub!!

### Initialize NPM in your project

To do this, navigate to the root directory of your project and run the following command:

```bash
npm init
```

Now, you will prompted to give some answers, I'm mentioning the utility of each one of them:

- `package-name`: It should be the name of your package that you want to publish. Also, remember that it must be lowercase and may only include hyphens.
- `version`: The initial value is `1.0.0`. You may change it to `0.1.0` and release the full version `1.0.0` later!! You will be updating the version number each time when you update your package using [semantic versioning](https://www.freecodecamp.org/news/semantic-versioning-1fd6f57749f7/).
- `description`: You can provide a description of your package here, explaining about what your package does and how to use it.
- `entry point`: The entry file for your code. The default value is `index.js`.
- `test command`: Here, you can add the command you want to run when a user runs `npm run test`. To keep things simple, you may keep it blank for now!!
- `git repository`: The link to your remote repository on GitHub. It's optional, but it's better if you can add the GitHub repository link here!!
- `keywords`: Add relevant keywords that will help others find your package on the NPM registry. It's optional too, and you can leave it blank for now!!
- `author`: Add your name.
- `license`: You can add a license or use the default license, Internet Systems Consortium (ISC) License.

Once you provide all these information, a file will be created called `package.json` that will kinda look like this:

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1716639984976/535670bf-65cd-4641-9b48-1be0daef046b.png align="center")

<div data-node-type="callout">
<div data-node-type="callout-emoji">💡</div>
<div data-node-type="callout-text"><strong><em>Additionally, you should modify the </em></strong><code>package.json</code><strong><em> file to add </em></strong><code>"type" : "module"</code><strong><em> which will enable you to write the JavaScript code in ECMAScript modules format. This allows for cleaner code organization, code reusability, and better encapsulation.</em></strong></div>
</div>

### Write your code

Now, you can go ahead and write your code for the package.

For this tutorial, I will be writing my code in the `index.js` file.

**💡 Reminder!!**

_Please add the following line at the start of the code because it tells the operating system to use the Node.js interpreter to execute the script. It allows us to run the script by simply typing its filename, without having to specify the full path to the Node.js interpreter._

```javascript
#!/usr/bin/env node
```

Now inside the `index.js` file, write the code for your package. Here, I will be creating a simple package called `test`. This package will print the string `"Reminder to follow Swapnoneel on Twitter at https://x.com/swapnoneel123"` in the terminal.

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1716648802856/1df1543f-5bb4-43e6-affa-3f4461378f83.png align="center")

### Create an executable script

Now, we have to make this `index.js` file executable and assign it to a command, so that whenever we run that command, we get the result output-ed by `index.js` . For doing that, we have to add this in out `package.json` file:

```json
"bin": {
  "test": "./index.js"
},
```

So, after all the changes, our `package.json` file should look somewhat like this:

```json
{
  "name": "test",
  "version": "1.0.0",
  "description": "just to test how to publish npm package",
  "main": "./index.js",
  "type": "module",
  "bin": {
    "test": "./index.js"
  },
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/Swpn0neel/test.git"
  },
  "author": "Swapnoneel Saha",
  "license": "ISC",
  "bugs": {
    "url": "https://github.com/Swpn0neel/test/issues"
  },
  "homepage": "https://github.com/Swpn0neel/test#readme"
}
```

### Make the script executable

Now, to make this script executable, so that works perfectly, we have to run this command in our terminals:

**Linux**

```bash
chmod +x index.js
```

**Windows**

_Note that, for this to work perfectly, you need to have_`git`_installed on your system!!_

```bash
git update-index --chmod=+x index.js
```

## Test your NPM package

Testing ensures that your NPM package works as expected. To do that, first navigate to the root of your project. Then, run the following command:

```bash
npm link
```

This will make your package available globally. And you can require the package in a different project to test it out. For that, you go outside the root directory and try running the following command to add the package you have just created:

```bash
npm link <your_package_name>
```

And, you'll see something like this:

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1716650345968/b8038b49-3ee6-4ce2-8e78-f61b04b60a84.png align="center")

Now you can run your package, and it should work perfectly!!

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1716650425160/b8d12272-5801-4c13-87fa-243a88244d8f.png align="center")

## _Publish Your NPM Package_

To publish your package on the NPM registry, you need to have an account. And, I hope you have created that previously!!

So, now it's time to open your terminal and run the following command in the root of your package:

```bash
npm login
```

You will get a prompt to enter your `username` and `password`. If login is successful, you should see a message like this:

`Logged in as <your-username> on https://registry.npmjs.org/.`

You can now run the following command to publish your package on the NPM registry:

```bash
npm publish
```

Note that, during these steps you may need to use your authentication app to authenticate the procedure!!

And so if you have been following along, then congratulations! You just published your first NPM package. And, you can visit the [NPM website](https://www.npmjs.com/) and run a search for your package. You should see your package show up in the search results.

## Conclusion

And now, you can probably boast about your coolness, because yes, your tool can be accessed anywhere in the world in anybody's terminal!!

If you want to know how vast tools you can make through this, head over to [Get Response](https://www.npmjs.com/package/get-response), which is a node.js based command-line interface (CLI) tool that uses the Google's Gemini to generate content based on the user input. This tool allows you to ask questions directly or provide context from files or directories, and get the response in a simple and easy to understand interface.

And finally, thank you for reading the blog! I hope you found it informative and valuable. For more information, follow me on [**Twitter (swapnoneel123**](http://twitter.com/swapnoneel123)**)** where I share more such content through my tweets and threads. And, please consider sharing it with others on **Twitter** and tag me in your post so I can see it too. You can also check my [**GitHub (Swpn0neel)**](https://github.com/Swpn0neel) to see my projects.

I wish you a great day ahead and till then keep learning and keep exploring!!

![](https://cdn.hashnode.com/res/hashnode/image/upload/v1716652301849/8327a90c-373e-4837-9102-e67bb38def0c.png align="center")
