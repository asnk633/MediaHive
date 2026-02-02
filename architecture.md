# MediaHive — System Architecture & Platform Map

> **Purpose**: This document defines what services MediaHive uses for each responsibility so UI work, backend work, and deployments stay isolated and predictable.

---

## 🧭 High‑Level Overview

MediaHive is a Next.js application deployed on Vercel with API routes acting as the backend. Data and authentication are handled via Firebase, while downloadable files and inventory attachments are stored in a shared Google Drive.

---

## 🖥 Frontend

- Framework: **Next.js (App Router)**
- Runtime: Node (via Vercel)
- Styling: Tailwind
- Mobile: Capacitor wrapper for Android / iOS

---

## 🧠 Backend

- Implemented as **Next.js API routes** (`src/app/api/**/route.ts`)
- No separate external server
- Used for:
  - Business logic
  - Firebase access
  - Google Drive integration
  - AI features
  - Cron / automation jobs

---

## 🔐 Data & Authentication

### Primary Platform: Firebase

Firebase is the **authoritative datastore** for:

- Users
- Authentication
- Roles / RBAC
- Tasks
- Events
- Notifications
- Attendance
- Departments
- Automation rules
- Logs / audit trails

---

## 📁 File Storage

### Primary Platform: Shared Google Drive

Used for:

- Downloadable files
- Inventory attachments
- Uploaded media
- Archived documents

Drive is accessed through API routes.

---

## 🚫 What Is *Not* Used for Files

- Supabase Storage

Supabase must **not** be used for downloads or inventory storage unless explicitly changed in this document.

---

## ☁ Deployment

### Production

- Platform: Vercel
- Branch: `main`
- Environment variables configured in Vercel dashboard

### Local Development

- `.env.local`
- Firebase emulator optional
- Google Drive test credentials

---

## 📦 Environments

| Environment | Purpose | Notes |
|------------|-------|------|
| Local | UI + API dev | Uses `.env.local` |
| Preview (Vercel) | PR testing | Mirrors prod services |
| Production | Live users | `main` branch only |

---

## 📜 Rules of Engagement

### UI‑Only Work

When working on UI polish:

- ❌ Do NOT touch API routes
- ❌ Do NOT change storage providers
- ❌ Do NOT change auth systems
- ❌ Do NOT change `next.config.mjs`

Only components, layouts, styles, and client logic may change.

---

### Infrastructure / Platform Changes

Any change to:

- Firebase usage
- Google Drive integration
- Deployment mode
- Static export settings
- Auth providers

**must update this file first.**

---

## 📌 CI / Build Expectations

- `npm run build` must succeed locally before pushing
- `.next` is ignored in git
- Static export rules must be preserved

---

## 📱 Mobile Builds

- Capacitor wraps the Next.js export
- Android / iOS consume the same API routes
- Cloudflare / CORS configured for app traffic

---

## 🛡 Source of Truth

If there is ever confusion about:

- where files are stored
- which DB is used
- which auth provider exists
- where production runs

**This document overrides assumptions.**

---

_Last updated: add date on change._

