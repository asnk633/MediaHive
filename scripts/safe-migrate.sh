#!/usr/bin/env bash
echo "🔒 Safe migration starting..."
touch .migration-lock
npm run db:backup
npm run db:migrate
rm .migration-lock
echo "✅ Migration complete"