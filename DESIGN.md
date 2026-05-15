# MediaHive Flutter — Design System & Tokens (v1.0)

This document defines the visual language and structural design tokens for the MediaHive Flutter mobile application. It is derived from the **Locked Design Contract** of the core platform to ensure cross-platform visual consistency.

---

- **Visual Philosophy**: Premium, High-Fidelity, and Dynamic.
- **Atmospheric**: Deep navy and black backgrounds with vibrant neon accents and glassmorphism.
- **Kinetic**: Use of subtle glows, gradients, and micro-animations to indicate state and health.
- **Hierarchical**: Bold typography for greetings and critical stats, secondary text for metadata.

---

## 2. Color System

### Themes (Premium Dark First)
| Element | Dark Mode (Primary) | Light Mode (Fallback) |
| :--- | :--- | :--- |
| **Background (Primary)** | `#000000` (True Black) | `#FFFFFF` |
| **Background (Secondary)** | `#0A0E21` (Deep Navy) | `#F9F9F9` |
| **Surface (Cards/Panels)** | `#1A1F38` (Midnight Blue) | `#FFFFFF` |
| **Text (Primary)** | `#FFFFFF` | `#111111` |
| **Text (Secondary)** | `#94A3B8` (Slate) | `#666666` |
| **Border / Dividers** | `#1E293B` (Slate-800) | `#E5E5E5` |

### Functional Colors & Gradients
- **Primary Action (New)**: `LinearGradient(#6366F1, #8B5CF6)` (Indigo to Violet)
- **Secondary Action**: `LinearGradient(#3B82F6, #2563EB)` (Blue to Blue-700)
- **Success/Live**: `#10B981` (Emerald) with Pulse Glow
- **Glow Effects**: Box shadow with 20% opacity and 12px blur using the accent color.

---

## 3. Layout & Spacing (8pt Grid)

All margins, paddings, and structural dimensions must follow the 8-point increment system.

- **xs**: `4px`
- **sm**: `8px`
- **md**: `12px`
- **lg**: `16px` (Standard screen padding)
- **xl**: `24px`
- **2xl**: `32px`

---

## 4. Typography Hierarchy

Use professional, high-readability sans-serif fonts (e.g., **Inter** or **Outfit**).

- **H1 (Header)**: `24px`, Bold, Tight tracking.
- **H2 (Subheader)**: `18px`, Semi-bold.
- **Body (Primary)**: `16px`, Regular.
- **Body (Small)**: `14px`, Regular (used for secondary metadata).
- **Caption**: `12px`, Medium, Uppercase (used for labels/badges).

---

## 5. UI Components (Flutter Tokens)

### Border Radius
- **Buttons / Inputs**: `4px`
- **Small Cards / Chips**: `8px`
- **Large Panels / Bottom Sheets**: `12px`
- **Avatars / Action Bubbles**: `100px` (Full)

### Elevation & Shadows
- **Level 0 (Flat)**: No shadow. Used for inputs and dividers.
- **Level 1 (Soft)**: `0px 2px 4px rgba(0, 0, 0, 0.05)`. Used for task cards.
- **Level 2 (Floating)**: `0px 4px 12px rgba(0, 0, 0, 0.1)`. Used for Bottom Navigation and Top Bars.

### Gradients
- **Constraint**: Multiple gradients allowed for premium visual depth.
- **Usage**: Used for progress bars, action buttons, and section backgrounds.

---

## 6. Multi-Tenant UI Requirements
The mobile UI must respect the hierarchical data structure:
1.  **Tenant Context**: The top-level brand/org.
2.  **Institution Marker**: Always visible in the Dashboard or Profile header.
3.  **Department Scope**: Active filtering label in the Tasks and Files screens.

---

## 7. Icons
- **Source**: **Lucide React** (or `lucide_icons` Flutter package).
- **Stroke Width**: `1.5` or `2.0` for clarity.
- **Coloring**: Always follow the Text (Primary) color unless indicating a specific status (Success/Error).
