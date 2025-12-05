#!/usr/bin/env bash
set -euo pipefail

report=fix-report.txt
echo "React-19 fix run started at: $(date)" > $report

echo "Cleaning node_modules and reinstalling..."
rm -rf node_modules package-lock.json || true
npm ci --silent
echo "npm ci completed at: $(date)" >> $report

if command -v quoder >/dev/null 2>&1; then
  echo "Running Quoder scan..."
  quoder scan --format json > quoder-scan.json || true
  echo "Quoder scan saved to quoder-scan.json" >> $report
else
  echo "Quoder not found in PATH" >> $report
fi

if command -v antigravity >/dev/null 2>&1; then
  echo "Running Antigravity diagnostics..."
  antigravity diagnose --output antigravity-diagnose.txt || true
  echo "Antigravity diagnose saved to antigravity-diagnose.txt" >> $report
else
  echo "Antigravity not found in PATH" >> $report
fi

echo "Running unit tests (baseline)..."
npm test --silent || echo "Unit tests failed (pre-change)" >> $report
echo "Pre-change tests done at: $(date)" >> $report

echo "Running createRoot codemod..."
npx jscodeshift -t https://raw.githubusercontent.com/reactjs/react-codemod/master/transforms/replace-render-with-create-root.js src || true
echo "Ran createRoot codemod" >> $report

echo "Searching for ReactDOM.render..."
(git grep -n "ReactDOM.render" || echo "none") >> $report

echo "Checking outdated packages..."
npm outdated --long > npm-outdated.txt || true
echo "npm outdated saved to npm-outdated.txt" >> $report

echo "Running unit tests (post-codemod)..."
npm test --silent || echo "Unit tests failed (post-change)" >> $report
echo "Post-change tests done at: $(date)" >> $report

if [ -x ./node_modules/.bin/playwright ] || command -v playwright >/dev/null 2>&1; then
  echo "Running Playwright tests..."
  npx playwright test --reporter=list || echo "Playwright failed"
  echo "Playwright executed at: $(date)" >> $report
else
  echo "Playwright not installed locally" >> $report
fi

echo "React-19 fix script finished. See $report"
