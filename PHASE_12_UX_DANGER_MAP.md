# Phase 12 UX Danger Map (Stop List)

**Focus:** Psychological correctness and cognitive safety during simulations.

## 🔴 The Stop List
If any of these patterns are detected during implementation or review, you must Stop. Do not fix forward. These patterns violate the cognitive safety of the simulation boundary.

🔴 **Preview that looks like final state**
   - **Why it fails:** The user loses track of whether they are looking at reality or a simulation.
   - **Requirement:** Simulations must have a distinct visual boundary or persistent indicator (e.g., a "Preview" banner or distinct background hue).

🔴 **Auto-commit after preview**
   - **Why it fails:** A preview is an exploration, not a confirmation step in a wizard. Auto-committing merges thought with action, breaking trust.
   - **Requirement:** The user must explicitly exit the preview and take action in the real application state.

🔴 **Emotional language**
   - **Why it fails:** Words like "Warning", "Severe", or "Optimal" override the user's judgment with the system's opinion.
   - **Requirement:** Outcomes must be stated structurally (e.g., "This results in 4 schedule conflicts").

🔴 **Preview that blocks real work**
   - **Why it fails:** Running a simulation should not freeze the user's primary workspace or demand immediate resolution.
   - **Requirement:** Simulations must be side-by-side, in a dedicated non-blocking panel, or easily dismissible without losing work.

🔴 **Preview remembered across sessions**
   - **Why it fails:** Simulations are ephemeral "what-ifs." Persisting a preview state across reloads causes profound confusion about actual committed state.
   - **Requirement:** Previews must vanish entirely if the session is closed, refreshed, or explicitly exited.
