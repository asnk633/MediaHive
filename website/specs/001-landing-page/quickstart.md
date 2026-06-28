# Quickstart Guide: Cinematic 3D WebGL Tour & Bento Landing Page

This guide outlines how to run and validate the landing page locally.

## Prerequisites

- Node.js (v18+)
- Active internet connection (for CDN fonts/scripts)

## Setup & Run

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open the browser to the local URL (usually `http://localhost:5173`).

## Validation Scenarios

### Scenario 1: Initial Load & Preloader
1. Clear browser cache and refresh page.
2. Verify the preloader overlay is displayed with loading indicators.
3. Once all Three.js assets resolve, verify the preloader fades out, and the landing page content transitions in smoothly.

### Scenario 2: Immersive 3D Scrolling Showcase
1. Scroll down the landing page.
2. Verify that the 3D models rotate and animate smoothly according to scroll depth.
3. Verify that scrolling is fluid and maintains a high frame rate (>= 60 FPS).

### Scenario 3: Audio Synthesis Muting
1. Click anywhere to activate audio. Verify low atmospheric hum plays (if unmuted).
2. Hover over buttons. Verify tick/hover sound synthesis triggers.
3. Click the fixed Sound Button at the bottom-right corner. Verify audio silences immediately and remains muted after refreshing the page (stored in LocalStorage).
