#!/bin/bash
# Wrapper script to run Lighthouse audit and save results

set -e

if [ "$#" -lt 3 ]; then
  echo "Usage: $0 <url> <output-html> <output-json>"
  exit 1
fi

URL="$1"
OUTPUT_HTML="$2"
OUTPUT_JSON="$3"

echo "Running Lighthouse audit for $URL"

# Check if Chrome/Chromium is available
if ! command -v google-chrome &> /dev/null && ! command -v chromium &> /dev/null && ! command -v chrome &> /dev/null; then
  echo "Error: Chrome/Chromium not found. Please install Chrome or Chromium to run Lighthouse audits."
  echo "Installation options:"
  echo "  Ubuntu/Debian: sudo apt-get install chromium-browser"
  echo "  macOS: brew install --cask chromium"
  echo "  Windows: Download Chrome from https://www.google.com/chrome/"
  exit 1
fi

# Run Lighthouse with both HTML and JSON output
npx lighthouse "$URL" \
  --output html,json \
  --output-path "$OUTPUT_HTML,$OUTPUT_JSON" \
  --chrome-flags="--headless" \
  --quiet \
  --only-categories=performance,accessibility,best-practices,seo

echo "Lighthouse audit complete"
echo "HTML report saved to: $OUTPUT_HTML"
echo "JSON report saved to: $OUTPUT_JSON"