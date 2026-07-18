---
title: "MeshHop"
date: "2026-07-19"
description: "A desktop app that automatically discovers, verifies, and routes an isolated browser profile through the best public proxies."
cover: "/project/mesh-hop.jpg"
link: "https://mesh-hop.vercel.app"
---

## MeshHop

A lightweight, self-contained desktop application that automatically discovers working public proxies for a chosen region, verifies them end-to-end, and routes a dedicated browser profile through the best one. It automates the tedious parts of finding, testing, ranking, and rotating public exits, and wires a hardened Firefox profile to the result.

### Tech Stack

- **Rust** — Tauri for the lightweight, secure cross-platform desktop framework and sidecar process execution
- **Next.js** — for a responsive, modern desktop dashboard and user interface
- **Node.js** — for the custom concurrent proxy discovery and benchmarking engine (bundled as a sidecar)
- **Tailwind CSS** — for custom theme-driven user interface components
- **Firefox** — for launching isolated, proxy-hardened browser profiles with uBlock Origin pre-configured

### Features

- Automated **proxy discovery** pulls current candidates (HTTP, HTTPS, SOCKS4, SOCKS5) from multiple public providers.
- End-to-end **proxy verification** tests candidates concurrently via HTTPS requests to Cloudflare's trace endpoint to verify country and IP.
- Performance **profiling and benchmarking** measures steady-state download speed, speed consistency, and network classification.
- One-click **proxied browsing** launches a dedicated, isolated browser profile with reduced WebRTC/DNS leakages and pre-installed extensions.
- Dynamic **IP rotation** rotates proxies or refreshes candidates instantly from the desktop interface.
