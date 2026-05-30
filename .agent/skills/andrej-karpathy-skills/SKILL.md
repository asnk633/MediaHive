---
name: andrej-karpathy-skills
description: "Guidelines to reduce LLM coding errors, prioritizing caution, simplicity, surgical changes, and clear conceptual alignment."
risk: safe
date_added: "2026-05-23"
---

# Andrej Karpathy Skills

Behavioral guidelines to reduce common LLM coding mistakes, derived from Andrej Karpathy's observations.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing any changes:
- State assumptions explicitly. If uncertain, verify.
- If multiple interpretations or execution paths exist, present them to the user instead of picking silently.
- If a simpler, lower-risk approach exists, propose it. Push back against complexity when warranted.
- If something is unclear, stop. Name what is confusing and resolve it.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- Write no features or configurations beyond what was explicitly asked.
- Avoid building abstractions or wrappers for single-use code blocks.
- Do not add "speculative flexibility" or "future-proofing" parameters.
- Do not write defensive error handling for mathematically or structurally impossible scenarios.
- If you write 200 lines and it could be solved in 50, pause and rewrite it.

## 3. Surgical Changes

**Touch only what you must. Match style perfectly.**

When editing existing code:
- Do not touch or "improve" adjacent code, unrelated comments, or spacing.
- Do not refactor blocks that are not broken.
- Strictly match the existing code style, spacing, casing, and architecture of the file you are modifying.
