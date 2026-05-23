---
name: exa
description: Neural semantic web search optimized for AI agents to retrieve parsed, structured content instead of simple keyword URLs.
---

# Exa Skill

Equips the agent with a semantic search pipeline optimized for machine interpretation, pulling clean, structured content rather than standard SEO link lists.

## When to use this skill
- Fact-checking current pricing scales or software releases.
- Conducting market or package research.
- Sourcing clean document contents for summarization tasks.

## CLI & Installation Rules

```bash
claude mcp add --transport http exa "https://mcp.exa.ai/mcp"
```

## Core Features
1. **Semantic Search Engine**: Understands natural language contexts, bypassing brittle keyword matching.
2. **Contents API**: Extracts parsed page markdown in a single request, eliminating extra scraping loops.
3. **Structured Response**: Returns author, publish dates, and formatted body nodes cleanly.
