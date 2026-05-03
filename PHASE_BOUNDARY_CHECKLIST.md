# MediaHive Phase Boundary Checklist (Regression Firewall)

**Purpose**
To prevent future work from silently violating guarantees established in completed phases — especially around user intent, trust, calm UX, and offline safety.

This checklist must be reviewed before merging any work that:
- touches data flow
- affects sync, conflicts, or awareness
- changes UX signals or language
- introduces automation, policy, or heuristics

## 🧱 Global Invariants (Applies to ALL Future Phases)
*These must never be violated.*

**User Authority**
- [ ] No user decision is auto-executed without explicit intent
- [ ] No background system action overwrites user data silently
- [ ] Deferring a decision never causes data loss
- [ ] "Do nothing" is always a safe option

**Psychological Safety**
- [ ] No urgency framing (no red, no pulse, no countdowns)
- [ ] No coercive copy ("must", "required", "fix now")
- [ ] No blocking modals for non-fatal conditions
- [ ] Leaving a screen never implies failure or risk

**Time Safety**
- [ ] No behavior depends on arbitrary timers (timeouts, delays)
- [ ] All sequencing is state-driven, not time-driven
- [ ] Replay, awareness, and conflicts respect strict ordering

## 🔌 Phase 7 Boundary — Offline & Intent Durability
*Nothing may weaken these guarantees.*

**Offline Queue**
- [ ] No retry exhaustion deletes user intent
- [ ] Network instability pauses, never destroys
- [ ] Auth expiration pauses replay globally
- [ ] Queue can survive reloads, restarts, long downtime

**Mutations**
- [ ] All user changes route through standard `mutate()`
- [ ] `OfflineQueue` remains the single source of truth
- [ ] No alternate mutation path bypasses the queue
- [ ] No background mutation execution without user action

🚫 **Hard Stop if:**
- A mutation is removed because "too many retries"
- A failure silently clears queued intent

## 👁️ Phase 8A Boundary — Real-Time Awareness (Read-Only)
*Awareness must remain informational only.*

**Awareness Rules**
- [ ] Awareness never mutates local or server state
- [ ] Awareness never interrupts user work
- [ ] Awareness buffers when offline, replaying, or dirty
- [ ] Self-echoes are always ignored

**Ordering Guarantee**
- [ ] Offline replay completes before awareness flush
- [ ] Awareness flush completes before conflict detection
- [ ] No awareness logic executes mid-replay

🚫 **Hard Stop if:**
- Awareness applies data directly
- Awareness influences resolution logic

## ⚖️ Phase 8B Boundary — Conflict Arbitration (Detection Only)
*Conflict logic must stay pure and isolated.*

**Detection**
- [ ] Conflicts detected only when:
  - `isOnline`
  - `!isReplaying`
  - `!isPaused`
  - `!hasPatch`
  - `isBootComplete`
- [ ] No detection during replay or editing
- [ ] No auto-resolution logic exists

**Taxonomy**
- [ ] Every conflict is exactly one of:
  - Benign
  - Content
  - Structural
- [ ] Structural markers are explicit (no heuristics)
- [ ] Benign auto-accept is mathematically safe only

🚫 **Hard Stop if:**
- Conflicts merge fields automatically
- Detection fires during replay or typing

## 🧭 Phase 9 Boundary — Conflict Resolution UX
*Conflict Resolution Center must remain optional and calm.*

**Navigation**
- [ ] No auto-navigation to Conflict Center
- [ ] Entry points are passive indicators only
- [ ] Conflicts never hijack user flow

**UI Semantics**
- [ ] No red badges, pulse, animation, or urgency
- [ ] Language uses neutral verbs (Review, Decide, Defer)
- [ ] "Decide later" always available
- [ ] Leaving causes no mutation

**Resolution Actions**
- [ ] Keep Local → standard `mutate()` path
- [ ] Keep Server → local patch purge only
- [ ] No merge logic
- [ ] No policy-based recommendations

🚫 **Hard Stop if:**
- UI suggests a "correct" choice
- User is forced to resolve to proceed

## 🧪 Regression Test Scenarios (Must Still Pass)
*After any relevant change, mentally or practically verify:*

- [ ] User goes offline, edits, reloads, reconnects → intent intact
- [ ] User ignores conflicts for days → app calm
- [ ] Auth expires mid-replay → queue pauses, nothing lost
- [ ] Network flaps → no deletion, no spam
- [ ] Awareness events arrive during replay → deferred
- [ ] Conflict appears → no forced action

## 🛑 Escalation Rule

If any single checkbox fails:
1. **STOP**
2. Do not "fix forward"
3. Document the violation
4. Re-evaluate the phase boundary
5. Decide intentionally whether a new phase is required

## 🧠 Mental Anchor (Read This Before Every Merge)

> "The system exists to hold user intent safely across time, network, and uncertainty — not to optimize outcomes on their behalf."

If a change violates that sentence, it violates the architecture.
