---

name: deploying-mediavhive-platform

description: Deploys the MediaHive platform using Docker, CI pipelines, and cloud hosting. Use when the user asks to deploy MediaHive, add Docker support, configure GitHub Actions, set up production hosting, or prepare infrastructure for release.

---



\# MediaHive Deployment Skill



\## When to use this skill

\- "Deploy MediaHive to production"

\- "Dockerize the MediaHive app"

\- "Add CI/CD for MediaHive"

\- "Host MediaHive on VPS"

\- "Prepare for launch"

\- "Create GitHub Actions pipeline"



---



\## Scope



Creates:



\- Dockerfile + docker-compose

\- Production build targets

\- Environment variable schema

\- CI pipeline (GitHub Actions)

\- Health checks

\- Hosting docs

\- Reverse proxy config

\- Database service

\- Deployment scripts



Targets:



\- Docker + Compose

\- GitHub Actions

\- VPS / cloud servers

\- Fly.io / Railway / DigitalOcean

\- AWS Lightsail

\- Nginx reverse proxy

\- PostgreSQL



---



\## Preconditions



\- App scaffolding completed

\- package.json exists

\- Build works locally

\- No failing tests

\- Git repo clean



---



\## Workflow



\### Checklist



```markdown

\- \[ ] Detect framework

\- \[ ] Verify build command

\- \[ ] Add Dockerfile

\- \[ ] Add docker-compose.yml

\- \[ ] Define env schema

\- \[ ] Add health endpoint

\- \[ ] Create CI pipeline

\- \[ ] Add Nginx config

\- \[ ] Test container locally

\- \[ ] Push pipeline


---

Plan



List:



Files to be added



Services created



Secrets required



Hosting target



Abort if build fails.



Validate

npm run build

npm run typecheck || true



Execute

docker compose up --build



Instructions

1\. Dockerfile Rules



Use multi-stage builds:



deps



builder



runner



Expose:



PORT=3000



Must:



run as non-root



copy only build output



respect env vars



2\. docker-compose.yml



Include:



web



db



nginx (optional)



Use named volumes.



3\. Env Schema



Create .env.example:



DATABASE\_URL



AUTH\_SECRET



NEXTAUTH\_URL



STORAGE\_BUCKET



SMTP\_HOST



SMTP\_PASS



Never commit .env.



4\. CI Pipeline



GitHub Actions:



install



lint



test



build



docker build



push image



Abort pipeline on failure.



5\. Health Check



Expose:



/api/health



Return:



{ "status": "ok" }



6\. Hosting Defaults



Prefer:



Fly.io



Railway



DigitalOcean Droplet



AWS Lightsail



Document:



DNS



SSL



backups



rollbacks



7\. Rollback Strategy



Tag images



Keep last 3



docker compose pull \&\& docker compose up -d



8\. Security



Require:



HTTPS



secret rotation



firewall rules



DB not public



audit logs



Resources



scripts/



resources/



Supporting Files

scripts/dockerize.sh

\#!/usr/bin/env bash

set -e



echo "Adding Docker files..."



cp resources/Dockerfile.tpl Dockerfile

cp resources/docker-compose.yml.tpl docker-compose.yml

cp resources/nginx.conf.tpl nginx.conf



touch .env.example



resources/Dockerfile.tpl

FROM node:20-alpine AS deps

WORKDIR /app

COPY package\*.json ./

RUN npm ci



FROM node:20-alpine AS builder

WORKDIR /app

COPY . .

COPY --from=deps /app/node\_modules ./node\_modules

RUN npm run build



FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE\_ENV=production

RUN addgroup -g 1001 nodejs \&\& adduser -u 1001 -G nodejs -D nextjs

USER nextjs

COPY --from=builder /app ./

EXPOSE 3000

CMD \["npm","start"]



resources/docker-compose.yml.tpl

version: "3.9"



services:

&nbsp; web:

&nbsp;   build: .

&nbsp;   env\_file: .env

&nbsp;   ports:

&nbsp;     - "3000:3000"

&nbsp;   depends\_on:

&nbsp;     - db



&nbsp; db:

&nbsp;   image: postgres:16

&nbsp;   restart: always

&nbsp;   environment:

&nbsp;     POSTGRES\_PASSWORD: mediavhive

&nbsp;     POSTGRES\_DB: mediavhive

&nbsp;   volumes:

&nbsp;     - pgdata:/var/lib/postgresql/data



volumes:

&nbsp; pgdata:



resources/nginx.conf.tpl

server {

&nbsp; listen 80;



&nbsp; location / {

&nbsp;   proxy\_pass http://web:3000;

&nbsp;   proxy\_set\_header Host $host;

&nbsp;   proxy\_set\_header X-Forwarded-For $proxy\_add\_x\_forwarded\_for;

&nbsp; }

}



resources/github-actions.yml.tpl

name: MediaHive CI



on:

&nbsp; push:

&nbsp;   branches: \[main]



jobs:

&nbsp; build:

&nbsp;   runs-on: ubuntu-latest



&nbsp;   steps:

&nbsp;     - uses: actions/checkout@v4



&nbsp;     - uses: actions/setup-node@v4

&nbsp;       with:

&nbsp;         node-version: 20



&nbsp;     - run: npm ci

&nbsp;     - run: npm run lint

&nbsp;     - run: npm run build



&nbsp;     - name: Docker Build

&nbsp;       run: docker build -t mediavhive:latest .

