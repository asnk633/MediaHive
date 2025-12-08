# Dependency Upgrade Notes (2025-12-05)

## Summary
Performed a targeted upgrade of core dependencies to resolve React 19 deprecation warnings ("Accessing element.ref was removed in React 19") and improve stability.

## Upgraded Packages
- **@testing-library/react** & **@testing-library/dom**: Upgraded to latest to support React 18+ and remove deprecation warnings.
- **next**: Upgraded to latest stable.
- **lucide-react**: Upgraded to latest.
- **three**: Upgraded to latest.
- **sharp**: Upgraded to latest.

## Pinned Packages
- **tailwindcss**: Pinned to **v3.4.17**.
    - *Reason*: Upgrading to v4 caused significant build failures due to breaking changes in configuration and CSS processing.
    - *Follow-up*: A dedicated task is required to migrate to Tailwind CSS v4.

## Verification
- `npm ci` succeeds.
- `npm run build` succeeds.
- `npx jest` passes with clean output (no React 19 warnings).
- `npx playwright test` passes.

## Future Work
- Plan Tailwind v4 migration.
- Re-evaluate Next.js major version bumps periodically.
