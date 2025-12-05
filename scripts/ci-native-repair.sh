#!/usr/bin/env bash
set -euo pipefail
echo "CI native repair fallback starting..."
echo "Writing native-rebuild.log"

LOG=native-rebuild.log
echo "=== CI native repair run: $(date -u) ===" > "$LOG"
echo "node: $(node -v)" >> "$LOG"
echo "process.modules: $(node -p 'process.versions.modules')" >> "$LOG"
echo "" >> "$LOG"

echo "Listing .node binaries (if any)..." >> "$LOG"
if command -v find >/dev/null 2>&1; then
  find node_modules -type f -name '*.node' -print >> "$LOG" || true
else
  # GitHub Windows runner: use PowerShell fallback
  powershell -NoProfile -Command "Get-ChildItem -Recurse -Filter '*.node' -ErrorAction SilentlyContinue | ForEach-Object { \$_.FullName }" >> "$LOG" || true
fi
echo "" >> "$LOG"

echo "Attempting npm rebuild (global)..." >> "$LOG"
npm rebuild >> "$LOG" 2>&1 || echo "npm rebuild global failed" >> "$LOG"

# Targeted rebuilds for common native modules
PKGS=(better-sqlite3 sqlite3 sharp node-sass)
for P in "${PKGS[@]}"; do
  if [ -d "node_modules/$P" ]; then
    echo "Rebuilding $P (build-from-source)..." >> "$LOG"
    npm rebuild "$P" --build-from-source >> "$LOG" 2>&1 || echo "rebuild $P failed" >> "$LOG"
  else
    echo "$P not present; skipping" >> "$LOG"
  fi
done

# If ABI errors remain, do a fresh install
if grep -q -E "ERR_DLOPEN_FAILED|compiled against a different Node.js version|Module did not self-register" "$LOG" 2>/dev/null || true; then
  echo "Detected ABI errors in log; performing clean reinstall..." >> "$LOG"
  rm -rf node_modules
  npm ci --no-audit --prefer-offline >> "$LOG" 2>&1 || echo "npm ci failed" >> "$LOG"
else
  echo "No ABI errors detected; skipping full reinstall." >> "$LOG"
fi

echo "Attempting a final (quick) require check for better-sqlite3 and sharp" >> "$LOG"
node -e "try{require('better-sqlite3'); console.log('better-sqlite3 OK')}catch(e){ console.error('better-sqlite3 require failed: ' + e.message); }" >> "$LOG" 2>&1 || true
node -e "try{require('sharp'); console.log('sharp OK')}catch(e){ console.error('sharp require failed: ' + (e && e.message)); }" >> "$LOG" 2>&1 || true

echo "CI native repair fallback finished." >> "$LOG"
tail -n 120 "$LOG" || true