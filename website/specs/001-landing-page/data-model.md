# Data Model: Cinematic 3D WebGL Tour & Bento Landing Page

## WebGL & UI Configuration Entities

### 1. WebGLScene (System Class)
Manages the lifetime and rendering loop of the Three.js 3D canvas.

**Properties:**
- `container`: DOM Element holding the canvas.
- `scene`: THREE.Scene instance.
- `camera`: THREE.PerspectiveCamera instance.
- `renderer`: THREE.WebGLRenderer instance.
- `composer`: EffectComposer (for Bloom, Film Grain, and Vignette passes).
- `models`: Object storing references to loaded GLTF device meshes.
- `loaded`: Boolean indicating if all assets are ready.

---

### 2. ScrollController (System Class)
Binds page scroll progress to Three.js camera movement and model animations.

**Properties:**
- `triggerElement`: The scroll container DOM Element.
- `gsapTimeline`: GSAP timeline instance driving the transitions.
- `cameraPath`: Interpolation path (Spline) for camera coordinates.

---

### 3. AudioEngine (System Class)
Synthesizes background atmosphere and interactive sound effects.

**Properties:**
- `ctx`: WebAudio AudioContext.
- `masterGain`: GainNode controlling overall volume.
- `droneOscillators`: Array of OscillatorNodes synthesizing the background drone.
- `isMuted`: Boolean flag tracked in LocalStorage as `mediahive_audio_muted`.
- `enabled`: Boolean flag checking OS prefers-reduced-motion.
