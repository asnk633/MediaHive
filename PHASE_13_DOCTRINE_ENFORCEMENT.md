# PHASE 13 — DOCTRINE ENFORCEMENT & AUTHORITY HARDENING

## 1. Purpose
Phase 13 ensures that:
- The Architecture Doctrine cannot be accidentally violated.
- Authority boundaries cannot silently erode.
- Psychological neutrality cannot drift over time.
- Future contributors cannot unintentionally introduce coercive patterns.

This phase converts doctrine from "guidelines" into enforced architecture constraints.

## 2. Phase 13 Principle
Governance must be system-enforced, not memory-dependent.
Human discipline is unreliable at scale. Phase 13 ensures the system protects its own philosophy.

## 3. Structural Objectives
Phase 13 introduces:
- Language Guardrails
- UI Pattern Enforcement
- Role Authority Locking
- Doctrine Compliance Checks
- Drift Detection Mechanisms

## 4. Language Guardrail Engine

### 4.1 Forbidden Vocabulary Registry
Create a centralized, enforced registry:
```typescript
FORBIDDEN_TERMS = [
  "recommended",
  "best option",
  "safer",
  "warning",
  "critical",
  "optimal",
  "must fix",
  "violation"
]
```
This registry must:
- Be version-controlled
- Be importable across UI layers
- Be checked in CI

If forbidden language appears in:
- UI copy
- Toast messages
- Enforcement messages
- Simulation descriptions

Build must fail.

### 4.2 Enforcement Copy Templates
All enforcement must originate from structured templates:

Example:
```typescript
enforce({
  ruleId: "ROLE_ADMIN_REQUIRED",
  explanation: "This action requires Admin role.",
  alternative: "Request exception or contact Admin."
})
```
No ad-hoc enforcement messaging allowed.

## 5. UI Pattern Enforcement

### 5.1 Modal Usage Restrictions
Modal overlays are prohibited for:
- Simulation
- Comparison views
- Informational previews

Allowed only for:
- Critical destructive confirmations
- Authentication boundaries

**CI rule:** If component includes `aria-modal="true"` or full-screen overlay styling → require review.

### 5.2 Simulation Structural Rules
All simulation components must:
- Use non-blocking side panel pattern
- Include persistent preview indicator
- Avoid default selection
- Avoid ranking
- Introduce a shared `SimulationLayout` component.

No custom implementations allowed.

## 6. Role Authority Hardening

### 6.1 Role Capability Map
Centralize permissions:
```typescript
ROLE_CAPABILITIES = {
  Admin: [...],
  Team: [...],
  Guest: [...]
}
```
UI must never:
- Infer capability from view
- Guess role via conditionals
- Hardcode authority logic inline

All role enforcement must reference a single authority map.

### 6.2 No Silent Role Escalation
Forbidden:
- Auto-promoting users
- Granting temporary hidden permissions
- Bypassing role checks in UI only

All authority checks must occur at:
- UI layer
- API layer
- Mutation layer

Triple-layer verification required.

## 7. Doctrine Compliance Linting
Introduce automated checks:

### 7.1 Language Lint
Flags:
- Emotional framing
- Urgency words
- Persuasive adjectives

### 7.2 Structural Lint
Flags:
- Auto-commit logic
- Silent persistence
- Hidden state mutation

### 7.3 Simulation Lint
Flags:
- Modal simulation usage
- Absence of preview indicator
- Default-selected comparison

Build fails on violation.

## 8. Drift Detection System
Over time, doctrine erosion happens subtly. Phase 13 introduces:

### 8.1 Governance Review Trigger
Any PR that modifies:
- Enforcement
- Role logic
- Simulation engine
- Persistence layer

Requires: Explicit doctrine checklist confirmation

### 8.2 Architectural Diff Warning
When a PR modifies:
- Authority maps
- Simulation engine
- Enforcement templates

Require reviewer to answer:
- Does this introduce persuasion?
- Does this merge thought with action?
- Does this reduce user agency?
- Does this increase structural dominance?

If yes → reject.

## 9. Escalation Integrity Lock
Escalation flows must:
- Remain dignified
- Remain optional
- Remain non-punitive

Phase 13 enforces:
- No mandatory escalation
- No forced exception requests
- No escalation as guilt framing

Escalation remains an option, never a funnel.

## 10. Immutable Simulation Boundary
Simulation must:
- Never write to state
- Never persist
- Never trigger enforcement
- Self-destruct on invalid gates

Introduce unit tests that confirm:
- Removing simulation module does not alter system behavior.
- Simulation cannot influence role authority.

## 11. Governance Red Flags (Automatic Fail)
Phase 13 must automatically fail if:
- Preview becomes modal
- Background dimming returns
- "Recommended" appears in comparison UI
- Auto-save bypasses confirmation boundary
- Enforcement hides rule explanation
- No "temporary exceptions."

## 12. Phase 13 Completion Criteria
Phase 13 is complete when:
- Language guardrails enforced in CI
- Simulation layout standardized
- Role authority centralized
- Doctrine lint rules active
- Governance review checklist integrated into PR workflow

## 13. Outcome of Phase 13
After Phase 13:
- The system protects its own psychological integrity.
- Contributors cannot casually introduce coercion.
- Authority boundaries cannot drift silently.
- Simulation cannot mutate into funneling mechanism.
- Doctrine becomes enforceable infrastructure.

### Phase 13 Summary Statement
Phase 12 ensured the system behaves correctly.
Phase 13 ensures it cannot regress.
