# Security Policy

## Supported Versions

We currently support the following versions of Thaiba Garden Media Manager with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in Thaiba Garden Media Manager, please follow these steps:

1. **Do not** create a public GitHub issue for the vulnerability.
2. Send an email to our security team at security@thaibagarden.org with the following information:
   - Description of the vulnerability
   - Steps to reproduce the vulnerability
   - Potential impact of the vulnerability
   - Any possible mitigations you've identified
3. Our security team will acknowledge your report within 48 hours.
4. We will investigate the vulnerability and respond with our assessment within 5 business days.
5. If the vulnerability is accepted, we will work on a fix and release it as soon as possible.
6. We will credit you in our release notes unless you request to remain anonymous.

## Security Measures

### Authentication & Authorization
- JWT-based authentication with access and refresh tokens
- Secure session management with HttpOnly, Secure, and SameSite cookie flags
- Role-Based Access Control (RBAC) with granular permissions
- Rate limiting on authentication endpoints

### Data Protection
- All sensitive data is encrypted at rest
- TLS encryption for all data in transit
- Passwords hashed using bcrypt with a cost factor of 12
- Environment variables validation at startup

### Input Validation & Sanitization
- Zod schema validation for all API inputs
- HTML content sanitization using sanitize-html
- URL validation and sanitization
- Text content escaping to prevent XSS attacks

### Audit & Monitoring
- Immutable audit logs for all administrative actions
- Comprehensive logging of security-relevant events
- Real-time monitoring of suspicious activities

### Dependencies
- Regular automated dependency scanning with npm audit
- Automated dependency updates via Dependabot
- Regular security assessments and penetration testing

## Security Hardening Checklist

This project implements the following security hardening measures:

- [x] Secure server sessions with proper cookie flags (HttpOnly, Secure in prod, SameSite)
- [x] Refresh-token/session expiry logic with safe defaults
- [x] Environment variable validation with .env.example and runtime validation
- [x] Input validation with Zod for all API handlers (users, tasks, events, notifications)
- [x] Server-side sanitization for HTML/text output
- [x] IP rate-limiting middleware for auth endpoints
- [x] RBAC middleware audited across APIs with unit tests
- [x] Immutable audit log table/collection and API `/api/admin/audit` (readonly, admin-only)
- [x] npm audit CI step and Dependabot config
- [x] Security documentation

## Contact

For any security-related questions or concerns, please contact:

- Security Team: security@thaibagarden.org
- Lead Developer: lead@thaibagarden.org