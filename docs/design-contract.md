# Design Contract & Lockdown Protocol

> **STATUS**: LOCKED 🔒
> **DATE**: 2026-01-15
> **VERSION**: 1.0 (Mobile/PWA Release)

This document serves as the **Single Source of Truth** for UI/UX development. Any deviation from these rules requires a formal revision of this contract.

---

## 1. Global Themes (Immutable)

The application supports exactly three themes. No new themes. No overrides.

| Theme | Base Color | Usage |
| :--- | :--- | :--- |
| **Aura** (Default) | `#0f172a` (Slate 900) | Standard professional view. Deep blue/slate. |
| **Dusk** | `#18181b` (Zinc 950) | High-contrast dark mode. Warm monochrome. |
| **Frost** | `#ffffff` (White) | High-legibility light mode. Clean, no shadows. |

**Rule**: Never hardcode hex values for backgrounds. Always use `bg-background` or semantic tokens.

---

## 2. UI Primitives (Canonical)

All components MUST use these semantic tokens. Raw Tailwind colors (e.g., `bg-slate-800`, `border-gray-500`) are **FORBIDDEN** in production code.

### Surfaces
-   `bg-root`: The absolute bottom layer of the app.
-   `bg-glass`: Used for cards, panels, and overlays. Must include `backdrop-blur`.
-   `bg-surface`: Opaque or semi-opaque fallback for content areas.

### Text
-   `text-foreground`: Primary legibility (headings, body).
-   `text-muted`: Secondary information (labels, timestamps).
-   `text-primary`: Actionable items (links, buttons).

### Interaction
-   `focus-visible:ring-primary`: **Mandatory** for all interactive elements.
-   `active:scale-95`: Standard tactile feedback for rows/cards.

---

## 3. Card System Interface

The "Card" is the fundamental unit of the UI.

**Standard**: Reference `InventoryCard.tsx` or `TaskItem.tsx`.

-   **Border**: None (or extremely subtle `white/5`).
-   **Shadow**: `shadow-lg` or `shadow-xl` for depth.
-   **Roundness**: `rounded-2xl` (Standard) or `rounded-3xl` (Panels).
-   **Padding**: `p-4` (Mobile), `p-6` (Desktop).
-   **Hover**: Lift effect (`-translate-y-1`), no border color change unless selected.

---

## 4. Mobile & PWA Constraints

-   **Touch Target**: Minimum 44px for all interactions.
-   **Safe Area**: FABs and Bottom Nav must respect `env(safe-area-inset-bottom)`.
-   **Landscape**: Supported but not optimized (Portrait-first).

---

## 5. Development Guardrails

1.  **No New Fonts**: Use Inter/System default.
2.  **No Logic Changes**: Backend routes are strictly out of scope.
3.  **No Permissions**: Role-based access control is frozen.

> **Verification**: If a change violates this contract, REJECT the PR.
