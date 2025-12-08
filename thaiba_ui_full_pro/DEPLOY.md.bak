# DEPLOY.md — Thaiba Garden Media Manager

## Overview
This file contains the recommended deployment flows (Vercel and Docker) for production.

---

## Vercel (recommended for Next.js)
1. Create a Vercel project and link the repo.
2. Set Environment Variables (Vercel Dashboard > Project > Settings > Environment Variables):
   - NEXT_PUBLIC_BASE_URL=https://yourdomain.com
   - FIREBASE_ADMIN_SA (base64) OR FIREBASE_ADMIN_SA_PATH (if using secret file)
   - Other secrets: DB_URL, NEXTAUTH_SECRET, etc.
3. Build command: `npm ci && npm run build`
4. Output directory: (Next handles this automatically)
5. Deploy and check logs.

## Docker (self-hosted)
1. Build:
   ```bash
   docker build -t thaiba-media-manager:latest .
   ```

2. Run (example):
   ```bash
   docker run -d -p 3000:3000 \
     -e NODE_ENV=production \
     -e FIREBASE_ADMIN_SA_PATH=/secrets/service-account.json \
     -v /path/to/service-account.json:/secrets/service-account.json:ro \
     --name thaiba-media-manager thaiba-media-manager:latest
   ```

3. Use a reverse proxy (nginx / Traefik) with TLS. Monitor logs with `docker logs -f`.

## Post-deploy checks
- **Health endpoint**: `GET /api/health/ready`
- **Playwright smoke route**: run smoke tests in the deployment staging environment
- **Notifications**: send a test FCM message to verify FCM server key
