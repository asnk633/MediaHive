---
name: vercel
description: Deploy web builds, Next.js/React components, and get live preview URLs instantly with environment variable management.
---

# Vercel Skill

Enables the agent to build, optimize, and deploy applications directly to Vercel, returning preview URLs for quick development feedback loops.

## When to use this skill
- Deploying React, Vue, Next.js, or static static web apps.
- Creating ephemeral staging environments.
- Configuring environment variables and production hosting.

## CLI & Installation Rules

```bash
npx skills add vercel-labs/agent-skills
```

## Core Features
1. **Instant Preview URL**: Deploy and receive a live staging URL directly within the chat workflow.
2. **Git Auto-Integration**: Triggers deploys via branch updates, mimicking manual developer check-ins.
3. **Performance Optimization**: Scans Next.js dynamic routing, bundle sizes, and static export constraints for build reliability.
4. **Environment Variables**: Dynamically maps configuration keys on deployed environments securely.
