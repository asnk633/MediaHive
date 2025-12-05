# Tailwind v4 Migration Notes

This project has been migrated to Tailwind CSS v4.

## Key Changes

1.  **Dependencies**:
    - `tailwindcss` updated to v4.
    - `postcss` and `autoprefixer` updated.
    - `@tailwindcss/postcss` installed.

2.  **Configuration**:
    - `postcss.config.mjs` now uses `@tailwindcss/postcss`.
    - `tailwind.config.ts` is still supported via the plugin but v4 encourages CSS-first configuration.
    - `src/app/globals.css` uses `@import "tailwindcss";` instead of `@tailwind` directives.

## Verification

- The application has been built and tested with v4.
- If you encounter CSS issues, check `globals.css` and ensure custom tokens are correctly applied.
- Refer to the official [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide) for more details.
