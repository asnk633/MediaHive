---
name: MediaHive
description: A mobile-first media & task management platform
colors:
  primary: "#6366f1"
  neutral-bg: "#000000"
  neutral-panel: "#0a0e21"
  text-primary: "#ffffff"
  text-secondary: "#d4d4d8"
  text-muted: "#a1a1aa"
  border-soft: "rgba(255, 255, 255, 0.08)"
typography:
  display:
    fontFamily: "SF Pro Display, Outfit, sans-serif"
    fontSize: "clamp(1.5rem, 5vw, 2.5rem)"
    fontWeight: 600
    letterSpacing: "-0.025em"
  body:
    fontFamily: "SF Pro Text, DM Sans, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  card-standard:
    backgroundColor: "{colors.neutral-panel}"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Design System: MediaHive

## 1. Overview

**Creative North Star: "The Utility Console"**

Focuses on zero-clutter, high-integrity, and command-center task efficiency. Designed for operators in mission-critical environments, the system rejects Dribbble-style atmospheric glows, neon gradients, and playful visual cues. It enforces clean visual structure, grayscale-first styling, and high contrast layouts.

**Key Characteristics:**
- **Grayscale-First**: Contrast over color drives all hierarchy decisions.
- **Strict 8pt Grid**: Precise, predictable spacing.
- **Flat by Default**: Shadows represent structure (z-index layering), never pure ornament.
- **Binary Themes**: True black (#000000) for Dark mode and clean paper white for Light mode.

## 2. Colors

The color palette is binary, high-contrast, and neutral-focused. Active accents are used strictly to highlight focus, status, or callouts.

### Primary
- **Console Indigo** (#6366f1): Reserved strictly for primary action buttons, active navigation indicators, and high-importance alerts. Must not exceed 10% of screen density.

### Neutral
- **Canvas Black** (#000000): The deep base backdrop for dark mode, providing maximum contrast and zero glow.
- **Console Dark Panel** (#0a0e21): Container color for sidebars, cards, and modal windows to group information.
- **Text Primary** (#ffffff): High-contrast main content text.
- **Text Secondary** (#d4d4d8): Secondary content and labels.
- **Text Muted** (#a1a1aa): Metadata, disabled text, and timestamps.

### Named Rules
**The 10% Accent Rule.** The primary accent (#6366f1) is restricted to ≤10% of any given screen. Its scarcity is what guides the user's eye to high-priority actions.
**The Grayscale Priority Rule.** Every visual interface must remain fully readable, usable, and distinguishable when evaluated under grayscale/monochrome preview modes.

## 3. Typography

**Display Font:** SF Pro Display, Outfit, sans-serif
**Body Font:** SF Pro Text, DM Sans, sans-serif

Typography uses high contrast in weight, scale, and tracking to establish clear structural hierarchy, bypassing the need for decorative styling.

### Hierarchy
- **Display** (Semi-bold, clamp(1.5rem, 5vw, 2.5rem), line-height 1.2): Title elements, page headers. Must use tight tracking (-0.025em).
- **Headline** (Semi-bold, 1.25rem, line-height 1.3): Section headers, drawer titles.
- **Title** (Medium, 1rem, line-height 1.4): Card headers, input titles.
- **Body** (Regular, 0.875rem, line-height 1.5): Standard paragraphs, description blocks. Clamped at 65–75ch for prose.
- **Label** (Medium, 0.75rem, letter-spacing 0.12em, uppercase): Status badges, kickers, and table headers.

### Named Rules
**The Letter-Spacing Rule.** Wide tracking (0.12em) is exclusively reserved for uppercase labels, badges, and brief eyebrows (≤4 words). Display headings must use tight tracking (-0.025em).

## 4. Elevation

The system is flat-first. Depth is communicated primarily through 1px border lines and background color steps, rather than complex shadow overlays.

### Shadow Vocabulary
- **Soft** (`0 1px 2px rgba(0, 0, 0, 0.4)`): Subtle grouping depth for cards and dashboards to distinguish them from the base canvas.
- **Medium** (`0 4px 12px rgba(0, 0, 0, 0.1)`): Floating overlay panels (e.g. navigation bars, sidebar, and dropdown menus).

### Named Rules
**The Flat-by-Default Rule.** All interactive elements sit flat at rest. Elevation or lighting adjustments occur only in response to state transitions (hover, active press).

## 5. Components

All components are designed with structured, low-density layouts for mobile, and efficient high-density alignments for desktop.

### Buttons
- **Shape:** 4px border radius.
- **Primary:** Background is #6366f1 (or linear gradient of #7c8cff to #4f6bff), text is #ffffff, padding is 8px 16px.
- **Hover:** Shift background to #4f46e5.

### Cards / Containers
- **Corner Style:** 8px (Small Card) or 12px (Large Panel).
- **Background:** #0a0e21 (Panel) or transparent glass-card (rgba(255, 255, 255, 0.04)) with backdrop-filter blur (12px).
- **Border:** 1px solid rgba(255, 255, 255, 0.08).

### Inputs / Fields
- **Shape:** 4px border radius.
- **Style:** 1px border (rgba(255, 255, 255, 0.08)), background is rgba(255,255,255,0.03).
- **Focus:** Border changes to #6366f1 with a focus-visible ring.

### Navigation
- **Style:** Sidebar navigation uses a background of #0a0e21 with 1px border separation. Mobile bottom bar uses backdrop-blur (18px) with 60% opacity on inactive items and 100% active primary accent coloring.

## 6. Do's and Don'ts

### Do:
- **Do** align margins and padding to the 8pt spacing grid.
- **Do** maintain a single primary action per viewport on mobile portrait views.
- **Do** verify text and placeholder contrast matches or exceeds WCAG 4.5:1.

### Don't:
- **Don't** use border-left or border-right accents greater than 1px as a colored stripe on cards.
- **Don't** use gradient text (`background-clip: text`) or colorful background fills.
- **Don't** add decorative glassmorphism or aura-glow backdrops.
- **Don't** use cream, sand, or beige body backgrounds; stick to the binary black/white rules.
