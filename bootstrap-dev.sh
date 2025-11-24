#!/usr/bin/env bash
set -euo pipefail

# -----------------------------------------
#  CONFIG (from your uploaded session paths)
# -----------------------------------------
INDEX_FILE_URL="file:///mnt/data/index.ts"
SCHEMA_FILE_URL="file:///mnt/data/schema.ts"
SEED_FILE_URL="file:///mnt/data/seed.ts"

REPO_ROOT="$(pwd)"

echo "=== Thaiba Garden: Automated Local Bootstrap (Bash/WSL Version) ==="

# -----------------------------------------
# 1) Kill locking processes
# -----------------------------------------
echo "[1/11] Killing Node/npm/VSC processes that may lock node_modules..."

pkill -f node     2>/dev/null || true
pkill -f npm      2>/dev/null || true
pkill -f pnpm     2>/dev/null || true
pkill -f yarn     2>/dev/null || true
pkill -f playwright 2>/dev/null || true
pkill -f code     2>/dev/null || true # VSCode

sleep 1

# -----------------------------------------
# 2) Remove node_modules + lockfile
# -----------------------------------------
echo "[2/11] Removing existing node_modules and package-lock.json..."

if [ -d node_modules ]; then
  rm -rf node_modules || {
    echo "⚠️  Failed to remove node_modules. Check permissions or close apps."
    exit 2
  }
fi

[ -f package-lock.json ] && rm -f package-lock.json

npm cache verify || npm cache clean --force || true

# -----------------------------------------
# 3) Install dependencies
# -----------------------------------------
echo "[3/11] Running npm install..."
npm install --no-audit || {
  echo "npm install failed. Fix environment and retry."
  exit 3
}

# -----------------------------------------
# 4) Install dev tools (ts-node, playwright, drizzle-kit)
# -----------------------------------------
echo "[4/11] Installing dev tools..."
npm install -D ts-node tsconfig-paths typescript drizzle-kit @playwright/test playwright

# -----------------------------------------
# 5) Install Playwright browsers
# -----------------------------------------
echo "[5/11] Installing Playwright browsers..."
npx playwright install || true

# -----------------------------------------
# 6) Ensure .env.local exists
# -----------------------------------------
echo "[6/11] Checking environment file..."

if [ ! -f .env.local ]; then
  echo "Creating minimal .env.local..."
  cat <<EOF > .env.local
DATABASE_URL="file:./dev.db"
APP_SECRET="replace_with_a_long_random_secret"
NODE_ENV=development
PORT=3001
EOF
else
  echo ".env.local already exists — keeping it."
fi

# -----------------------------------------
# 7) Run Drizzle migrations
# -----------------------------------------
echo "[7/11] Running Drizzle migrations..."

# Try both TS/JS config locations safely:
npx drizzle-kit migrate --yes 2>/dev/null \
  || npx drizzle-kit migrate --config ./drizzle.config.ts --yes 2>/dev/null \
  || npx drizzle-kit migrate --config ./drizzle.config.mjs --yes 2>/dev/null \
  || echo "⚠️ drizzle migration command failed — check drizzle.config.ts"

# -----------------------------------------
# 8) Seed the database
# -----------------------------------------
echo "[8/11] Running seed script..."

npx ts-node -r tsconfig-paths/register --transpile-only src/db/seed.ts \
  || echo "⚠️ seed script returned an error — inspect src/db/seed.ts"

# -----------------------------------------
# 9) Start dev server (background)
# -----------------------------------------
echo "[9/11] Starting dev server in background..."

LOGFILE="${REPO_ROOT}/dev-server.log"

# Kill any running Next server
pkill -f "next dev" 2>/dev/null || true

PORT=3001 nohup npm run dev > "$LOGFILE" 2>&1 &
sleep 3

# -----------------------------------------
# 10) Wait for health check endpoint
# -----------------------------------------
echo "[10/11] Waiting for server health endpoint..."

HEALTH_URL="http://localhost:3001/api/health"

for i in {1..30}; do
  if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
    echo "✓ Health OK"
    break
  fi
  sleep 2
done

if ! curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
  echo "❌ Server failed to start; see dev-server.log for details:"
  tail -n 80 "$LOGFILE"
  exit 4
fi

# -----------------------------------------
# 11) Run Playwright tests
# -----------------------------------------
echo "[11/11] Running Playwright tests..."

BASE_URL="http://localhost:3001" \
npx playwright test --project=chromium --reporter=list || {
  echo "⚠️ Playwright tests failed"
  exit 5
}

echo "=== Bootstrap completed successfully ==="
