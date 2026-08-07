---
title: "How to Generate Random Numbers in JavaScript"
date: "2024-11-01T01:20:01.000Z"
description: >-
  Use Math.random() for everyday variation, then build ranges, integers, booleans, choices, and shuffles around it. Use the Web Crypto API when randomness protects an identifier or secret.
cover: >-
  https://wp.keploy.io/wp-content/uploads/2024/11/ae22594e-c87c-49a5-8748-e3a26131.webp
link: "https://keploy.io/blog/community/javascript-random-number"
tags:
  - javascript
  - math
  - webdev
  - frontend
updated: "2026-07-23T13:07:48.942Z"
---

When you need a surprise in a game, a quiz, or a sample from a list, JavaScript gives you a starting point: `Math.random()`. It returns a decimal from 0 (included) up to 1 (not included). The number is pseudo-random, so it works for everyday variation but is not a security feature.

The useful part is the small bit of math you put around that decimal. Once you understand that, random integers, choices, booleans, and shuffles all follow the same pattern. A related JavaScript array guide is linked [here](https://keploy.io/blog/community/javascript-array-filter-method-guide) if you want to keep working with collections afterward.

## Start with Math.random()

Call the function and store its result when you need to reuse it. The half-open range, written as `[0, 1)`, means 0 is possible while 1 is not.

```javascript
const randomNum = Math.random();
console.log(randomNum); // A decimal greater than or equal to 0 and less than 1
```

You should see a different-looking decimal on most runs:

![Console output of Math.random() generating floating-point number](https://wp.keploy.io/wp-content/uploads/2024/11/a8b9e0ce-0d09-4adb-ad38-f0e667c9-1.webp)

That decimal is rarely the final shape you want. To create a value in another range, multiply it by the size of the range and then shift it by the minimum.

## Generate a number in a range

This function returns a decimal greater than or equal to `min` and less than `max`:

```javascript
function getRandomInRange(min, max) {
  if (min >= max) {
    throw new Error("min must be less than max");
  }

  return Math.random() * (max - min) + min;
}

console.log(getRandomInRange(10, 20)); // A decimal from 10 up to, but not including, 20
```

The expression `(max - min)` gives you the range width. Multiplying by `Math.random()` scales the result, and adding `min` moves it to the correct starting point.

Here is the kind of output you might see:

![Console output of getRandomInRange function](https://wp.keploy.io/wp-content/uploads/2024/11/31462bb9-e5ae-48b7-bb57-3eb5495e-1.webp)

## Generate an integer in an inclusive range

For a whole number, place `Math.floor()` around the scaled value. The `+ 1` matters when you want both endpoints included. Without it, the maximum value can never appear.

```javascript
function getRandomIntInRange(min, max) {
  if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) {
    throw new Error("min and max must be integers, with min less than or equal to max");
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

console.log(getRandomIntInRange(1, 100)); // An integer from 1 through 100
```

`Math.floor()` always rounds down. Since the scaled value is less than `max - min + 1`, the largest possible result after adding `min` is still `max`.

The output will look similar to this:

![Console output of getRandomIntInRange generating random integer](https://wp.keploy.io/wp-content/uploads/2024/11/run-code-output.webp)

## Generate a random boolean

A boolean needs only two outcomes. Comparing the random decimal with `0.5` gives you `true` about half the time and `false` the rest of the time.

```javascript
function getRandomBoolean() {
  return Math.random() >= 0.5;
}

console.log(getRandomBoolean()); // true or false
```

You might see an output like this:

![Console output of getRandomBoolean function](https://wp.keploy.io/wp-content/uploads/2024/11/ed23a257-5fc0-4ed9-b5dd-a80ce6cd-1.webp)

## Pick a random array element

Array indexes start at 0, so the largest valid index is `array.length - 1`. Multiplying by the length and flooring the result gives you an index that stays inside the array.

```javascript
const colors = ["red", "green", "blue", "yellow"];
const randomColor = colors[Math.floor(Math.random() * colors.length)];
console.log(randomColor); // A color from the array
```

Here is an example of the resulting output:

![Console output selecting random element from array](https://wp.keploy.io/wp-content/uploads/2024/11/random-element.webp)

## Shuffle an array

Sorting with a random comparator looks tempting, but it does not give every arrangement a fair chance. The Fisher-Yates algorithm is easier to reason about: start at the end, choose a random position from the part you have not shuffled, and swap the two values.

```javascript
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const numbers = [1, 2, 3, 4, 5];
console.log(shuffleArray(numbers)); // Outputs a shuffled array
```

This function changes the original array and returns it. If you need to keep the original order, pass a copy with `shuffleArray([...numbers])`.

The console output could look like this:

![Console output of Fisher-Yates array shuffle algorithm](https://wp.keploy.io/wp-content/uploads/2024/11/shuffled-array-output.webp)

## Do not build secure identifiers with Math.random()

The old hand-written UUID example is worth treating as a warning. It uses `Math.random()`, which is not designed for secrets and does not provide the guarantees you want from a UUID. In modern browsers, use the built-in UUID method instead:

```javascript
const id = crypto.randomUUID();
console.log(id);
```

The existing screenshot shows the output from the older generator:

```javascript
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

console.log(generateUUID()); // Outputs a random UUID
```

It can print a UUID-shaped string, but the shape alone does not make it safe for authentication tokens, password reset links, or other sensitive values.

![Console output of generateUUID function](https://wp.keploy.io/wp-content/uploads/2024/11/run-code-output2.webp)

## Use the Web Crypto API for security

For passwords, tokens, keys, and other security-sensitive values, use the Web Cryptography API. `crypto.getRandomValues()` fills a typed array with secure random values:

```javascript
function getSecureRandom() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0];
}

console.log(getSecureRandom());
```

In browser code, `crypto` is available as the global Web Crypto object. In a Node.js project, use the crypto API provided by your Node version instead of assuming that `window` exists.

## The rule to remember

Use `Math.random()` for ordinary variation, such as choosing a color or deciding which quiz question appears next. Use the Web Crypto API when someone could gain access, guess a value, or reset an account if the number is predictable.

My caveat: randomness is easy to add and easy to misuse. Before reaching for a generator, decide whether you need a playful variation or a value that must resist guessing.

For more JavaScript practice, see these related posts:

[https://keploy.io/blog/technology/mastering-nyc-enhance-javascript-typescript-test-coverage](https://keploy.io/blog/technology/mastering-nyc-enhance-javascript-typescript-test-coverage)

[https://keploy.io/blog/community/javascript-var-vs-let-vs-const](https://keploy.io/blog/community/javascript-var-vs-let-vs-const)
