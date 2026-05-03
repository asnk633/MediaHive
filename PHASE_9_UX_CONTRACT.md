# Phase 9: Conflict Resolution Center - UX Contract & Validation
**Author:** Antigravity (User Psychology, UX Semantics)
**Mission:** Ensure Phase 9 feels calm, optional, and non-coercive. Conflicts are things to review, not errors to fix.

## 1. UX Mental Model Enforcement
The overarching mantra is: *"I'm holding this for you. You can decide later."*

**Invariant Validation Rules:**
- [x] **No Blocking Flows:** Conflict resolution cannot interrupt or block primary workflows (e.g., creating a task, editing an event).
- [x] **No Forced Navigation:** Users are never automatically redirected to the Conflict Resolution Center.
- [x] **No Urgency Framing:** The UI must not suggest that immediate action is required.
- [x] **No Escalation:** No red badges, no flashing alerts, no "Fix Now" prompts.

## 2. Information Hierarchy & Language
**Copy Tone:** Calm, neutral, and deferential. The system serves the user, not the other way around.

**Vocabulary Guidelines:**
- **DO USE:** Review, Choose, Decide, Await, Defer, Conflict, Version, Retain
- **DO NOT USE:** Fix, Error, Must, Required, Warning, Alert, Invalid, Action Required

**Component Copy:**
- **Navigation Label:** `Review Queue` or `Sync Conflicts` (Not `Errors` or `Action Needed`)
- **Header:** `Items for Review` — *We saved multiple versions. Choose which one to keep when you're ready.*
- **Empty State:** `Nothing to review. Your workspace is in sync.` (Calm, positive, but not celebratory)
- **Help Text:** `You can defer these choices. Both versions are safely stored.`

## 3. Conflict List Semantics
The list must feel like an inbox or a review queue, not a triage error log.

**Validation Checklist:**
- [ ] **Grouping:** Group conflicts logically (by Task/Event, by changes, or by age), not by "severity".
- [ ] **Neutrality:** Remove priority flags. A conflict is a conflict; none are "critical".
- [ ] **Deferral Subtext:** Provide implicit signals that leaving items in the list is perfectly normal (e.g., no total counts in red, no overarching deadlines).

## 4. Conflict Detail UX
Detail views must focus on neutral comparison. They should not guide the user to a "correct" answer.

**Design Constraints:**
- **Clear Provenance:** Clearly label `Your Version` (Local) vs. `Their Version` / `Cloud Version` (Remote).
- **Why it Exists:** Contextual hint (e.g., *"This task was updated on another device while you were offline."*)
- **No Bias:** The UI cannot pre-select or recommend a choice.
- **Easy Exit:** A prominent `Decide Later` or `Back` button must exist alongside the choices. No confirmation prompts when leaving without deciding.

## 5. Phase 9 UX Danger Map (Boundary Policing)

If an engineer implements any of the following, **STOP AND ESCALATE IMMEDIATELY**:

🔴 **Auto-open Behavior:** Popping a modal or navigating to the resolution center upon app boot or sync completion.
🔴 **Modal Dialogs to Resolve:** Forcing a choice via an un-dismissible or modal dialog when a conflict is detected.
🔴 **Countdown Timers:** E.g., *"Changes will be merged in 24 hours"* or any expiration mechanics.
🔴 **Recommended Action Banners:** E.g., *"We recommend keeping the newest version."*
🔴 **Background Resolution / Auto-merge:** The system making irreversible choices on structural/content conflicts without user explicit input (violates user authority).
🔴 **Red Badges:** Any red notification dots on the navbar indicating unreviewed conflicts (use gray or a neutral primary hue).

## 6. UX Sign-off for Phase 9 Completion
*To mark Phase 9 complete, all criteria below must be met:*

- [ ] All copy avoids "Error/Fix" semantics.
- [ ] The Conflict UI is accessible solely via a voluntary navigation click.
- [ ] Detail screens present options equally and neutrally.
- [ ] Exit/Defer options are clearly available at every step of the flow.
- [ ] No red alerts or blocking modals exist in the conflict pipeline.

*Signed: Antigravity*
