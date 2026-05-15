# MediaHive Mobile App — UI & UX Guidelines

## Philosophy

MediaHive is a professional operational productivity app for media teams, administrators, photographers, editors, designers, and institution management.

The application must feel:

* Premium
* Fast
* Calm
* Professional
* Operational
* Minimal
* Intentional
* Highly usable

This is NOT a social media app.
This is NOT a flashy entertainment app.

The design should prioritize:

1. Speed
2. Clarity
3. Efficiency
4. Consistency
5. Reduced cognitive load
6. Reduced number of taps
7. Smooth operational workflow

---

# Core Design Principles

## 1. Consistency First

Every screen must maintain:

* consistent spacing,
* typography,
* colors,
* animations,
* icon sizes,
* corner radius,
* shadows,
* interaction patterns,
* navigation behavior,
* and layout hierarchy.

Never introduce random UI styles.

---

## 2. Mobile-First Design

All screens must be optimized for:

* one-handed use,
* thumb reach,
* touch comfort,
* quick interactions,
* and small-screen readability.

Avoid desktop-like layouts.

---

## 3. Calm Interface

The UI should feel:

* clean,
* breathable,
* modern,
* soft,
* and operational.

Avoid:

* visual clutter,
* excessive gradients,
* excessive shadows,
* flashy effects,
* and unnecessary animations.

---

# Design System Rules

## Centralized Design Tokens

Never hardcode UI values directly inside widgets.

Create and use:

* AppColors
* AppTypography
* AppSpacing
* AppRadius
* AppShadows
* AppAnimations
* AppIcons

All UI must reference these constants.

---

# Spacing Rules

## Standard Spacing Scale

Use only predefined spacing values.

Recommended:

* 4
* 8
* 12
* 16
* 20
* 24
* 32
* 40

Avoid random spacing values.

---

# Border Radius Rules

Use consistent corner radius across the app.

Recommended:

* Small: 8
* Medium: 12
* Large: 16
* Cards/Sheets: 20+

Never mix inconsistent radius styles.

---

# Typography Rules

Typography must feel:

* clean,
* modern,
* readable,
* and balanced.

Avoid:

* oversized headings,
* tiny text,
* excessive font weights,
* and inconsistent font scaling.

Use:

* clear hierarchy,
* balanced spacing,
* proper line height,
* and responsive scaling.

---

# Color Rules

The app uses a calm dark modern identity.

Primary visual direction:

* dark gradients,
* soft surfaces,
* muted highlights,
* subtle accent colors.

Avoid:

* highly saturated colors,
* random accent colors,
* neon effects,
* and inconsistent color usage.

Status colors should remain consistent:

* Success
* Warning
* Error
* Info

---

# Component Rules

## Buttons

All buttons must have:

* loading state,
* disabled state,
* pressed feedback,
* proper touch area,
* and consistent height.

Avoid tiny buttons.

Minimum touch target:
48x48dp

---

## Cards

Cards should:

* feel lightweight,
* have subtle elevation,
* proper internal spacing,
* and visual hierarchy.

Avoid heavy shadows.

---

## Inputs

Inputs must:

* support keyboard navigation,
* show validation clearly,
* auto-scroll into view,
* and handle errors gracefully.

Keyboard must never cover inputs.

---

## Lists

Lists must:

* preserve scroll position,
* support pull-to-refresh,
* support pagination if needed,
* and show proper empty states.

Avoid jumpy list rebuilds.

---

# Navigation Rules

Navigation must feel:

* predictable,
* smooth,
* and stable.

Requirements:

* preserve screen state,
* preserve scroll position,
* proper Android back behavior,
* smooth transitions,
* no navigation flickers,
* and no duplicate screens in stack.

Avoid navigation confusion.

---

# Animation Guidelines

Animations must be:

* subtle,
* fast,
* purposeful,
* and performance-friendly.

Preferred:

* fade
* slide
* scale
* shared-axis transitions

Avoid:

* exaggerated motion,
* long animations,
* bouncing effects,
* flashy transitions,
* and animation overload.

Recommended duration:
150ms–300ms

---

# Loading Experience

Never leave blank loading screens.

Use:

* skeleton loaders,
* shimmer placeholders,
* optimistic UI updates,
* progressive loading,
* and smooth transitions.

Loading should feel responsive.

---

# Empty States

Every empty screen must include:

* helpful messaging,
* visual balance,
* and actionable guidance.

Avoid dead empty screens.

---

# Error Handling

Errors must:

* be human-readable,
* actionable,
* and non-technical.

Never expose raw backend errors directly to users.

Provide:

* retry actions,
* fallback states,
* and graceful recovery.

---

# Offline Experience

The app should support:

* cached data,
* retry queues,
* sync indicators,
* and offline resilience.

Users should never feel blocked immediately due to poor internet.

---

# Performance Rules

Performance is critical.

Requirements:

* avoid unnecessary rebuilds,
* use const widgets where possible,
* isolate state properly,
* lazy load large lists,
* debounce updates,
* optimize image loading,
* cache network resources,
* and reduce layout thrashing.

Never rebuild entire screens for small updates.

---

# Accessibility Rules

Support:

* readable contrast,
* scalable text,
* screen reader compatibility,
* proper semantics,
* and accessible touch targets.

Accessibility is mandatory.

---

# UX Audit Checklist

Before completing ANY screen:

Audit:

* spacing consistency,
* alignment,
* visual hierarchy,
* responsiveness,
* touch comfort,
* keyboard behavior,
* loading states,
* empty states,
* error states,
* dark mode,
* scroll behavior,
* animation smoothness,
* and accessibility.

No screen is considered complete without UX audit.

---

# MediaHive-Specific UI Rules

## Preserve Existing Identity

Maintain:

*  Modern operational look with two theme (Dark and light themes),
* FAB behavior consistency,
* soft gradients,
* clean dashboard feel,
* and calm interface aesthetics.

---

## Avoid

Do NOT create:

* overly colorful UI,
* social media style layouts,
* excessive cards,
* giant headers,
* excessive whitespace,
* excessive nested tabs,
* cluttered dashboards,
* or overdesigned screens.

---

# Architecture Rules Related to UI

UI must remain:

* modular,
* reusable,
* scalable,
* and maintainable.

Avoid:

* duplicated components,
* business logic inside widgets,
* tightly coupled UI,
* and inconsistent state handling.

---

# Final Product Standard

Every screen must feel:

* intentionally designed,
* operationally efficient,
* visually balanced,
* responsive,
* smooth,
* and production-ready.

The goal is NOT to generate screens quickly.

The goal is to build a polished long-term production application.
