# Phase 11 UX Danger Map

**Focus:** Identifying and eliminating coercive or punitive UX patterns.
**Fail if:** enforcement feels like punishment, urgency, or system error.

## Hard STOP Patterns
If any of the following patterns are detected in the interface, implementation must immediately halt. These are critical violations of the Authority UX Contract.

### 🔴 1. The "Punitive Error" (Errors)
- **Description:** Using aggressive error styling (bright red text, warning icons) to indicate a policy boundary. Treating boundaries as failed validation.
- **Why it's dangerous:** It frames a system constraint as a user failure, inducing stress and reducing trust.
- **Alternative:** Use neutral informational styling (grays, muted blues) for policy boundaries.

### 🔴 2. The "Red Banner of Urgency" (Red Banners)
- **Description:** Global or prominent red banners demanding immediate resolution of a conflict.
- **Why it's dangerous:** It manufactures false urgency, forcing the user to abandon their current intent to address a system need.
- **Alternative:** Calm, dismissible inline notifications or badges that wait for the user's attention.

### 🔴 3. Forced Navigation (Modal Traps & Forced Nav)
- **Description:** Full-screen takeovers, non-dismissible modals, or forced redirects that trap the user until they resolve a conflict, often requiring them to discard unsaved work.
- **Why it's dangerous:** It steals control from the user and threatens data loss.
- **Alternative:** Allow "Save draft" or graceful exit. Conflicts should be resolvable asynchronously on the user's terms.

### 🔴 4. Judgmental Copy
- **Description:** Using words like "Violation", "Illegal", "Unauthorized", or "Must" when describing rules.
- **Why it's dangerous:** It infantilizes or criminalizes the user.
- **Alternative:** Use descriptive, neutral templates (e.g., "Governed by [Rule]" or "Managed by [Policy]").

### 🔴 5. Stealth Overrides
- **Description:** The system auto-correcting or changing user input to comply with a rule without explicit consent.
- **Why it's dangerous:** It destroys the user's mental model of what they have entered versus what the system will execute.
- **Alternative:** Highlight the discrepancy neutrally and offer a one-click "Align with Policy" option, leaving the final choice to the user.
