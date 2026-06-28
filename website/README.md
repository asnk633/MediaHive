# MediaHive - Cinematic 3D Scroll Landing Page

This is a premium, scroll-driven interactive landing page for **MediaHive** built using **HTML5, CSS3, Vanilla JavaScript, Three.js, and GSAP ScrollTrigger**. 

It details a cinematic 3D journey through 7 distinct Acts, showcasing MediaHive's cross-platform capabilities (Desktop, Mobile, and Web) inside a WebGL workspace.

---

## Technical Stack & Architecture

- **Rendering Engine:** Three.js (WebGL with ACESFilmic Tone Mapping and PCFSoftShadowMap)
- **Animation Choreography:** GSAP + ScrollTrigger (scrub: 1.5 for cinematic pacing)
- **Smooth Scroll:** Lenis integration
- **Typography:** Playfair Display (headings), Inter (body), Caveat (handwriting)
- **Asset Strategy:** High-fidelity procedural PBR modeling and Canvas textures. No heavy external model dependencies, ensuring load speeds and full responsive scaling.
- **Audio System:** Custom Web Audio API synthesizer. Default opt-in, muted, with state persisted in `localStorage`. Synthesizes room hum, tape hiss, and micro-SFX (hinge creaks, chimes, servo clicks, paper rustling) programmatically with 0-byte download requirements.

---

## 7 Cinematic Acts

### Act 1 — The Table (Hero / Initial Load)
- **Camera:** TOP-DOWN (90° birds-eye view).
- **Scene:** Walnut wood grain desk cluttered with Sony A7 IV camera, DJI Mini 4 Pro drone (rotors active), mechanical keyboard, gaming mouse, coiled USB-C cable, clear ruler, pencils, Micron pen, logo sketch paper, and pastel sticky notes with handwritten tasks.
- **Text:** *"Everything you create. One place. Meet Media Hive."*

### Act 2 — The Clearing
- **Trigger:** Scroll down.
- **Scene:** Clutter elements animate away in physics-like arcs. Sticky notes peel off and fly away. A spotlight turns on a closed MacBook Pro centering on the desk.
- **Sound:** Paper rustle and item sliding friction SFX.

### Act 3 — Laptop Opens
- **Trigger:** Scroll zone 2.
- **Scene:** MacBook lid rotates open. Camera smoothly pivots from top-down to 45° to front-facing, zooming into the screen.
- **Overlay:** The Media Hive Desktop Welcome login screen and live dashboard fade in as a crisp interactive HTML overlay.
- **Sound:** satisfying hinge creak + harmonic boot chime.

### Act 4 — The Mobile
- **Trigger:** Scroll zone 3.
- **Scene:** Laptop closes and slides away. An articulated 2-joint robotic arm (brushed titanium, clip grip) enters from the right holding an iPhone 15 Pro. The screen wakes up.
- **Overlay:** Interactive Mobile App screen fades in showing check-in swipe-to-unlock and task checklist.
- **Sound:** Robotic servo click and lock clicks.

### Act 5 — Web Version
- **Trigger:** Scroll zone 4.
- **Scene:** Robotic arm exits. Laptop slides back up and opens.
- **Overlay:** Web App dashboard fades in. User can toggle themes (purple/cyan) and view checklists.
- **Sound:** Hinge creak + boot chime.

### Act 6 — The Wall
- **Trigger:** Scroll zone 5 (Features).
- **Scene:** Laptop closes and slides down. Camera tilts up to reveal the projector wall behind the desk (ambient hexagonal honeycomb pattern).
- **Overlay:** HTML Feature cards reveal dynamically with slide + fade stagger delays.
- **Sound:** Projector hum and fan whir.

### Act 7 — Wide Angle Creator & Credits
- **Trigger:** Scroll zone 6 (Footer).
- **Scene:** Camera settles on a cinematic wide angle showing both desk and wall. Text pages scroll up containing the Creator section, technology badges, FAQ accordion, and footer links.

---

## File Structure

- [index.html](file:///d:/MediaHive%20App/website/index.html): Structure containing header, text overlays, and interactive mockup dashboards.
- [style.css](file:///d:/MediaHive%20App/website/style.css): Styling guidelines, CSS variables, and layout overrides.
- [main.js](file:///d:/MediaHive%20App/website/main.js): Procedural 3D builders, lighting, Web Audio synthesis, and GSAP ScrollTrigger timeline.
- `vite.config.js`: Port 3000 local dev server configuration.
- `package.json`: Dependency listing.

---

## Setup & Running Locally

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Run the local development server:**
   ```bash
   npm run dev
   ```
   *Vite will start the server on [http://localhost:3000](http://localhost:3000) and automatically launch it in your browser.*

3. **Compile build bundle for production:**
   ```bash
   npm run build
   ```
   *Compiles minified HTML/CSS/JS chunks to the `dist/` directory.*
