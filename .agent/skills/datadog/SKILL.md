---
name: datadog
description: Query logs, monitors, APM traces, latency metrics, and LLM application trace observabilities.
---

# Datadog Skill

Equips the agent to interact with Datadog's Rust-based `pup` CLI to query APM traces, monitors, production error logs, and LLM application traces.

## When to use this skill
- Investigating latency spikes, downstream database bottlenecks, or memory leaks.
- Diagnosing complex, distributed system behaviors.
- Auditing LLM traces and bootstrap classification metrics.

## CLI & Installation Rules

```bash
# Add CLI dependency
brew tap datadog-labs/pack
brew install datadog-labs/pack/pup
pup auth login

# Add Skills
npx skills add datadog-labs/agent-skills \
  --skill dd-pup \
  --skill dd-monitors \
  --skill dd-logs \
  --skill dd-apm \
  --skill dd-docs
```

## Core Features
1. **APM Span Inspection**: Traces execution logs across distributed hops, pinpointing the slow microservice.
2. **Log Search Syntax**: Runs precise query operations matching production parameters directly.
3. **LLM Observability**: Analyzes and benchmarks generative app latency, evaluating and classifying traces.
