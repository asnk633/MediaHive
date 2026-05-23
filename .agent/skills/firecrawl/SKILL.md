---
name: firecrawl
description: Scrape and crawl any URL or documentation tree, render JS-heavy SPAs, and output clean LLM-ready markdown.
---

# Firecrawl Skill

Allows the agent to clean raw website HTML, render JavaScript SPA pages, and fetch entire documentation trees as clean markdown.

## When to use this skill
- Ingesting a library's online API reference folder.
- Extracting raw body contents from dynamically-loaded websites.
- Scraping structured schemas without cookie banners or layout clutter.

## CLI & Installation Rules

```bash
npm install -g firecrawl-cli
# Or automate setup globally across all editors:
npx -y firecrawl-cli@1.16.2 init -y --browser
```

## Core Features
1. **JavaScript SPA Compatibility**: Fully runs headless browser rendering before extraction, supporting React/Vue SPAs.
2. **Whole Tree Crawling**: Crawls full directories recursively based on depth parameters.
3. **Structured Extraction**: Transforms raw pages into a pre-defined JSON schema (e.g. products, prices).
