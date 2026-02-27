# Phase 11 Authority UX Contract

**Focus:** UX legitimacy, calm enforcement, human safety
**Fail if:** enforcement feels like punishment, urgency, or system error.

## 1. Core Philosophy
The system exists to support the user's authority, not to override it. Enforcement of rules must always preserve the user's dignity, intent, and agency. Conflicts or rule boundaries are presented as neutral state information, not behavioral corrections.

## 2. Enforcement Copy Templates
All enforcement copy must adhere to a neutral, descriptive tone without judgment or urgency.

### Inline Messaging
*Used near the input or action that triggers a rule.*
- **Template:** "This [Field/Action] is managed by [Rule]."
- **Example:** "This clearance level is managed by Organization Policy 4.2."

### Hover (Tooltip) Messaging
*Used to provide context without cluttering the UI, triggered by an info icon or disabled element.*
- **Template:** "Governed by [Rule]. [Reason]."
- **Example:** "Governed by Media Security Protocol. File size exceeds standard limits for automated processing."

### Disabled-State Explanations
*Used when an action is unavailable due to a rule. Must never be a dead end.*
- **Template:** "[Action] requires [Condition]. [Escalation Path]."
- **Example:** "Publishing requires Lead Approval. You may save as a draft or request an exception."

## 3. Required Metadata
When a rule constraint is displayed, the following metadata must be visibly accessible (e.g., via a detail popover, hover card, or expanded view):
- **Rule:** The specific policy or constraint name.
- **Owner:** The entity or role responsible for the rule.
- **Scope:** How broadly the rule applies (e.g., "Global", "Project-specific").
- **Reason:** The brief, objective rationale for the rule.

## 4. Escalation UX
When a user encounters a hard constraint, the UI must provide clear, non-punitive paths forward.
- **"Request exception":** Initiates a secondary workflow to bypass the rule, keeping the user in context.
- **"Ask admin":** Triggers a communication to the rule owner without losing current progress.
- **"Save draft":** Allows the user to park their work indefinitely until the constraint is resolved.

## 5. Input Preservation
**No Modal Traps:** Users must never be forced to discard their input to escape an enforcement screen. If an action cannot proceed, all entered data must be preserved locally or as a draft.
