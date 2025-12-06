# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

Please report sensitive security issues via email to [security@example.com](mailto:security@yourdomain.com) (replace with actual contact). Do not open public GitHub issues for potential data leaks or critical vulnerabilities.

## Secret Management & Rotation Policy

1.  **Storage**: Secrets (API keys, Service Accounts) must NEVER be committed to the repository.
    *   Use `.env` files (added to `.gitignore`).
    *   Use GitHub Actions Secrets for CI/CD.
2.  **Rotation**:
    *   **Routine**: Rotate keys every 90 days.
    *   **Emergency**: If a key is committed or exposed (e.g., in logs), Revoke it IMMEDIATELY in the provider console (Google Cloud Console, Firebase Console, etc.) and generate a new one.
3.  **Service Accounts**:
    *   Download JSON keys only when necessary.
    *   Store them in a secure `secrets/` directory (ignored by git) or use environment variables (`FIREBASE_ADMIN_SA_PATH`).
