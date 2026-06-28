Place your MacBook GLTF/GLB model here as:
  macbook.glb

Free sources:
  - https://sketchfab.com/search?q=macbook&type=models&license=free
    (filter: Downloadable → Free → Download as GLB)

The code in main.js will:
  1. Try to load /models/macbook.glb automatically
  2. If found → replaces the procedural fallback with the real model
  3. If NOT found → shows the procedural MacBook silently (no crash)

The screen canvas texture and lid scroll animation
will work correctly with either path.
