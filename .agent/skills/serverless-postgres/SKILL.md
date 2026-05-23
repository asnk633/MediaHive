---
name: serverless-postgres
description: Serverless Postgres manager with instant copy-on-write branching for safe database migrations and preview environments.
---

# Serverless Postgres (Neon) Skill

Provides safe database workflows for the agent using serverless Postgres database branching to run schemas, seed tests, and optimize query plans.

## When to use this skill
- Provisioning staging or preview databases for Pull Requests.
- Executing database migrations safely.
- Auditing transaction workloads and connection pool efficiency.

## CLI & Installation Rules

```bash
# Add Neon skills
npx skills add neondatabase/agent-skills

# Complete OAuth setup
npx neonctl@latest init
```

## Core Features
1. **Copy-on-Write Branching**: Forks production instances into safe sandbox branches in seconds for migration testing.
2. **Compute Allocation**: Guides the agent on picking Serverless HTTP drivers for edge runtimes vs standard connection pools.
3. **Egress Optimizer**: Analyzes and flags expensive ORM behaviors or missing indices before bills grow.
