# Design Contract & Lockdown Protocol (v2.0)

> **STATUS**: LOCKED 🔒
> **DATE**: 2026-01-29
> **PHASE**: A (Foundation Cleanup)

This document is the **Single Source of Truth** for the MediaHive design system. Deviations are strictly prohibited to ensure a calm, production-grade visual experience.

---

## 1. Theme System (Binary)

The application supports exactly two themes. All others are deprecated and removed.

| Theme | Selector | Visual Philosophy |
| :--- | :--- | :--- |
| **Light** | `[data-theme="light"]` | White background, high contrast, grayscale-first. |
| **Dark** | `[data-theme="dark"]` | True black (#000000) primary background, calm, no glow. |

### Gradient Discipline
- **Rule**: Gradients are forbidden as background fillers.
- **Allowed Usage**: Primary action buttons, active navigation markers, or high-priority contextual emphasis.
- **Limit**: Max 1 gradient instance visible per screen.

---

## 2. Frozen Design Tokens

### Spacing Scale (8pt Grid)
All layout values must use this scale.
- `4px` (xs)
- `8px` (sm)
- `12px` (md)
- `16px` (lg)
- `24px` (xl)
- `32px` (2xl)

### Border Radius Scale
Reduced rounding to move away from "playful" AI UI to "intentional" production UI.
- `4px` (Button/Input)
- `8px` (Small Card)
- `12px` (Large Card/Panel)
- `full` (Avatar/Pill)

### Elevation (Directional Shadows)
No "glow" or "outer aura" shadows. Shadows must imply a light source from the top.
- **none**: Flat components (Dividers/Inputs).
- **soft**: Subtle depth for standard cards (`0 2px 4px rgba(0,0,0,0.05)`).
- **medium**: Floating elements like TopBar/BottomNav (`0 4px 12px rgba(0,0,0,0.1)`).

---

## 3. Screen-Class UI Separation

### Mobile (Portrait Focus)
- **Philosophy**: Minimalist, task-first.
- **Constraint**: One primary action per screen.
- **Density**: Low. Use whitespace to separate concerns.

### Desktop / Tablet
- **Philosophy**: Efficiency, command-center feel.
- **Constraint**: High information density.
- **Layout**: Persistent sidebar, multi-panel views.

---

## 4. Visual Weight Rules

1. **Contrast over Color**: Use weight (font-weight), size, and spacing to imply hierarchy instead of varying colors.
2. **Subtle Dividers**: Re-introduce thin (`1px`), low-contrast dividers to define layout boundaries.
3. **No Decorative Glows**: Remove all background shines, glow-overlays, and multi-layer "Dribbble" styles.

---

## 5. Regression Guards

> [!WARNING]
> DO NOT re-introduce Aura, Frost, or Dusk themes.
> DO NOT use ad-hoc hex codes.
> DO NOT add new decorative gradients.

Verification: Every UI change must be readable in grayscale.
