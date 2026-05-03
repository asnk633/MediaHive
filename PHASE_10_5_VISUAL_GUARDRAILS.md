# Phase 10.5 Visual Guardrails

**Purpose:**
This document defines visual patterns that are explicitly forbidden when displaying policy guidance or conflict information. Visual hierarchy is as important as copywriting in maintaining user authority and psychological safety.

---

## 🚫 Forbidden Visual Anti-Patterns

### 1. Alert Coloring
- **Never use:** Red, Amber, Warning Orange, or Success Green for policy guidance text, backgrounds, or borders.
- **Why:** These colors trigger biological urgency and stress responses. They imply "wrong/danger" or "right/safe", stripping neutrality.
- **Allowed:** Grayscale, muted theme secondary colors (e.g., dark slate blue, dim purple) used entirely for structural separation, not emphasis.

### 2. Animation & Motion
- **Never use:** Pulsing buttons, shaking icons, flashing badges, or auto-scrolling to conflicts.
- **Why:** Motion demands immediate attention and disrupts calm. It forces the user to look at the conflict against their will.
- **Allowed:** Standard, subtle hover states or smooth accordion expansion when a user *clicks* for more context.

### 3. Emphasized Badges & Escalation Counters
- **Never use:** Bright red dot counters in navigation, or numeric badges that grow more visually aggressive as conflicts age.
- **Why:** Escalation counters frame the inbox as a ticking bomb. 
- **Allowed:** A quiet gray or muted indicator showing the presence of unreviewed items.

### 4. Coercive Iconography
- **Never use:** Warning triangles (⚠️), Stop signs (🛑), or Green Checkmarks (✅) next to specific resolution options based on policy alignment.
- **Why:** Icons bypass reading and immediately signal to the brain which button is the "correct" one.
- **Allowed:** Purely informational icons (`Info`, `HelpCircle`, `Link`) placed next to the guidance text itself, not the action buttons.

### 5. Dominant Positioning above Controls
- **Never place:** Policy guidance *between* the conflict details and the `Keep Local` / `Keep Server` decision buttons.
- **Why:** Placing guidance right above the primary actions acts as a tollbooth, forcing the user to process the policy before they can click. 
- **Allowed:** Situating guidance clearly, but peripherally (e.g., subtly below the values, or hidden behind a "Show Context" toggle). The decision buttons must remain cleanly accessible without visual obstruction.
