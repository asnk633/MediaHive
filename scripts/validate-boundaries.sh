#!/bin/bash

# scripts/validate-boundaries.sh
# Script to validate client/server boundaries and code quality

echo "Running TypeScript validation..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo "❌ TypeScript validation failed"
    exit 1
fi
echo "✅ TypeScript validation passed"

echo ""
echo "Running ESLint validation..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ ESLint validation failed"
    exit 1
fi
echo "✅ ESLint validation passed"

echo ""
echo "Running client/server boundary validation..."
node scripts/check-client-server-boundaries.js
if [ $? -ne 0 ]; then
    echo "❌ Client/server boundary validation failed"
    exit 1
fi
echo "✅ Client/server boundary validation passed"

echo ""
echo "🎉 All validations passed!"