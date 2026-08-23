---
title: "Blame"
date: "2026-07-01"
description: "Client-side Next.js web application designed to scan GitHub repositories, resolve contributor identities, and audit commit counts directly in the browser."
cover: "/project/blame.jpg"
link: "https://gitblame.vercel.app"
repo: "https://github.com/Swpn0neel/blame"
featured: false
---

A powerful client-side contributor aggregation and outreach tool designed to answer one crucial question for any GitHub repository: "who actually contributed, and how much?" By extracting names, emails, and commit frequencies directly from the browser, Blame enables recruiters, project leads, and open-source audit tools to quickly locate and connect with repository contributors.

### Tech Stack

- **Next.js** — powering the client-side single-page web application with Turbopack, React 19, and the App Router
- **TypeScript** — ensuring static typing, safety, and robust code structures for component interfaces and utility functions
- **GitHub REST API** — fetching commit lists, resolving user profiles, and aggregating histories directly from the browser without intermediate servers
- **Tailwind CSS** — styling the user interface with a sleek, modern, dark-themed responsive layout and interactive animations

### Features

- Runs client-side to query `api.github.com` without backend storage, keeping scans private
- Employs a DP-based fuzzy matcher to filter results with word-boundary and run bonuses
- Supports personal access tokens directly from the browser to raise API rate limits
- Groups commits by GitHub profile and resolves usernames from private email aliases
- Exports aggregated results as a CSV file or copies them directly as markdown
- Filters merge commits, sorts results, and limits the total contributor list size
