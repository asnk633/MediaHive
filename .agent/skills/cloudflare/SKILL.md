---
name: cloudflare
description: Build and ship edge infrastructure (Workers, D1 SQLite, R2 Storage, Durable Objects, KV, Queues) with Wrangler.
---

# Cloudflare Skill

Provides definitions and Wrangler commands for provisioning and deploying edge infrastructure on Cloudflare (Workers, D1 SQLite databases, R2 Object Storage, KV, and WAF rules).

## When to use this skill
- Creating, deploying, or testing serverless API endpoints using Cloudflare Workers.
- Provisioning serverless SQLite databases (D1) or KV storage.
- Standardizing microservice infrastructure.

## CLI & Installation Rules

```bash
npx skills add cloudflare/skills
```

### Wrangler Deployment Rule Example
```bash
# Deploy Worker
wrangler deploy
```

## Core Features
1. **Infrastructure Selection**: Automatically guides the agent on when to use KV (read-heavy static), D1 (structured SQL), or Durable Objects (highly stateful).
2. **Binding Management**: Ensures D1 or R2 database bindings are wired via `wrangler.toml` instead of API keys, protecting credentials.
3. **Local Testing**: Leverages Wrangler for offline dev and health checks before production deploys.
