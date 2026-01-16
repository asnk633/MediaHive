# Global Theme System

## Philosophy
MediaHive supports three strictly defined themes to ensure consistency, readability, and brand identity.

1.  **Aura (Default · Locked)**: Deep indigo/midnight gradient. Premium, confident, atmospheric. Used for the primary brand experience.
2.  **Dusk (Dark · Low-Glow)**: Flat dark mode. Calm, disciplined. Optimized for long working sessions.
3.  **Frost (Light · Professional)**: Clean, white/off-white. Institutional, conservative.

## Theme Tokens
All UI components **MUST** use these semantic tokens. **Do not use raw colors.**

-   `--bg-root`: Global page background
-   `--bg-elevated`: Card background (standard)
-   `--bg-surface`: Popovers, dropdowns, secondary surfaces
-   `--bg-glass`: Glassmorphism cards
-   `--border-soft`: Subtle borders
-   `--border-strong`: Active/Input borders
-   `--text-primary`: Main content text
-   `--text-secondary`: Secondary labels
-   `--text-muted`: Disabled/Metadata text
-   `--accent-primary`: Brand color
-   `--accent-success`: Success state
-   `--accent-warning`: Warning state
-   `--accent-danger`: Error state

## Enforcement Rules
-   **Aura is the default** for all users.
-   **No Local Backgrounds**: Pages must not define `bg-slate-*`, `bg-black`, or custom gradients on the `<body>` or main wrapper. Let `--bg-root` shine through.
-   **Glass Cards**: Use `glass` or `bg-glass` utility for cards to blend with the Aura gradient.
-   **Tailwind Mapping**: Use `bg-background`, `bg-card`, `text-primary` utilities which map to the variables above.

## Do Not
-   ❌ Hardcode hex colors (e.g., `#1e1b4b`).
-   ❌ Use `bg-white` or `bg-black` for layout containers (use `bg-card` or `bg-background`).
-   ❌ Override global scrollbars.
