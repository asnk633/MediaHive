#!/bin/bash
# scripts/run-e2e-isolated.sh
# Script to run E2E tests with isolated test data

set -e

echo "Starting isolated E2E test run..."

# Generate a unique test run ID
TEST_RUN_ID="test-run-$(date +%s)-$$"
echo "Test run ID: $TEST_RUN_ID"

# Start the development server in the background
echo "Starting development server..."
npm run dev > dev-server.log 2>&1 &
SERVER_PID=$!

# Wait for the server to be ready
echo "Waiting for server to be ready..."
npx wait-on http://localhost:3000 --timeout 60000

# Run Playwright tests with the test run ID
echo "Running Playwright tests..."
TEST_RUN_ID=$TEST_RUN_ID npx playwright test

# Capture the exit code
EXIT_CODE=$?

# Stop the development server
echo "Stopping development server..."
kill $SERVER_PID

# Cleanup test data
echo "Cleaning up test data..."
# In a real implementation, you would call the cleanup endpoint here
# curl -X DELETE "http://localhost:3000/api/test-utils/cleanup?runId=$TEST_RUN_ID"

# Exit with the same code as the tests
exit $EXIT_CODE