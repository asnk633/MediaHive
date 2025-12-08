# DEPLOY.md

This file contains production deployment steps for Vercel and Docker (repeat of earlier but committed to repo).

## Vercel (recommended)
- Add repository to Vercel and set environment variables in project settings.
- Required envs: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, NEXT_PUBLIC_FIREBASE_APP_ID, FIREBASE_ADMIN_SA (base64).
- Vercel will run `npm ci` and `npm run build`. Ensure playback/Playwright checks run in CI.

## Docker (self-hosted)
- Build container: `docker build -t thaiba-media-manager:1.0.0 .`
- Run with secrets passed via env or secret store. Example:
  `docker run -p 3000:3000 -e NEXT_PUBLIC_FIREBASE_API_KEY=... -e FIREBASE_ADMIN_SA=... thaiba-media-manager:1.0.0`

## Healthchecks
- Add a simple `/api/health` route that returns 200. Use this for load balancer checks.
