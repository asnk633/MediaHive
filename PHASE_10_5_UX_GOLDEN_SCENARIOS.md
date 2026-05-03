# Phase 10.5 UX Golden Scenarios

**Purpose:**
These are 5 canonical UX scenarios that must always resolve to a state of calm. They serve as mental "golden tests" during development and QA. If any of these scenarios elicit a feeling of "I should deal with this right now," the implementation has failed the phase boundary.

---

### Scenario 1: The Long Ignore
**Context:** A user generates a conflict, goes offline, syncs, and then ignores the resulting conflict in the Resolution Center for three weeks.
**Required Outcome:** The app remains completely calm. The conflict sits quietly in the queue. No emails are sent, no badges turn red, no banners appear on the dashboard. It waits patiently for the user.

### Scenario 2: The Swarm
**Context:** A user goes offline for a month and reconnects, spawning 400 separate task conflicts across the app.
**Required Outcome:** The Conflict Center simply shows "400". The UI does not change layout, crash, or inject red panic. The user can review them one by one, or just close the app and go home. 

### Scenario 3: The Blind Eye
**Context:** The Conflict Center contains heavily detailed policy guidance about why a specific task differs from the server. The user clicks `Keep Local` without ever reading the guidance paragraph.
**Required Outcome:** The local change is queued. No modal stops them to ask "Are you sure you want to ignore Org Policy?" The action completes exactly as it would if the guidance didn't exist.

### Scenario 4: The Ghost Exit
**Context:** A user opens the Conflict Resolution Center, clicks into a conflict detail pane, reads the options, feels overwhelmed, and clicks the global `Back` or `Home` button without making a decision.
**Required Outcome:** The app navigates away instantly. No confirmation dialog appears saying "Leaving so soon?" The conflict remains in the `Surfaced` state, safe for another day.

### Scenario 5: The Prodigal Return
**Context:** A user hasn't logged in for 6 months. Upon logging in, old sync conflicts finish buffering.
**Required Outcome:** The dashboard loads normally. No modal pops up upon boot forcing them to clear old data. The conflict indicator rests quietly in the navigation bar waiting for discovery on the user's terms.
