# Thaiba Garden — Media Manager (Orchids fork)

A mobile-first task & media manager built with Next.js + TypeScript, Drizzle (Turso/SQLite), and a small mobile/web UI.  
This repository is the hybrid output generated and polished from Orchids + local edits (Kanban, file uploads, avatar uploads, Playwright tests, CI).

---

## Quick status
- ✅ Next.js 15 + App Router (TypeScript)
- ✅ Database: Turso SQLite + Drizzle ORM
- ✅ Auth + roles: Admin / Team / Guest
- ✅ Features: Tasks (list + Kanban), Calendar (list view), Files hub, Notifications, Profile (avatar upload), Attendance check-in/out
- ✅ E2E tests (Playwright) — included and runnable locally & via GitHub Actions
- ✅ CI workflow added: runs Playwright tests on push (see GitHub Actions → *CI — Tests & Playwright*)
- 🔒 **Design Contract**: UI rules are locked. See [docs/design-contract.md](docs/design-contract.md).

---

## Before you start (local dev prerequisites)
- Node.js 18+ (I used Node 22 in my environment; Node 18/20 should work)
- Git
- npm (or pnpm/yarn)
- Optional: `pnpm` if you prefer

> If you hit dependency resolution errors (peer deps) use `--legacy-peer-deps` when installing.

---

## Install (recommended commands)
```bash
# from repo root
# safer install to avoid peer dep conflicts:
npm install --legacy-peer-deps

# or, if you use pnpm:
# pnpm install
