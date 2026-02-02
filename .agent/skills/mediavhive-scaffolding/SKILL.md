---

name: scaffolding-mediavhive-platform

description: Scaffolds a MediaHive web platform with admin panel, authentication, role-based access control, and CMS foundations. Use when the user asks to initialize MediaHive, create admin dashboards, add login systems, implement roles, or build content management tooling.

---



\# MediaHive Platform Scaffolding Skill



\## When to use this skill

\- "Create the MediaHive app structure"

\- "Scaffold admin panel with auth and roles"

\- "Add CMS backend for MediaHive"

\- "Initialize dashboard with login and permissions"

\- "Build institutional website backend"



---



\## Scope



Creates or extends:



\- Admin dashboard shell

\- Authentication system

\- Role-based access control (RBAC)

\- CMS data models

\- API routing

\- Layout + navigation

\- Migration + seed scripts

\- Linting, formatting, CI hooks



Targets modern web stacks, defaulting to:



\- Next.js + TypeScript

\- Tailwind

\- Prisma or Drizzle

\- PostgreSQL / Supabase

\- JWT or session auth

\- tRPC or REST



---



\## Preconditions



\- Node 18+

\- Git repo initialized

\- package.json exists (or permission to create one)

\- No uncommitted destructive changes



---



\## Workflow



\### Checklist



```markdown

\- \[ ] Detect framework and package manager

\- \[ ] Confirm TypeScript usage

\- \[ ] Scan existing routing

\- \[ ] Choose ORM and auth provider

\- \[ ] Create admin shell

\- \[ ] Add RBAC middleware

\- \[ ] Create CMS models

\- \[ ] Generate migrations

\- \[ ] Seed roles + admin user

\- \[ ] Run lint/tests/build


---

Plan



Detect framework.



Create /admin route group.



Add auth provider.



Add RBAC middleware.



Create CMS schema.



Add seed scripts.



Generate navigation layout.



Run validation.



List files before writing.



Validate

node scripts/detect-framework.js

npm run lint || true

npm run test || true





Abort if framework cannot be determined.



Execute

npm run build



Instructions

1\. Framework Detection



Run:



node scripts/detect-framework.js





Rules:



Next.js App Router → /src/app



Pages Router → /pages



Vite → /src/main.tsx



Remix → /app/root.tsx



Abort if unknown.



2\. Directory Layout (Next.js)



Create:



src/

&nbsp;├── app/

&nbsp;│   ├── admin/

&nbsp;│   │   ├── layout.tsx

&nbsp;│   │   ├── page.tsx

&nbsp;│   │   ├── users/

&nbsp;│   │   ├── roles/

&nbsp;│   │   └── content/

&nbsp;│   └── api/

&nbsp;│       └── auth/

&nbsp;├── lib/

&nbsp;│   ├── auth.ts

&nbsp;│   ├── rbac.ts

&nbsp;│   └── db.ts

&nbsp;├── components/

&nbsp;│   └── admin-nav.tsx

&nbsp;└── prisma/

&nbsp;    ├── schema.prisma

&nbsp;    └── seed.ts



3\. Roles



Mandatory roles:



SUPER\_ADMIN



ADMIN



EDITOR



VIEWER



RBAC rules:



SUPER\_ADMIN → full access



ADMIN → manage users/content



EDITOR → manage content



VIEWER → read-only



4\. CMS Models



Minimum schema:



User



Role



Permission



Page



Post



MediaAsset



AuditLog



Each content model includes:



id



slug



title



status



createdAt



updatedAt



publishedAt



5\. Auth



Prefer:



NextAuth/Auth.js



Supabase Auth



Clerk



Must support:



email/password



session cookies



role injection



middleware guards



6\. Admin UI



Generate:



Sidebar layout



Breadcrumb header



Table component



CRUD forms



Modal delete confirm



Pagination



Search



Accessibility:



aria labels



keyboard nav



focus trapping



7\. RBAC Middleware



All /admin/\* routes require:



authenticated user



role check



redirect to /login on failure



8\. Seeding



Create prisma/seed.ts:



default SUPER\_ADMIN



demo roles



sample CMS page



9\. CI Expectations



Add scripts:



{

&nbsp; "lint": "next lint",

&nbsp; "build": "next build",

&nbsp; "typecheck": "tsc --noEmit",

&nbsp; "seed": "prisma db seed"

}



Resources



scripts/



resources/



Supporting Files

scripts/detect-framework.js

import fs from "fs";



const checks = \[

&nbsp; { path: "src/app", name: "next-app-router" },

&nbsp; { path: "pages", name: "next-pages-router" },

&nbsp; { path: "src/main.tsx", name: "vite" },

&nbsp; { path: "app/root.tsx", name: "remix" }

];



for (const c of checks) {

&nbsp; if (fs.existsSync(c.path)) {

&nbsp;   console.log(c.name);

&nbsp;   process.exit(0);

&nbsp; }

}



console.error("Unknown framework");

process.exit(1);



scripts/scaffold-mediavhive.sh

\#!/usr/bin/env bash

set -e



echo "Scaffolding MediaHive core..."



mkdir -p src/app/admin/{users,roles,content}

mkdir -p src/lib src/components prisma



touch src/lib/{auth.ts,rbac.ts,db.ts}

touch src/components/admin-nav.tsx

touch prisma/schema.prisma prisma/seed.ts



resources/admin-layout.tsx.tpl

export default function AdminLayout({ children }) {

&nbsp; return (

&nbsp;   <div className="flex min-h-screen">

&nbsp;     <aside className="w-64 border-r">MediaHive Admin</aside>

&nbsp;     <main className="flex-1 p-6">{children}</main>

&nbsp;   </div>

&nbsp; );

}



resources/prisma-schema.tpl

model User {

&nbsp; id    String @id @default(cuid())

&nbsp; email String @unique

&nbsp; role  Role   @relation(fields: \[roleId], references: \[id])

&nbsp; roleId String

}



model Role {

&nbsp; id   String @id @default(cuid())

&nbsp; name String @unique

}



