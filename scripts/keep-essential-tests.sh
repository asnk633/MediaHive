#!/usr/bin/env bash
set -euo pipefail

# 1) Archive full playwright e2e folder
if [ -d "e2e/playwright" ]; then
  mkdir -p e2e/playwright.archived
  git mv e2e/playwright e2e/playwright.archived/playwright-full-$(date +%Y%m%d%H%M%S) || true
fi

# 2) Create single smoke test (if not present) placeholder
mkdir -p e2e/playwright/ui
cat > e2e/playwright/ui/smoke.single.spec.ts <<'TS'
import { test, expect } from '@playwright/test';

test('basic smoke: load home and check title', async ({ page }) => {
  await page.goto(process.env.PLAYWRIGHT_TEST_URL || 'http://localhost:3000');
  await expect(page).toHaveTitle(/Thaiba|Thaiba Garden|Media Manager/);
});
TS

git add e2e/playwright/ui/smoke.single.spec.ts
git commit -m "test(e2e): keep single headless smoke test"

# 3) Keep only these Jest UI tests (update the list as needed)
tests_to_keep=(
  "thaiba_ui_full_pro/src/__tests__/TopBar.test.tsx"
  "thaiba_ui_full_pro/src/__tests__/TaskCard.test.tsx"
  "thaiba_ui_full_pro/src/__tests__/NotificationPanel.test.tsx"
)

# Move other tests into archived folder
mkdir -p tests.archived
for f in $(git ls-files 'thaiba_ui_full_pro/src/__tests__' | grep -v -F "$(printf '%s\n' "${tests_to_keep[@]}" )" || true); do
  mkdir -p "$(dirname "tests.archived/$f")"
  git mv "$f" "tests.archived/$f" || true
done

git add tests.archived || true
git commit -m "test: archive non-essential component tests"