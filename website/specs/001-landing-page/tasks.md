# Tasks: Cinematic 3D WebGL Tour & Bento Landing Page

**Input**: Design documents from `/specs/001-landing-page/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: Tests are included under E2E testing framework (Playwright).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Paths assume files are located at the repository root: `index.html`, `style.css`, `main.js`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize package manager and folder layout per plan.md
- [ ] T002 Configure Vite config and entry scripts in `package.json` and `vite.config.js`
- [ ] T003 [P] Configure ESLint and Prettier for the front-end layout in `.eslintrc.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Install primary dependencies (`three`, `gsap`, `lenis`) in `package.json`
- [ ] T005 Setup Vite development server script and verify build in `vite.config.js`
- [ ] T006 [P] Configure global CSS reset and design tokens (variables) in `style.css`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Cinematic Landing & Bento Layout (Priority: P1) 🎯 MVP

**Goal**: Establish the bento-box landing page structure, styles, and smooth scrolling context.

**Independent Test**: Load `index.html`, verify that elements are positioned in a responsive grid, and verify Lenis provides smooth inertial scrolling.

### Implementation for User Story 1

- [ ] T007 [P] [US1] Create the HTML structure with Bento box containers in `index.html`
- [ ] T008 [P] [US1] Implement CSS Grid and responsive styles for Bento boxes in `style.css`
- [ ] T009 [US1] Initialize Lenis smooth scroll and connect to GSAP tick loop in `main.js`
- [ ] T010 [US1] Animate bento layout panels into view on scroll using GSAP ScrollTrigger in `main.js`

**Checkpoint**: User Story 1 is fully functional and testable independently.

---

## Phase 4: User Story 2 - Cinematic 3D WebGL Application Tour (Priority: P2)

**Goal**: Build the interactive Three.js 3D WebGL tour of the application, rendering device models and binding camera movement to scroll depth.

**Independent Test**: WebGL canvas initializes, loads mockups, and responds to scroll progression.

### Implementation for User Story 2

- [ ] T011 [P] [US2] Create the global background canvas and Glow Blobs wrapper in `index.html`
- [ ] T012 [P] [US2] Style canvas viewport and Glow Blob keyframe animations in `style.css`
- [ ] T013 [US2] Initialize Three.js WebGLScene (Scene, Camera, Renderer, Postprocessing passes) in `main.js`
- [ ] T014 [US2] Load GLTF mockups (Desktop, Mobile, Web) using GLTFLoader in `main.js`
- [ ] T015 [US2] Bind Three.js camera position and rotation paths to GSAP ScrollTrigger timeline in `main.js`

**Checkpoint**: User Stories 1 and 2 work together, providing a scroll-linked 3D experience.

---

## Phase 5: User Story 3 - Ambient Sound Synthesis & Audio Feedback (Priority: P3)

**Goal**: Integrate the native Web Audio API synthesizer engine, providing ambient drones and interactive audio hover effects with a mute control toggle.

**Independent Test**: Sound control button toggle works, ambient drone starts on interaction, and mouse hovers play synthesized sounds.

### Implementation for User Story 3

- [ ] T016 [P] [US3] Create Sound Control Toggle Button markup and SVG EQ bars in `index.html`
- [ ] T017 [P] [US3] Add styling, hover animations, and muted states for Sound Button in `style.css`
- [ ] T018 [US3] Implement AudioSynthEngine with custom drone oscillators and tape hiss generator in `main.js`
- [ ] T019 [US3] Implement dynamic sound hover effects for bento grid interactive cards in `main.js`
- [ ] T020 [US3] Bind click toggle to MasterGain node, synchronizing mute states to LocalStorage in `main.js`

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility optimization, final verification, and performance tuning.

- [ ] T021 [P] Implement `prefers-reduced-motion` CSS overrides in `style.css` and JS blocks in `main.js`
- [ ] T022 Optimize loading screen assets (WebGL textures, GLTF models) for web performance
- [ ] T023 Run end-to-end user journey validation using the `quickstart.md` guide
- [ ] T024 Verify all assets are committed and run `graphify update .` to keep the codebase graph in sync

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1 (Bento Grid & Scrolling).
4. **STOP and VALIDATE**: Verify bento layout responsiveness and scroll-trigger animations.

### Incremental Delivery

1. Deploy Bento page (MVP).
2. Merge 3D tour (User Story 2) to background canvas.
3. Integrate Synthesizer Audio layer (User Story 3).
4. Run final polish (Phase 6).
