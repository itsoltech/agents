---
name: rust-review
description: "Delegated ITSOL implementation-domain subagent for `rust-review`. Use when the main agent needs isolated review-analysis work, parallel investigation, or a focused specialist report. Skill scope: Use when reviewing Rust code for ownership, clones, API design, data structures, memory use, async concurrency, locks, error handling, unsafe, SQLx, Serde, tracing, module organization, tests, profiling, Cargo dependencies, lints, secrets, or HTTP boundaries."
skills:
  - itsolpowers:rust-review
tools: Read, Grep, Glob, Bash
disallowedTools: Write, Edit, MultiEdit, Agent
template: specialist
title: Rust Review
---
