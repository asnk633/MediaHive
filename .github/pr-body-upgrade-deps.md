### Summary
This PR upgrades several dependencies to resolve React 19 deprecation warnings and keep dev/test flows stable.

#### Changed
- Upgraded: @testing-library/react, @testing-library/dom, next, lucide-react, three, sharp
- Pinned: tailwindcss → v3.4.17 (reverted from v4 due to breaking changes)
- Adjusted PostCSS / next config files to match the chosen Tailwind version
- Fixed TypeScript signature issues in a few route handlers (compatibility with chosen Next.js)
- Added temporary/temporary-safe shims where needed to keep tests green

#### Verification
- `npm ci` ✅
- `npm run build` ✅
- `npx jest` ✅ (clean output)
- `npx playwright test` ✅

#### Notes & follow-ups
1. Tailwind: kept at v3.4.17 to avoid large migration work. Plan a dedicated Tailwind v4 migration later.
2. If we want to jump to the absolute latest Next.js/Tailwind in future, do it in a separate PR and allocate time for UI/CSS fixes.
3. Quoder scan results attached; Antigravity CLI not present (we used Qoder for static diagnostics).
