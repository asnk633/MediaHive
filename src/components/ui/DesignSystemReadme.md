# Design System & Tokens

This project uses a centralized design token system to ensure consistency across the application.

## Tokens Source
The source of truth is located at `src/styles/mediahive.tokens.ts`.
These tokens are automatically mapped to Tailwind CSS configuration in `tailwind.config.ts`.

## Usage

### Colors
Use semantic color names whenever possible:
- `bg-primary` / `text-primary` (Emerald)
- `bg-accent` / `text-accent` (Blue)
- `bg-background` / `bg-surface` (Dark grays)
- `text-text-primary` (White/Off-white)
- `text-text-muted` (Gray)

### Spacing & Radii
- Radius: `rounded-sm`, `rounded-md` (default card), `rounded-lg`, `rounded-xl`
- Spacing: Standard Tailwind spacing (p-4, m-2, etc.)

### Shadows
- `shadow-soft`: Subtle depth
- `shadow-elevated`: Modals and floating elements
- `shadow-glow`: Primary accent glow

### Motion
Use Framer Motion with the tokens:
```tsx
import { mediahive } from "@/styles/mediahive.tokens";

<motion.div
  transition={{ duration: mediahive.motion.duration.normal, ease: mediahive.motion.easing.standard }}
/>
```

## Components
All UI components in `src/components/ui` should utilize these tokens.
- **Buttons**: `h-10 px-4 rounded-md` (standard)
- **Cards**: `bg-surface/50 border-white/5 backdrop-blur-sm`
- **Modals**: `bg-background/90 backdrop-blur-md border-white/10`
