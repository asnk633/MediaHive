PR title: feat(ui): redesign scaffold — Mixed Premium Hybrid (non-destructive)

Description (paste):

Summary:
- Adds a non-destructive UI redesign scaffold under src/app/(redesign)
- Introduces design-system tokens, base styles
- Adds accessible FAB component with role-based quick actions
- Adds BottomNav visual component with 6 items and FAB spacer
- Adds PageContainer wrapper and two example pages (home, downloads)
- Feature-flag enabled at runtime via NEXT_PUBLIC_NEW_UI

How to test locally:
1. git checkout ui/2025-redesign-framework
2. NEXT_PUBLIC_NEW_UI=true npm run dev
3. Visit the app; navigate to redesigned pages (/(redesign)/home ...)

Notes:
- This PR only *adds* new UI files. No existing routes, APIs, or DB migration modified.
- Please run a visual QA (screenshots) and keyboard navigation smoke test.

Files of interest:
- src/design-system/*
- src/client/components/FAB.tsx
- src/components/ui/BottomNav.tsx
- src/components/ui/PageContainer.tsx
- src/app/(redesign)/*

Requested reviewers:
- UI designer (visual signoff)
- Frontend dev (accessibility & performance)

Checklist for reviewer:

 NEXT_PUBLIC_NEW_UI=true npm run dev launches without errors

 FAB visible, opens via click, closes via Esc

 BottomNav shows 6 items and is centered

 No console runtime errors on load

 Linter passes

 a11y quick check: keyboard focus reaches FAB menu items

 Visual approval from design owner

Extra QA Smoke Checklist:

 Build: npm run build — passes.

 Dev run: NEXT_PUBLIC_NEW_UI=true npm run dev — page loads.

 Visual: Home, Tasks, Events, Reports, Downloads, Profile exist under /(redesign) group.

 FAB: opens, menu items route correctly (/notifications/new, /events/new, /tasks/new).

 BottomNav: 6 items; clicking routes to appropriate route.

 No console errors/warnings related to hydration or refs.

 Playwright smoke tests (provided) pass.