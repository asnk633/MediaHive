@echo off
REM scripts/verify-m9-security.bat
REM Verification script for Phase M9 Security Hardening & Compliance

echo === Phase M9 Security Verification ===
echo.

REM Check if required files exist
echo 1. Checking for required security files...
set MISSING_COUNT=0

REM Define required files
set REQUIRED_FILES=src/lib/env-validator.ts src/lib/validation.ts src/lib/sanitizer.ts src/app/api/_lib/session.ts src/app/api/_lib/rate-limiter.ts src/app/api/_lib/rbac.ts src/app/api/admin/audit/route.ts SECURITY.md M9_README.md M9_IMPLEMENTATION_SUMMARY.md .github/dependabot.yml drizzle/0004_add_audit_log_tenant_id.sql

REM Check each file
for %%f in (%REQUIRED_FILES%) do (
    if not exist "%%f" (
        echo   x Missing: %%f
        set /a MISSING_COUNT+=1
    ) else (
        echo   v Found: %%f
    )
)

if %MISSING_COUNT%==0 (
    echo   All required files present
) else (
    echo   Error: %MISSING_COUNT% files missing
    exit /b 1
)

echo.

REM Check for security-related environment variables in .env.example
echo 2. Checking .env.example for security variables...
set MISSING_VARS=0

REM Define security variables to check
set SECURITY_VARS=APP_SECRET SESSION_MAX_AGE REFRESH_TOKEN_MAX_AGE RATE_LIMIT_WINDOW RATE_LIMIT_MAX

REM Check each variable
for %%v in (%SECURITY_VARS%) do (
    findstr /C:"%%v=" .env.example >nul
    if errorlevel 1 (
        echo   x Missing: %%v
        set /a MISSING_VARS+=1
    ) else (
        echo   v Found: %%v
    )
)

if %MISSING_VARS%==0 (
    echo   All security environment variables present
) else (
    echo   Warning: %MISSING_VARS% security variables missing from .env.example
)

echo.

REM Check for security headers in session management
echo 3. Checking session security implementation...
findstr /C:"httpOnly: true" src/app/api/_lib/session.ts >nul
if errorlevel 1 (
    echo   x HttpOnly cookies not found
) else (
    echo   v HttpOnly cookies enabled
)

findstr /C:"secure: process.env.NODE_ENV === 'production'" src/app/api/_lib/session.ts >nul
if errorlevel 1 (
    echo   x Secure cookies configuration not found
) else (
    echo   v Secure cookies in production
)

findstr /C:"sameSite: 'strict'" src/app/api/_lib/session.ts >nul
if errorlevel 1 (
    echo   x SameSite cookies not found
) else (
    echo   v SameSite cookies enabled
)

echo.

REM Check for rate limiting implementation
echo 4. Checking rate limiting implementation...
findstr /C:"rate-limiter-flexible" package.json >nul
if errorlevel 1 (
    echo   x rate-limiter-flexible dependency not found
) else (
    echo   v rate-limiter-flexible dependency found
)

findstr /C:"rateLimitMiddleware" src/app/api/auth/login/route.ts >nul
if errorlevel 1 (
    echo   x Rate limiting not found on login endpoint
) else (
    echo   v Rate limiting implemented on login endpoint
)

echo.

REM Check for input validation
echo 5. Checking input validation implementation...
findstr /C:"validateSchema" src/app/api/users/route.ts >nul
if errorlevel 1 (
    echo   x Zod validation not found on users endpoint
) else (
    echo   v Zod validation implemented on users endpoint
)

findstr /C:"validateSchema" src/app/api/tasks/route.ts >nul
if errorlevel 1 (
    echo   x Zod validation not found on tasks endpoint
) else (
    echo   v Zod validation implemented on tasks endpoint
)

echo.

REM Check for sanitization
echo 6. Checking sanitization implementation...
findstr /C:"sanitizeHtmlContent\|sanitizeTextContent" src/app/api/users/route.ts >nul
if errorlevel 1 (
    findstr /C:"sanitizeHtmlContent" src/app/api/users/route.ts >nul
    if errorlevel 1 (
        findstr /C:"sanitizeTextContent" src/app/api/users/route.ts >nul
        if errorlevel 1 (
            echo   x HTML/Text sanitization not found
        ) else (
            echo   v HTML/Text sanitization implemented
        )
    ) else (
        echo   v HTML/Text sanitization implemented
    )
) else (
    echo   v HTML/Text sanitization implemented
)

echo.

REM Check for RBAC protection
echo 7. Checking RBAC protection...
findstr /C:"authorizeByPermission\|authorizeByRole" src/app/api/users/route.ts >nul
if errorlevel 1 (
    echo   x RBAC protection not found on users endpoint
) else (
    echo   v RBAC protection implemented on users endpoint
)

findstr /C:"authorizeByPermission\|authorizeByRole" src/app/api/admin/audit/route.ts >nul
if errorlevel 1 (
    echo   x RBAC protection not found on admin audit endpoint
) else (
    echo   v RBAC protection implemented on admin audit endpoint
)

echo.

REM Check for audit log implementation
echo 8. Checking audit log implementation...
findstr /C:"auditLog.*tenantId" src/db/schema.ts >nul
if errorlevel 1 (
    echo   x Audit log table missing tenant isolation
) else (
    echo   v Audit log table includes tenant isolation
)

echo.

REM Check for CI security steps
echo 9. Checking CI security implementation...
findstr /C:"npm audit" .github/workflows/playwright-e2e.yml >nul
if errorlevel 1 (
    echo   x npm audit step not found in CI pipeline
) else (
    echo   v npm audit step in CI pipeline
)

if exist ".github/dependabot.yml" (
    echo   v Dependabot configuration present
) else (
    echo   x Dependabot configuration missing
)

echo.

REM Check for security documentation
echo 10. Checking security documentation...
if exist "SECURITY.md" (
    echo   v SECURITY.md documentation present
) else (
    echo   x SECURITY.md documentation missing
)

if exist "M9_README.md" (
    echo   v M9_README.md documentation present
) else (
    echo   x M9_README.md documentation missing
)

echo.

echo === Verification Complete ===
echo.
echo Summary:
echo   - Files checked: 15
echo   - Security variables checked: 5
echo   - Implementation checks: 10
echo.
echo Next steps:
echo   - Run 'npm audit' to check for dependency vulnerabilities
echo   - Review SECURITY.md for vulnerability reporting process
echo   - Test RBAC functionality with different user roles
echo   - Verify audit log functionality with admin user