Title:

chore: finalize clean branch — reapply fixes, remove secrets, add CI secret handling


Body:

Summary
-------
This PR is built from a clean base and re-applies the recent finalize-v1 work without leaking secrets.

What I changed
--------------
- Restored UI & infra fixes previously developed on feat/finalize-v1-files (UI pages, firebase admin helpers, E2E helpers).
- Removed `service-account.json` from repository and added it to `.gitignore`.
- Added SECURITY.md and local guidance for key rotation and secret handling.
- Added CI helper to safely decode FIREBASE_ADMIN_SA at runtime in GitHub Actions.
- Added a GitHub Action (antigravity-quoder-native-repair) to reproduce the native-repair + build + test sequence in CI.

Security notes (must-read)
--------------------------
- The previously committed service account key has been rotated locally. If you have not yet rotated keys, please revoke the leaked key in Google Cloud Console and create a new one.
- Do NOT add service-account JSON to the repo. Add the JSON base64 to GitHub Secrets (FIREBASE_ADMIN_SA) or provision a file at the runner and set FIREBASE_ADMIN_SA_PATH.
- CI uses a short-lived file created at runtime only.

How to verify locally
---------------------
1. Place your service account JSON outside the repo, e.g. `~/secrets/service-account.json`.
2. Export env: `export FIREBASE_ADMIN_SA_PATH=~/secrets/service-account.json` (or base64 to FIREBASE_ADMIN_SA).
3. `npm ci && npm run build && npx jest` and `npm run dev` to run locally.
4. For E2E: create test user (smoke@test.local/Pass123) or ensure service account has Firebase admin permissions and run `npm run auth:gen` then `npm run test:e2e`.

Next steps
----------
- Reviewer: Verify no secrets in changed files.
- Ops: Add the new base64 `FIREBASE_ADMIN_SA` secret to repository secrets or mount the JSON to runner and set `FIREBASE_ADMIN_SA_PATH`.
- Merge: After merge, ensure the old branch with leaked commit is removed from remote (we can help with that).
