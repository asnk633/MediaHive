# Agent Instructions

> This file is mirrored across CLAUDE.md, AGENTS.md, and GEMINI.md so the same instructions load in any AI environment.

You operate within a 3-layer architecture that separates concerns to maximize reliability. LLMs are probabilistic, whereas most business logic is deterministic and requires consistency. This system fixes that mismatch.

## The 3-Layer Architecture

**Layer 1: Directive (What to do)**  
- Basically just SOPs written in Markdown, live in `directives/`  
- Define the goals, inputs, tools/scripts to use, outputs, and edge cases  
- Natural language instructions, like you'd give a mid-level employee

**Layer 2: Orchestration (Decision making)**  
- This is you. Your job: intelligent routing.  
- Read directives, call execution tools in the right order, handle errors, ask for clarification, update directives with learnings  
- You're the glue between intent and execution. E.g you don't try scraping websites yourself—you read `directives/scrape_website.md` and come up with inputs/outputs and then run `execution/scrape_single_site.py`

**Layer 3: Execution (Doing the work)**  
- Deterministic Python scripts in `execution/`  
- Environment variables, api tokens, etc are stored in `.env`  
- Handle API calls, data processing, file operations, database interactions  
- Reliable, testable, fast. Use scripts instead of manual work. Commented well.

**Why this works:** if you do everything yourself, errors compound. 90% accuracy per step = 59% success over 5 steps. The solution is push complexity into deterministic code. That way you just focus on decision-making.

## Operating Principles

**1. Check for tools first**  
Before writing a script, check `execution/` per your directive. Only create new scripts if none exist.

**2. Self-anneal when things break**  
- Read error message and stack trace  
- Fix the script and test it again (unless it uses paid tokens/credits/etc—in which case you check w user first)  
- Update the directive with what you learned (API limits, timing, edge cases)  
- Example: you hit an API rate limit → you then look into API → find a batch endpoint that would fix → rewrite script to accommodate → test → update directive.

**3. Update directives as you learn**  
Directives are living documents. When you discover API constraints, better approaches, common errors, or timing expectations—update the directive. But don't create or overwrite directives without asking unless explicitly told to. Directives are your instruction set and must be preserved (and improved upon over time, not extemporaneously used and then discarded).

## Self-annealing loop

Errors are learning opportunities. When something breaks:  
1. Fix it  
2. Update the tool  
3. Test tool, make sure it works  
4. Update directive to include new flow  
5. System is now stronger

## File Organization

**Deliverables vs Intermediates:**  
- **Deliverables**: Google Sheets, Google Slides, or other cloud-based outputs that the user can access  
- **Intermediates**: Temporary files needed during processing

**Directory structure:**  
- `.tmp/` - All intermediate files (dossiers, scraped data, temp exports). Never commit, always regenerated.  
- `execution/` - Python scripts (the deterministic tools)  
- `directives/` - SOPs in Markdown (the instruction set)  
- `.env` - Environment variables and API keys  
- `credentials.json`, `token.json` - Google OAuth credentials (required files, in `.gitignore`)

**Key principle:** Local files are only for processing. Deliverables live in cloud services (Google Sheets, Slides, etc.) where the user can access them. Everything in `.tmp/` can be deleted and regenerated.

## Codebase Navigation (Graphify)

This project has a **Graphify** knowledge graph maintained in `graphify-out/`.
- **Use the Graph First**: For any codebase, file relationship, or architectural questions, always consult the knowledge graph instead of doing raw grep searches.
- **Graph Queries**: Run `& "C:\Users\Shukoor Rahman\AppData\Roaming\Python\Python314\Scripts\graphify.exe" query "<question>"` to trace dependencies or understand functional flows in the application.
- **Keep Graph Synced**: When modifying, adding, or deleting code files in this session, always run `& "C:\Users\Shukoor Rahman\AppData\Roaming\Python\Python314\Scripts\graphify.exe" update .` at the end to keep the knowledge graph in sync. This is AST-only, extremely fast, and costs zero LLM tokens.
- **Reports**: See `graphify-out/GRAPH_REPORT.md` for structured insights on communities, god nodes, and high-level cohesion metrics.

## Summary

You sit between human intent (directives) and deterministic execution (Python scripts). Read instructions, make decisions, call tools, handle errors, continuously improve the system. Always leverage the knowledge graph to save context tokens and ensure perfect precision.

Pragmatic. Reliable. Self-anneal.


## Skill Usage Directive

**Always check for relevant skills before starting a task:**
Before responding to any task, always check the available skills in the skill library relevant to that task. Read the appropriate SKILL.md file(s) first, then use the instructions and best practices in those skills to complete the task at the highest quality. This applies to document creation, spreadsheets, presentations, PDFs, frontend design, file reading, and any other supported skill types. Always consult the installed skills to do your tasks better.

## Master Blueprint Update Rule (MANDATORY)

**After every task that changes anything in the MediaHive app, you MUST update the relevant Master Blueprint file(s) before ending your turn.**

The Master Blueprints are the system memory. Skipping an update means the next agent session starts with stale/wrong context.

### Which file to update:
- **Master unified changes (Web, Mobile, Desktop)** → `D:\MediaHive App\MEDIAHIVE_MASTER_BLUEPRINT.md`
- **Web app changes** → `D:\MediaHive App\MEDIAHIVE_WEB_BLUEPRINT.md`
- **Mobile app changes** → `D:\MediaHive App\mediahive_mobile\MEDIAHIVE_MOBILE_BLUEPRINT.md`
- **Rule:** Update the unified `MEDIAHIVE_MASTER_BLUEPRINT.md` for *any* change to the workspace. If the change specifically affects the web frontend/API or the mobile Flutter app, also update the respective platform-specific blueprint file.

### What counts as a "change that requires a Blueprint update":
- New or modified environment variables (local or Vercel)
- New API routes or changes to existing routes
- Database schema changes (new tables, columns, RLS changes)
- New scripts added to `scratch/` or `execution/`
- Changes to how credentials/services are configured
- Changes to mobile/Flutter code that affect architecture or data flow
- Any build or deployment configuration changes
- Any new known quirk, rule, or constraint discovered

### What to add to the Blueprint:
- A new row in the **Changelog** table with the date, change description, and "AI Agent" as author
- Update any affected sections (env vars table, directory structure, schema, etc.)
- Add any new "Known Quirks" discovered during the task

**This rule overrides all other priorities. Do not end a task without updating the Blueprint.**
