# Phase 10: Policy Guidance - UX Contract & Validation
**Author:** Antigravity (User Psychology, UX Semantics)

## Phase 10 Mental Model
**The Promise:** *"Here's what this choice affects — you're still in control."*
Policy guidance in MediaHive exists strictly to inform the user of downstream consequences (e.g., cross-functional workflows, capacity planning). It does not instruct, warn, or pressure.

- Guidance ≠ recommendation
- Explanation ≠ instruction
- Visibility ≠ urgency

---

## Language & Copy Contract
Guidance must remain deferential and neutral. It describes system reality; it does not dictate user action.

**✅ Allowed Verbs:**
- May affect
- Could impact
- Is associated with
- Would result in
- Currently linked to

**🚫 Forbidden Verbs:**
- Must
- Should
- Recommended
- Required
- Violation
- Warning
- Error
- Risk

---

## UX Placement Rules
Where and how guidance is presented matters as much as what is said. Context must be opt-in or strictly ambient.

**✅ Approved Placements:**
- Conflict detail panels (below the values)
- Hover tooltips (on informational icons)
- Expandable "More context" sections

**🚫 Forbidden Placements:**
- Primary action buttons (e.g., coloring the button differently based on policy)
- Inline decision controls (e.g., disabling or pre-selecting a radio button)
- Blocking dialogs or modals
- Toasts or banners
- Badges with numerical escalation

---

## Visual Neutrality Checklist
- [ ] **Colors:** Strictly neutral (grays, muted secondary colors like soft blue/purple for info). Never red, amber, green, or high-contrast warning hues.
- [ ] **Icons:** Informational only (e.g., `Info`, `HelpCircle`, `Link`). Never danger, warning, alert, or checkmark icons representing policy state.
- [ ] **Animation:** None. Policy guidance does not pulse, flash, or shake.
- [ ] **Counts:** Policy rules do not increment an "urgency" counter.

---

## UX Danger Map (Stop List)
**If any of the following patterns are detected during implementation or review, Phase 10 is VIOLATED. Stop and escalate.**

🔴 **"This choice is safer"** - Any UI suggesting one choice is objectively better or "correct".
🔴 **Highlighting a preferred option** - e.g., A glow effect or primary button style applied to the policy-aligned choice.
🔴 **Default-expanded guidance** - Forcing the user to read a wall of policy text before seeing the conflict values.
🔴 **Delay = Risk** - Copy that frames deferring a decision as a danger to the organization or workflow.
🔴 **Authority Invocation** - Using the policy name to bully the user (e.g., *"Org Policy 4.2 requires this format"*).

---

## Phase 10 UX Sign-off Criteria
Before Phase 10 can be formally closed, the following must be true:

- [ ] **Can the user ignore this completely?** (Yes. The UI does not demand acknowledgment.)
- [ ] **Does it change nothing if unread?** (Yes. The arbitration flow remains identical to Phase 9.)
- [ ] **Does it preserve calm?** (Yes. Reading the guidance feels like reading a helpful footnote, not a warning label.)

*Signed: Antigravity*
