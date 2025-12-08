## Summary
- Fix native ABI mismatch (rebuild/ci-native-repair scripts)
- Add Antigravity + Quoder CI helpers for native repairs
- Harden Playwright e2e: single worker, retries, networkidle, trace on fail
- Add auth storage-state generation and seed route for local CI
- Add fallback firebase-admin file path loader (FIREBASE_ADMIN_SA_PATH)

## How to verify locally
1. npm ci
2. npm run dev
3. generate storage state:
   BASE_URL='http://127.0.0.1:3000' E2E_TEST_EMAIL='smoke@test.local' E2E_TEST_PW='Pass123' node scripts/generateStorageState.js
4. npx cross-env BASE_URL='http://127.0.0.1:3000' npx playwright test --project=chromium --workers=1 --retries=2 --trace on

## Files changed (high level)
- .github/workflows/antigravity-quoder-native-repair.yml
- scripts/ci-native-repair.* (sh/ps1)
- scripts/generateStorageState.js
- scripts/seed-e2e-user.js
- src/lib/firebaseAdmin.ts (supports FIREBASE_ADMIN_SA_PATH)
- playwright.config.ts updates

## Checklist before merge
- [ ] `FIREBASE_ADMIN_SA_PATH` / service-account.json added in CI secrets (do not commit)
- [ ] Confirm Playwright checks pass on CI (traces uploaded)
- [ ] Review native repair script for platform specifics
- [ ] Reviewer ran local e2e once or reviewed trace artifacts

## Notes
- If CI fails due to missing service account permissions: ensure IAM role includes `Firebase Authentication Admin` or equivalent.
- Tailwind v4 migration planned in a follow-up PR to avoid large refactor in this release.
