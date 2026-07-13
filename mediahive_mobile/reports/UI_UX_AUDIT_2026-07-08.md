# 🐝 MediaHive Flutter App — UI & UX Audit Report

**Scope:** `mediahive_mobile/lib/` (230 Dart files, 11 features)
**Date:** 2026-07-08
**Auditor:** AI Agent (using `ui-ux-pro-max` skill + manual code review)
**Method:** Static review of theme system, navigation, shared widgets, key screens (Dashboard, Login, Tasks, Profile), and quantitative scans (color hardcoding, Semantics coverage, touch target counts)
**Mode:** Read-only audit — no edits made

---

## Executive Summary

MediaHive has a **mature, ambitious design system** — dual themes (FinTech dark gold + Spatial/VisionOS light blue), a custom widget library (`Mh*` components), skeleton loaders, offline awareness, role-adaptive navigation, and a delightful ambient canvas background. The visual direction is premium and distinctive.

However, the audit uncovered **systemic accessibility failures** centered on extremely small text sizes, low-contrast secondary text, and a lack of Dynamic Type support. Several **interaction patterns** (icon-only nav, no ripple feedback on cards, 6-item dock) also fall short of Material/HIG standards. Most issues are **design-token-level and fixable centrally** rather than per-screen.

| Severity | Count |
|----------|-------|
| 🔴 Critical | 4 |
| 🟠 High | 9 |
| 🟡 Medium | 12 |
| 🟢 Low | 7 |

---

## ✅ What's Working Well (Strengths)

1. **Layered theming architecture** — `DesignTokens` → `AppColors` → `ThemeColors` with separate light/dark factories. Proper separation of concerns.
2. **Custom widget library** — `MhButton`, `MhInput`, `MhEmptyState`, `MhSkeleton`, `MhLoading`, `MhOfflineBanner`, `MhRefreshIndicator`, `MhErrorBoundary`. Consistent reuse.
3. **Three-state UI handling** — Tasks screen properly handles loading, empty, and error states with `AnimatedCrossFade` (`tasks_screen.dart:54-69`).
4. **Semantic labels on critical interactive zones** — nav dock, header icons, task tile actions all use `Semantics` widgets (`floating_navigation_dock.dart:160, 218`).
5. **Haptic feedback** on navigation taps (`HapticFeedback.lightImpact()` in dock).
6. **Animated press feedback** on `MhButton` (scale 1.0→0.95 + opacity, 100ms — `mh_button.dart:179-220`).
7. **Role-adaptive navigation** — governance tab icon/label mutates per role (`admin`/`manager`/`team`/`member`). Thoughtful.
8. **Skeleton shimmer component** with theme-aware tones (`mh_skeleton.dart`).
9. **Offline awareness** — banner with frosted glass + reconnecting indicator.
10. **BackdropFilter glass UI** consistently applied for premium feel.

---

## 🔴 Critical Issues

### C1. Sub-minimum text sizes throughout the app
**Rule violated:** `readable-font-size` (min 16px body), Apple HIG, Material type roles

The app systematically uses text far below the 12px floor for captions, and even smaller in many places:

| Location | Size | Issue |
|----------|------|-------|
| `app_typography.dart:58` `caption` | **10px** | Base caption style |
| `tasks_screen.dart:331` stat card labels | **6px** | `fontSize: 6` (!!) |
| `dashboard_screen.dart:258,371` system footer / due dates | **8px** | "MEDIAHIVE SECURE OPS CORE" |
| `dashboard_screen.dart:608,722` event type / count badges | **8-10px** | "EVENTS", "TASKS" |
| `floating_navigation_dock.dart:275` dock labels | **10px** + `letterSpacing: 0.5` | Stretched, hard to read |
| `login_screen.dart:366` footer credit | **8px** | "POWERED BY..." |
| Many "section labels" | **8-9px** + letterSpacing 1.5-2.0 | "OVERDUE", "TODAY" |

**Why it matters:** Text below 12px is unreadable for users with mild visual impairment, in bright sunlight, or on low-DPI screens. Combined with heavy letter-spacing on uppercase, legibility collapses. **6px is not a real body text size** — it's decoration masquerading as data.

---

### C2. Low-contrast secondary/muted text
**Rule violated:** `color-contrast` (4.5:1 minimum), `color-dark-mode`

Pervasive use of `textSecondary.withValues(alpha: 0.2-0.5)` on text that should be readable:

- `dashboard_screen.dart:258` system footer: `colors.textSecondary.withValues(alpha: 0.2)` — **nearly invisible by design**
- `dashboard_screen.dart:302,831` "No immediate priorities found": `alpha: 0.5`
- `main.dart:286,290` dark theme `bodySmall`/`labelSmall`: `Color(0xFF666666)` on `#000000` ≈ **3.9:1** — fails AA for normal text
- `floating_navigation_dock.dart:257` unselected icons: `textSecondary.withValues(alpha: 0.4)` — likely **< 3:1**
- `global_header.dart:198` login tagline: `textSecondary.withValues(alpha: 0.5)`

**Estimated contrast failure:** Dark theme muted text routinely lands at 2.5–3.5:1 against pure black. WCAG AA requires **4.5:1** for body text.

---

### C3. Color used as the sole status indicator
**Rule violated:** `color-not-only`, `color-not-decorative-only`

- `dashboard_screen.dart:866-869` task status dot — single colored circle conveys status
- `dashboard_screen.dart:1099-1115` system health indicators — 6px green/red dots labeled only by tiny 8px text
- Attendance status colors throughout (`AppColors.success`/`warning`/`info`/`error`) — though most have accompanying text, the text is often unreadable (see C1), leaving color as the de facto signal
- `_buildMiniIndicator` green/red dot with no icon or pattern differentiation — **inaccessible to colorblind users** (~8% of men)

---

### C4. No Dynamic Type / system font scaling support
**Rule violated:** `dynamic-type`, `text-styles-system`

All `TextStyle` declarations use hardcoded `fontSize:` values. The app **does not honor** the OS-level text size accessibility setting because:
- `app_typography.dart` — every style is a hardcoded `const`
- Custom widgets (`MhButton`, `MhInput`) don't use `Theme.of(context).textTheme`
- No `MediaQuery.textScaler` normalization anywhere

Users who increase system font size for accessibility get **zero benefit**. This is a legal accessibility barrier in some jurisdictions.

---

## 🟠 High Severity Issues

### H1. Magic-number header offsets are brittle
**Rule violated:** `fixed-element-offset`, `spacing-scale`

Screens manually pad content to clear the floating header:
```
dashboard_screen.dart:89     fromLTRB(20, 120, 20, 140)
tasks_screen.dart:84         top: 120 + MediaQuery.of(context).padding.top
calendar_screen.dart:73      top: 120 + MediaQuery.of(context).padding.top
profile_screen.dart:50       top: 140
create_task_screen.dart:727  top: 120
```
If the `GlobalHeader` height changes, **every screen silently breaks** (content hidden under header). Should be a shared constant or measured via `GlobalKey`/`SliverAppBar`.

---

### H2. 143 GestureDetectors vs 25 InkResponses — no touch feedback on most cards
**Rule violated:** `tap-feedback-speed`, `press-feedback`, `cursor-pointer`

The vast majority of tappable cards (task cards, event cards, profile tiles, filter chips, contact tiles) use `GestureDetector`, which provides **no visible press feedback**. Material `InkWell`/`InkResponse` (which provide ripple) are only used in the nav dock and header icons.

**Impact:** Users tapping a task card see nothing happen for the ~200ms until the route pushes. Feels unresponsive and non-native.

---

### H3. Bottom navigation has 6 destinations + center FAB (7 zones)
**Rule violated:** `bottom-nav-limit` (Material: max 5 items)

`floating_navigation_dock.dart:113-149` — Row contains: Home, Tasks, Events, **FAB**, Inventory, Files, Governance = **6 nav items + FAB**. Material Design caps bottom nav at 5 to avoid misclicks. On a 360px phone, each item gets ~40px — **below the 48dp minimum touch target**.

---

### H4. Icon-only navigation when unselected
**Rule violated:** `nav-label-icon`, `nav-state-active`

`floating_navigation_dock.dart:265-283` — dock labels have `opacity: isSelected ? 1.0 : 0.0`. Unselected items are **icon-only**. This is especially harmful because the governance icon mutates per role (shield/command/clock/user) — a user has no text hint what it does until selected. Discovery is harmed.

---

### H5. Indefinite animations with no reduced-motion support
**Rule violated:** `reduced-motion`, `motion-meaning`, `main-thread-budget`

- `ambient_canvas_background.dart:35` — `AnimationController..repeat()` runs **forever** behind all content, repainting via CustomPainter every frame
- `global_header.dart:87` — logo `.rotate(duration: 20.seconds, curve: Curves.linear)` infinite rotation
- `shell_screen.dart:519-521` — NFC icon `.scale().blurXY()` infinite pulsing + progressive blur

None respect `MediaQuery.disableAnimations` or a `prefersReducedMotion` setting. A perpetually **rotating brand mark** in the header is also decorative-only motion (violates `motion-meaning`).

---

### H6. Stacked BackdropFilter blurs — performance risk
**Rule violated:** `main-thread-budget` (16ms/frame)

Multiple screens layer **2+ simultaneous blurs**: GlobalHeader (σ=24) + FloatingDock (σ=28) + OfflineBanner (σ=12) + update banner + content. On mid-range Android devices (common in the target user base), this causes frame drops. BackdropFilter is among the most expensive Flutter operations.

---

### H7. Avatar and header icons below 44pt touch minimum
**Rule violated:** `touch-target-size` (44pt iOS / 48dp Android)

- `global_header.dart:315` profile avatar `CircleAvatar(radius: 18)` = **36px** diameter (below 44pt)
- `global_header.dart:154,210` chat/notification `InkResponse(radius: 20)` = **40px** (below 44pt)
- The visual icon is 22px; even with `radius: 20` the hit area is undersized

---

### H8. Fragile logo layout hack on login screen
**Rule:** `layout-shift-avoid`, robust layout

`login_screen.dart:96-106` — uses `Transform.translate(offset: Offset(-14.5, 0))` + `Transform.scale(scale: 6.0, alignment: Alignment.centerLeft)` + `heightFactor: 0.25` to position the app-name image. This is a pixel-perfect hack that **will break** on different aspect ratios, font scales, or after asset changes. Should use a properly sized asset or `FittedBox`.

---

### H9. Outlined button borders near-invisible
**Rule violated:** `state-clarity`, `contrast-readability`

`main.dart:260,351` — global OutlinedButton style uses `lightBorder.withValues(alpha: 0.15)` / `Colors.white.withValues(alpha: 0.08)` for borders. These are **< 1.5:1 contrast** against backgrounds — outlined buttons visually vanish, becoming "ghost buttons." Users can't tell what's tappable.

---

## 🟡 Medium Severity Issues

### M1. Raw exception strings shown to users
**Rule violated:** `error-clarity`, `error-recovery`
- `login_screen.dart:56` — `'Authentication Failed: ${e.toString()}'`
- `shell_screen.dart:133` — `'Update Error: $err'` in a red banner
- `profile_screen.dart:498` — `'Failed to check for updates: $e'`

These expose Supabase/internal errors to end users with no recovery path.

---

### M2. Chaos menu accessible in production via long-press
**Rule:** Production safety

`tasks_screen.dart:184` `_showChaosMenu` is triggered by long-pressing the "TASKS" header and exposes: *Simulate Network Loss*, *Clear Local Cache*, *Inject 100 Tasks*, **Trigger Crash**. Not debug-gated. If a user discovers this, it's a destructive UX trap.

---

### M3. Raw date strings shown to users
**Rule violated:** `number-formatting`, locale-aware
- `dashboard_screen.dart:369` — `'DUE ${task.dueDate}'` renders `'DUE 2026-12-31'`
- No `intl`/locale-aware formatting on user-facing dates

---

### M4. Status string normalization hell — DB inconsistency bleeding into UI
**Observation:** Extensive defensive code normalizing `'todo'`/`'To Do'`/`'to_do'`/`'in_progress'`/`'in progress'` (e.g. `tasks_screen.dart:480-483, 538-543, 769`). Indicates the backend returns inconsistent casing. This isn't purely UI, but causes **silent UX bugs** where status comparisons fail and badges mis-render.

---

### M5. Conflicting color naming across themes
**Maintenance hazard:** `DesignTokens.honey` = gold `#FFD700`, but `ThemeColors.light().honey` = blue `#006EE6`. Same field name, opposite meaning per theme. `ThemeColors.indigo` is set to **softGold** in dark mode. This will cause bugs as the codebase grows.

---

### M6. No undo for destructive actions
**Rule violated:** `undo-support`
Task delete (`tasks_screen.dart:896-919`) shows a confirmation dialog (good) but no undo toast after deletion. Accidental deletes are permanent.

---

### M7. Filter chips and many tiles use GestureDetector — no press feedback
`_FilterSheet._filterChip` (`tasks_screen.dart:1201`), profile contact tile, event cards, etc. all use bare `GestureDetector`. No ripple, no scale, no opacity change.

---

### M8. Sign Out action has low visual weight
`profile_screen.dart:509` — Sign Out is a 200px-wide `OutlinedButton` buried mid-scroll in the profile. Destructive/auth-critical actions should be clearly weighted and predictable. Easy to miss.

---

### M9. `.blurXY` animation on NFC scanning icon progressively blurs legibility
`shell_screen.dart:521` — `.blurXY(begin: 0, end: 1, duration: 1.seconds)` continuously blurs the icon the user is supposed to look at during scanning. Decorative motion that harms the focal element.

---

### M10. Update-banner error overlay renders raw red error to end users
`shell_screen.dart:122-138` — Shows `'Update Error: $err'` at 10px in a red container pinned to the top of **every shell screen** if the update check throws.

---

### M11. Outlined/Text buttons inside dark SnackBars may have contrast issues
`main.dart:224-231` — SnackBar background uses `surface.withValues(alpha: 0.9)`. Combined with floating behavior and varying content, contrast of action buttons inside snackbars is unverified.

---

### M12. Dock Row at 85px height with 7 children risks overflow on small phones
`floating_navigation_dock.dart:76,112` — On a 320–360px-wide phone, 6 Expanded children + a 52px FAB in one Row leaves ~40px per item. Risk of crowding/mis-taps.

---

## 🟢 Low Severity Issues

### L1. Mixed icon libraries
Mostly `lucide_icons_flutter` (consistent, good), but attendance/field_work screens use Material `Icons.cloud_off`, `Icons.work_outline`, `Icons.nfc`, `Icons.close`, `Icons.info_outline`. Two icon families in one app.

### L2. Emojis used as structural icons in member guide
`profile_screen.dart:247-262` — `'🚧 Important'`, `'❌ You Cannot'`, `'✅ Default'`. Violates `no-emoji-icons` (emojis are font-dependent, can't be themed).

### L3. Heavy letter-spacing on tiny uppercase labels reduces legibility
`letterSpacing: 1.5-2.0` paired with `fontSize: 8-10` (e.g. "OPERATIONAL", "STANDBY MODE", "POWERED BY...") produces stretched, hard-to-read text.

### L4. Dead/deprecated code in design tokens
`design_tokens.dart:102-103` — `glowPrimary = []` and `glowHoney = []` are empty lists, never populated. Leftover from a refactor.

### L5. Negative letter-spacing on body text
`app_typography.dart:37,45` — `bodyL letterSpacing: -0.374`, `bodyM: -0.224`. Tight tracking on body copy is unusual and can hurt readability at small sizes.

### L6. Inconsistent haptic feedback
Only nav dock taps trigger `HapticFeedback.lightImpact()`. Delete, status change, FAB, form submit — none use haptics. Inconsistent feedback language.

### L7. Unsafe runtime map access in dashboard
`dashboard_screen.dart:441-442` — `metrics['systemStatus'] as Map<String, dynamic>` then `status['dueToday']` with no null guards. An API shape change crashes the dashboard.

---

## 📊 Rule Coverage Summary

Using the `ui-ux-pro-max` priority framework:

| Priority | Category | Status |
|----------|----------|--------|
| 1 | **Accessibility** | 🔴 **Failing** — text sizes, contrast, Dynamic Type, color-only indicators |
| 2 | **Touch & Interaction** | 🟠 **Mixed** — good on widgets/buttons, poor on cards (GestureDetector) |
| 3 | **Performance** | 🟠 **At risk** — indefinite animations, stacked blurs, no virtualization visible |
| 4 | **Style Selection** | 🟢 **Strong** — consistent VisionOS/FinTech direction, mostly one icon family |
| 5 | **Layout & Responsive** | 🟠 **Mixed** — magic offsets, 6-item dock, fragile logo hack |
| 6 | **Typography & Color** | 🔴 **Failing** — 6-10px text, low-contrast secondaries, naming conflicts |
| 7 | **Animation** | 🟠 **Mixed** — good micro-interactions, but indefinite/non-reduced-motion animations |
| 8 | **Forms & Feedback** | 🟡 **Decent** — has labels, errors, helpers; weak on raw exceptions & undo |
| 9 | **Navigation Patterns** | 🟠 **Mixed** — role-adaptive is clever; 6-item dock + icon-only unselected is problematic |
| 10 | Charts & Data | ➖ Not deeply reviewed |

---

## 🎯 Top 5 Recommendations (Priority Order)

1. **Establish a minimum text-size floor (12px absolute, 14px preferred)** and audit every `fontSize:` < 12. Refactor `AppTypography.caption` from 10px → 12px. This single change fixes the biggest accessibility failure.

2. **Introduce `MediaQuery.textScalerOf(context)` into the typography system** so the app honors OS-level Dynamic Type. Wrap hardcoded sizes or migrate to `Theme.of(context).textTheme`.

3. **Replace card `GestureDetector`s with `InkWell`/custom press-feedback wrapper** (or extend `MhButton`'s press animation pattern). Provides the missing <100ms tap feedback across ~140 sites.

4. **Raise secondary text contrast** — define a `textSecondary` that meets 4.5:1 in both themes. Remove decorative `alpha: 0.2` text. Verify with a contrast tool.

5. **Reduce bottom dock to ≤5 items** (e.g., merge Files into Inventory, or move Governance to header/profile), and **always show labels** under icons (even at smaller size) — especially given the role-mutating governance slot.

---

## ⚠️ Notes & Caveats

- This is a **static code audit** — no device/emulator testing was performed. Some contrast ratios are estimated from hex values and should be verified with a tool like Stark or WCAG Contrast.
- I did not deeply review: chat screens, attendance scan flow, inventory transactions, calendar grid, governance screens — the patterns observed in the audited screens are likely representative.
- No user testing was conducted; findings are against established HIG/Material/WCAG standards.
- Per your instruction, **no files were edited or fixed**.
