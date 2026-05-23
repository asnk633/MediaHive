---
name: playwright
description: A real browser driver to automate, test, and scrape websites, handle dynamic JS rendering, and execute session interactions.
---

# Playwright Skill

Equips the agent with a real browser automation suite using Playwright to fill forms, click buttons, take screenshots, and navigate complex JS sites without public APIs.

## When to use this skill
- Scaffolding browser automation scripts or end-to-end tests.
- Navigating and extracting data from legacy web portals.
- Debugging stateful frontend processes or capturing page layouts.

## CLI & Installation Rules

```bash
npm install -g @playwright/cli@latest
playwright-cli install --skills
```

## Core Features
1. **Interactive Controls**: Drives browser tabs, clicks, scrolls, fills input forms, and captures screen buffers.
2. **Selector Optimization**: Suggests robust selectors like `getByRole` rather than brittle class chains.
3. **Session Recovery**: Captures and restores cookies, headers, and localStorage to bypass login walls.
4. **Failure Capture**: Generates screenshots and execution trace recordings when an automation test fails.
