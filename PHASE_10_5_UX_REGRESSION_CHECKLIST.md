# Phase 10.5 UX Regression Checklist

**Purpose:** 
This checklist must be evaluated by reviewers on any Pull Request that touches the Conflict UI, Policy Guidance, or Sync-related UX.

If any answer to a **FAIL** question is "YES", the Pull Request must be rejected.
If any answer to a **PASS** question is "NO", the Pull Request must be rejected.

---

## 🛑 FAIL Questions (If YES = Reject PR)
- [ ] **Urgency:** Does this UI introduce any urgency cues (e.g., countdowns, expiry dates, or phrases like "Action Required")? 
- [ ] **Bias:** Does the UI visually or contextually favor one resolution option over another (e.g., highlighting the "Server" button more prominently because it aligns with a policy)?
- [ ] **Focus Hijacking:** Does the interface alter default focus or steal focus upon mounting to force the user's attention to the conflict?
- [ ] **Authority Violations:** Does the system resolve a conflict or make a choice *for* the user in the background?
- [ ] **Coercion:** Does the UI frame leaving the screen without deciding as a failure or a risk (e.g., "Are you sure you want to abandon these conflicts?")?

## ✅ PASS Questions (If NO = Reject PR)
- [ ] **Safety to Ignore:** Can the user safely exit the screen, ignore the guidance completely, and continue using the app without any functional degradation?
- [ ] **Calm Baseline:** Does the screen feel like an informational inbox rather than an error log?
- [ ] **Neutral Verbs:** Are all actions described using neutral verbs ("Review", "Decide Later", "Dismiss")?
- [ ] **Unchanged Arbitration Rules:** If unread, does the conflict arbitration flow still obey exact Phase 9 behavior without side effects?
- [ ] **Information Hierarchy:** Is the policy guidance presented as secondary context rather than the primary reason for the screen's existence?

## Escaping the Firewall
If a change inherently violates this checklist but is deemed absolutely necessary by the product owner, it must bypass Phase 10.5 entirely, undergo architectural review, and be scoped as a new major phase. **Silent UX drift is forbidden.**
