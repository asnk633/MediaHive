---
name: sentry
description: Real-time error monitoring, release tracking, and automated issue resolution for production React, Next.js, and Node.js code.
---

# Sentry Skill

Connects the agent to Sentry issue triaging and error logs, enabling automatically generated null checks, bug-fix code branches, and release audits.

## When to use this skill
- Debugging unexpected UI crashes or API failures.
- Automating support triage workflows.
- Correlating newly deployed code with error spikes.

## CLI & Installation Rules

```bash
npx skills add getsentry/sentry-for-ai
```

## Core Features
1. **Error Clustering**: Focuses agent actions on grouped issues instead of raw, noisy log entries.
2. **Stack Trace Analysis**: Parses source-mapped stack traces, pinpointing exact files and line numbers.
3. **Commit Association**: Correlates releases and commits to identify the root cause of a regression.
4. **Automated Bug Patching**: Connects with the GitHub skill to write fix PRs based on trace details.
