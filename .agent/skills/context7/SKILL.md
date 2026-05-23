---
name: context7
description: Up-to-date, version-pinned library documentation for React, Next.js, and thousands of packages to prevent API hallucination.
---

# Context7 Skill

Provides live, version-pinned, context-aware documentation to prevent the agent from hallucinating deprecated or missing APIs when writing code.

## When to use this skill
- When using npm, pip, or cargo packages in the codebase.
- Writing or refactoring React hooks, Next.js page components, or external API wrappers.
- Upgrading standard dependencies to modern versions.

## CLI & Installation Rules

```bash
npm install -g ctx7
# Verify
ctx7 --version
```

### Registry Command Rules
```bash
# Search registry by keyword
ctx7 skills search react
# Install specific skill by name
ctx7 skills install /anthropics/skills pdf
# Get suggestions based on project's dependencies
ctx7 skills suggest
```

## Core Features
1. **Version Pinning**: Fetch documentation matching the exact package version installed in `package.json`.
2. **Snippet Support**: Returns real, copy-pasteable snippets and integration rules from official documentation.
3. **API Integrity**: Protects against model training-data cutoffs by fetching real-time SDK and library rules.
