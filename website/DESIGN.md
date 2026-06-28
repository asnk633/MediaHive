---
name: MediaHive Marketing Showcase
description: Premium 3D scroll-driven showcase landing page for MediaHive media management.
colors:
  primary: "#6c3ef4"
  accent: "#f5a623"
  neutral-bg: "#050319"
  neutral-text: "#ffffff"
  neutral-text-muted: "rgba(255, 255, 255, 0.6)"
typography:
  display:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 5.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "8px"
  lg: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
---

## Overview
This design system defines the visual language of the MediaHive Marketing Showcase. It is an immersive, high-end, cinematic dark experience that coordinates 3D device renders, interactive sound effects, and smooth scroll animations. The layout uses bento-box features and rich, dark background colors to emphasize premium technology.

## Colors
The palette uses high contrast against a midnight void base to establish depth.
- **Primary (Cinematic Purple)**: `#6C3EF4` — used for primary brand highlights, glow elements, and primary buttons.
- **Accent (Amber)**: `#F5A623` — used selectively for status indicators, active paths, and highlights.
- **Neutral Background (Midnight Void)**: `#050319` — the base void that holds the elements.
- **Text Primary**: `#FFFFFF` — clean high-contrast white.
- **Text Muted**: `rgba(255, 255, 255, 0.6)` — softer secondary text.

## Typography
- **Display Font**: `DM Sans` (sans-serif) — bold, tight tracking, strong weights for titles and major headings.
- **Body Font**: `Inter` (sans-serif) — legible, clean, comfortable line height for description blocks.
- **Eyebrows / Badges**: Capital letters, tracked, small font-size, used sparingly to introduce features.

## Elevation
The interface uses layering and depth rather than heavy shadows:
- **Level 1 (Bento Container)**: Card borders use subtle gradients or thin borders (`1px solid rgba(255, 255, 255, 0.1)`) with a dark, semi-transparent background to let the canvas glow blobs shine through.
- **Level 2 (Glow Overlays)**: Radial gradients and blurs (`filter: blur(140px)`) create deep, moving backlights beneath the bento grids.

## Components
- **Bento Card**:
  - `borderRadius`: `16px`
  - `border`: `1px solid rgba(255, 255, 255, 0.1)`
  - `background`: `rgba(13, 11, 37, 0.5)`
  - `backdropFilter`: `blur(12px)`
- **CTA Button**:
  - `borderRadius`: `30px` (fully rounded pill)
  - `padding`: `12px 28px`
  - `backgroundColor`: `{colors.primary}`
  - `textColor`: `{colors.neutral-text}`

## Do's and Don'ts
- **Do** use responsive type scales (`clamp()`) to prevent text overflow at small viewports.
- **Do** align 3D visual triggers with scroll progress to coordinate animations and sound effects.
- **Do** provide clear layout containers with responsive column grids.
- **Don't** use generic flat SaaS tables or borders on only one side of a card (e.g. side stripes).
- **Don't** use low-contrast body text (keep body contrast above 4.5:1 against the dark backdrop).
