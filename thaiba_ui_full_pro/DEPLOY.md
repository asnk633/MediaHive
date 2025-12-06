# DEPLOY.md — Thaiba Garden Media Manager

This file covers two common deploy targets: Vercel (recommended for Next.js) and Docker (self-hosted).

## 1) Vercel (recommended)
1. Create a new Vercel project and connect your GitHub repo.
2. In Vercel project Settings → Environment Variables:
   - Add `FIREBASE_ADMIN_SA` (base64 encoded) OR add `FIREBASE_ADMIN_SA_PATH` if you can mount a secret file.
   - Add other envs from `.env.local` which are required (API keys, `NEXT_PUBLIC_*`, etc).
3. Build & Output Settings:
   - Framework Preset: Next.js
   - Build command: `npm run build`
   - Output directory: (default)
4. Deploy: Merge PR to main, Vercel will build automatically.

### Notes
- If using base64 secret: add a build hook step to decode at runtime like the Actions workflow above.
- For runtime secrets (server-side), Vercel provides Environment Variables accessible at server runtime.

## 2) Docker (self-hosted)
1. Add `Dockerfile` (example):
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --production
   COPY . .
   ENV NODE_ENV=production
   # Ensure you set FIREBASE_ADMIN_SA_PATH to mounted path or set FIREBASE_ADMIN_SA
   CMD ["node", ".next/server/index.js"]
   ```

2. Build:
   ```bash
   docker build -t thaiba-media-manager:latest .
   ```

3. Run with mounted secret file:
   ```bash
   docker run -d -p 3000:3000 \
     -v /path/to/secrets/service-account.json:/run/secrets/service-account.json:ro \
     -e FIREBASE_ADMIN_SA_PATH=/run/secrets/service-account.json \
     --name thaiba-media-manager \
     thaiba-media-manager:latest
   ```

## 3) Post-deploy checks
- Visit `/api/health` and `/` to verify.
- Ensure server logs show Firebase Admin initialized (or appropriate warning if not configured).
- Run smoke E2E in CI after deploy.
