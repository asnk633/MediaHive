#!/usr/bin/env bash
set -euo pipefail
echo "[ci/ensure-pnpm-lock] checking for pnpm-lock.yaml"
if [ -f pnpm-lock.yaml ]; then
  echo "[ci/ensure-pnpm-lock] pnpm-lock.yaml found – nothing to do"
  exit 0
fi
echo "[ci/ensure-pnpm-lock] pnpm-lock.yaml not found — creating lockfile (CI-safe mode)"
# Use npx pnpm if pnpm not globally present
PNPM_CMD="$(command -v pnpm || true)"
if [ -z "$PNPM_CMD" ]; then
  echo "[ci/ensure-pnpm-lock] pnpm not in PATH — using npx pnpm"
  PNPM_CMD="npx pnpm"
fi
# create lockfile only (no install of node_modules)
$PNPM_CMD install --lockfile-only --no-frozen-lockfile --no-prefer-frozen-lockfile
echo "[ci/ensure-pnpm-lock] Created pnpm-lock.yaml"