#!/bin/bash

# scripts/verify-m9-security.sh
# Verification script for Phase M9 Security Hardening & Compliance

echo "=== Phase M9 Security Verification ==="
echo

# Check if required files exist
echo "1. Checking for required security files..."
REQUIRED_FILES=(
  "src/lib/env-validator.ts"
  "src/lib/validation.ts"
  "src/lib/sanitizer.ts"
  "src/app/api/_lib/session.ts"
  "src/app/api/_lib/rate-limiter.ts"
  "src/app/api/_lib/rbac.ts"
  "src/app/api/admin/audit/route.ts"
  "SECURITY.md"
  "M9_README.md"
  "M9_IMPLEMENTATION_SUMMARY.md"
  ".github/dependabot.yml"
  "drizzle/0004_add_audit_log_tenant_id.sql"
)

MISSING_FILES=()
for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    MISSING_FILES+=("$file")
    echo "  ✗ Missing: $file"
  else
    echo "  ✓ Found: $file"
  fi
done

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
  echo "  All required files present"
else
  echo "  Error: ${#MISSING_FILES[@]} files missing"
  exit 1
fi

echo

# Check for security-related environment variables in .env.example
echo "2. Checking .env.example for security variables..."
SECURITY_VARS=(
  "APP_SECRET"
  "SESSION_MAX_AGE"
  "REFRESH_TOKEN_MAX_AGE"
  "RATE_LIMIT_WINDOW"
  "RATE_LIMIT_MAX"
)

MISSING_VARS=()
for var in "${SECURITY_VARS[@]}"; do
  if grep -q "^$var=" .env.example; then
    echo "  ✓ Found: $var"
  else
    MISSING_VARS+=("$var")
    echo "  ✗ Missing: $var"
  fi
done

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
  echo "  All security environment variables present"
else
  echo "  Warning: ${#MISSING_VARS[@]} security variables missing from .env.example"
fi

echo

# Check for security headers in session management
echo "3. Checking session security implementation..."
if grep -q "httpOnly: true" src/app/api/_lib/session.ts; then
  echo "  ✓ HttpOnly cookies enabled"
else
  echo "  ✗ HttpOnly cookies not found"
fi

if grep -q "secure: process.env.NODE_ENV === 'production'" src/app/api/_lib/session.ts; then
  echo "  ✓ Secure cookies in production"
else
  echo "  ✗ Secure cookies configuration not found"
fi

if grep -q "sameSite: 'strict'" src/app/api/_lib/session.ts; then
  echo "  ✓ SameSite cookies enabled"
else
  echo "  ✗ SameSite cookies not found"
fi

echo

# Check for rate limiting implementation
echo "4. Checking rate limiting implementation..."
if grep -q "rate-limiter-flexible" package.json; then
  echo "  ✓ rate-limiter-flexible dependency found"
else
  echo "  ✗ rate-limiter-flexible dependency not found"
fi

if grep -q "rateLimitMiddleware" src/app/api/auth/login/route.ts; then
  echo "  ✓ Rate limiting implemented on login endpoint"
else
  echo "  ✗ Rate limiting not found on login endpoint"
fi

echo

# Check for input validation
echo "5. Checking input validation implementation..."
if grep -q "validateSchema" src/app/api/users/route.ts; then
  echo "  ✓ Zod validation implemented on users endpoint"
else
  echo "  ✗ Zod validation not found on users endpoint"
fi

if grep -q "validateSchema" src/app/api/tasks/route.ts; then
  echo "  ✓ Zod validation implemented on tasks endpoint"
else
  echo "  ✗ Zod validation not found on tasks endpoint"
fi

echo

# Check for sanitization
echo "6. Checking sanitization implementation..."
if grep -q "sanitizeHtmlContent\|sanitizeTextContent" src/app/api/users/route.ts; then
  echo "  ✓ HTML/Text sanitization implemented"
else
  echo "  ✗ HTML/Text sanitization not found"
fi

echo

# Check for RBAC protection
echo "7. Checking RBAC protection..."
if grep -q "authorizeByPermission\|authorizeByRole" src/app/api/users/route.ts; then
  echo "  ✓ RBAC protection implemented on users endpoint"
else
  echo "  ✗ RBAC protection not found on users endpoint"
fi

if grep -q "authorizeByPermission\|authorizeByRole" src/app/api/admin/audit/route.ts; then
  echo "  ✓ RBAC protection implemented on admin audit endpoint"
else
  echo "  ✗ RBAC protection not found on admin audit endpoint"
fi

echo

# Check for audit log implementation
echo "8. Checking audit log implementation..."
if grep -q "auditLog.*tenantId" src/db/schema.ts; then
  echo "  ✓ Audit log table includes tenant isolation"
else
  echo "  ✗ Audit log table missing tenant isolation"
fi

echo

# Check for CI security steps
echo "9. Checking CI security implementation..."
if grep -q "npm audit" .github/workflows/playwright-e2e.yml; then
  echo "  ✓ npm audit step in CI pipeline"
else
  echo "  ✗ npm audit step not found in CI pipeline"
fi

if [ -f ".github/dependabot.yml" ]; then
  echo "  ✓ Dependabot configuration present"
else
  echo "  ✗ Dependabot configuration missing"
fi

echo

# Check for security documentation
echo "10. Checking security documentation..."
if [ -f "SECURITY.md" ]; then
  echo "  ✓ SECURITY.md documentation present"
else
  echo "  ✗ SECURITY.md documentation missing"
fi

if [ -f "M9_README.md" ]; then
  echo "  ✓ M9_README.md documentation present"
else
  echo "  ✗ M9_README.md documentation missing"
fi

echo

echo "=== Verification Complete ==="
echo
echo "Summary:"
echo "  - Files checked: ${#REQUIRED_FILES[@]}"
echo "  - Security variables checked: ${#SECURITY_VARS[@]}"
echo "  - Implementation checks: 10"
echo
echo "Next steps:"
echo "  - Run 'npm audit' to check for dependency vulnerabilities"
echo "  - Review SECURITY.md for vulnerability reporting process"
echo "  - Test RBAC functionality with different user roles"
echo "  - Verify audit log functionality with admin user"