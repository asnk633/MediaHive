# Phase 12 Simulation UX Contract

**Focus:** UX Semantics, Cognitive Safety, Neutral Framing
**Role:** Defining how simulations are understood, presented, and escaped without anxiety or suggestion. Responsibility is psychological correctness.

## 1. Simulation UX Contract (The Promise)
The explicit promise to the user is: **"This is a preview. Nothing will be saved or applied."**
This promise must be:
- **Visible:** Clearly stated when entering any simulation state.
- **Calm:** Presented as a structural fact, not a cautionary warning.
- **Repeated subtly:** Visible without being loud or distracting throughout the simulated session.

## 2. Language & Tone Rules
Simulation language must remain objective, descriptive, and emotionally flat. No directional framing or value judgments are allowed.

### ✅ Allowed Vocabulary:
- "If you chose..."
- "This would result in..."
- "Preview only"
- "No changes applied"

### 🚫 Forbidden Vocabulary:
- "Recommended"
- "Best option"
- "Safer"
- "Warning"
- "Impact severity"

## 3. UI Containment Rules
The boundary between a simulation and reality must be structurally absolute.
- Placements must be **visually distinct** from real actions.
- Simulations must **never replace** real controls in the main view.
- There must always be an **obvious exit** from the simulation back to reality.

### Required Controls:
- "Close preview"
- "Back to current state"

### Forbidden Controls / Behaviors:
- "Apply now" (Simulations are read-only views of potential futures; you cannot directly 'apply' a preview. The user must return to reality to execute the intent.)
- "Proceed"
- Auto-navigation out of the preview context into a committed state.

## 4. Neutral Comparison Design
When a simulation presents multiple outcomes or paths, it must not guide the user toward a preferred choice.
- **No highlighting** of "better" options.
- **No ordering** by "good/bad" or severity.
- **Equal visual weight** for all presented outcomes.
- Layouts must be **side-by-side or tabbed** for fair comparison.
- **No default selection** or pre-filled "best guess."
