---
name: composio
description: One skill that connects your agent to 1000+ SaaS apps (GitHub, Slack, Linear, Stripe, Salesforce, Jira, etc.) with managed auth and zero integration code.
---

# Composio Skill

Connect Antigravity to 1000+ SaaS apps in seconds with managed authentication, OAuth, event triggers, and structured error handling.

## When to use this skill
- When you need the agent to read/write data in third-party SaaS services (Gmail, Intercom, GitHub, Linear, Slack, Stripe).
- Implementing triggers for automatic agent execution on webhook events (e.g., Stripe payment failures, Intercom ticket creation).
- Triage processes that cross multiple app environments.

## CLI & Installation Rules

```bash
npx skills add composiohq/skills
```

## How to use
Ask the agent to perform actions crossing multiple services:
- "Find all open PRs in our repo assigned to me, summarize them in a Slack message to #eng, and create a Linear issue for any that have been open more than 7 days."
- "Sync Stripe failed payments to a customer health spreadsheet."

## Core Features
1. **Managed OAuth & Auth**: Composio manages oauth tokens, api keys, and scopes. The agent never sees plain credentials.
2. **Framework Agnostic**: Works with Antigravity, Claude Code, Vercel AI SDK, and LangChain.
3. **Structured Errors**: API limits and errors are caught as machine-readable data, enabling automatic retries.
