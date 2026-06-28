# Research: Cinematic 3D WebGL Tour & Bento Landing Page

## Decisions & Rationale

### 1. WebGL Framework: Native Three.js
- **Decision**: Use native Three.js via ES imports bundled by Vite.
- **Rationale**: Minimal overhead, high-performance rendering, and exact control over loading GLTF assets and lighting setups. Next.js or React-Three-Fiber is unnecessary since this is a lightweight vanilla JS/HTML landing page.
- **Alternatives Considered**: Babylon.js (too heavy/enterprise), vanilla WebGL (too low-level and high complexity).

### 2. Scroll Animation: GSAP with ScrollTrigger
- **Decision**: Use GreenSock Animation Platform (GSAP) with the ScrollTrigger plugin.
- **Rationale**: GSAP is the industry standard for high-performance scroll-linked animations, offering sub-pixel interpolation, smooth scrubs, and excellent easing functions.
- **Alternatives Considered**: ScrollMagic (deprecated/outdated), CSS Scroll-driven animations (not universally supported yet).

### 3. Audio Synthesis: Native Web Audio API
- **Decision**: Build a custom synthesizer from scratch using Web Audio API nodes.
- **Rationale**: Zero dependency file size impact, fully customizable waveform Generation, and perfect alignment with custom visual animations.
- **Alternatives Considered**: Tone.js (too large, adds ~500kb footprint for simple drones and hovers), Howler.js (primarily for pre-recorded audio files, not generative synthesis).
