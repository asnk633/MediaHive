import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import GUI from 'lil-gui';


// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);
window.ScrollTrigger = ScrollTrigger;

// Initialize RectAreaLightUniformsLib for RectAreaLight support in MeshStandardMaterial
RectAreaLightUniformsLib.init();

let globalDeskSceneGroup = null;
let globalDeskMesh = null;

function updateTableOpacity(val) {
  if (globalDeskMesh) {
    globalDeskMesh.traverse((child) => {
      if (child.isMesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            mat.transparent = true;
            mat.opacity = val;
          });
        } else if (child.material) {
          child.material.transparent = true;
          child.material.opacity = val;
        }
      }
    });
  }
}


// ==========================================================================
// 0. Audio Subsystem (Web Audio API Synthesizer)
// ==========================================================================
window.MediaHive_AudioConfig = {
  enabled: true,
  isJumping: false,
  settleTimeout: null
};

class AudioSynthEngine {
  constructor() {
    this.isSupported = false;
    this.isMuted = true;
    this.ctx = null;
    this.masterGain = null;
    this.activeVoices = [];
    this.droneGain = null;
    this.hissGain = null;
    this.oscillatorsStarted = false;

    if (!window.MediaHive_AudioConfig.enabled) {
      console.log("[Audio Synth] Audio subsystem disabled via config kill-switch.");
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) {
        console.warn("[Audio Synth] Web Audio API not supported in this browser.");
        return;
      }
      this.ctx = new AudioCtxClass();
      this.isSupported = true;
    } catch (e) {
      console.error("[Audio Synth] Failed to initialize AudioContext:", e);
      return;
    }

    // Safe localStorage read
    try {
      const storedMute = localStorage.getItem('mediahive_audio_muted');
      if (storedMute !== null) {
        this.isMuted = storedMute === 'true';
      }
    } catch (e) {
      console.warn("[Audio Synth] localStorage is blocked:", e);
    }

    // Prefers reduced motion override
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.isMuted = true;
    }

    this.initAudioGraph();
  }

  initAudioGraph() {
    try {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // 1. Ambient Drone Graph
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

      this.droneFilter = this.ctx.createBiquadFilter();
      this.droneFilter.type = 'lowpass';
      this.droneFilter.frequency.setValueAtTime(150, this.ctx.currentTime);

      this.droneGain.connect(this.droneFilter);
      this.droneFilter.connect(this.masterGain);

      // 2. Tape Hiss Graph
      const bufferSize = this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      this.hissSource = this.ctx.createBufferSource();
      this.hissSource.buffer = buffer;
      this.hissSource.loop = true;

      this.hissHP = this.ctx.createBiquadFilter();
      this.hissHP.type = 'highpass';
      this.hissHP.frequency.setValueAtTime(1000, this.ctx.currentTime);

      this.hissLP = this.ctx.createBiquadFilter();
      this.hissLP.type = 'lowpass';
      this.hissLP.frequency.setValueAtTime(4000, this.ctx.currentTime);

      this.hissGain = this.ctx.createGain();
      this.hissGain.gain.setValueAtTime(0.04, this.ctx.currentTime); // very subtle tape hiss background

      this.hissSource.connect(this.hissHP);
      this.hissHP.connect(this.hissLP);
      this.hissLP.connect(this.hissGain);
      this.hissGain.connect(this.masterGain);
    } catch (e) {
      console.error("[Audio Synth] Failed to construct audio graph:", e);
      this.isSupported = false;
    }
  }

  startContinuousOscillators() {
    if (this.oscillatorsStarted || !this.isSupported) return;
    this.oscillatorsStarted = true;

    try {
      const now = this.ctx.currentTime;

      // Start Tape Hiss
      this.hissSource.start(now);

      // Start Ambient Binaural Drone (55Hz / 55.4Hz detuned triangle waves)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = 'triangle';
      this.osc1.frequency.setValueAtTime(55, now);

      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = 'triangle';
      this.osc2.frequency.setValueAtTime(55.4, now);

      this.osc1.connect(this.droneGain);
      this.osc2.connect(this.droneGain);

      this.osc1.start(now);
      this.osc2.start(now);

      // Tape hiss gain LFO modulation
      this.lfo = this.ctx.createOscillator();
      this.lfo.frequency.setValueAtTime(0.2, now); // 0.2Hz slow modulation
      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.setValueAtTime(0.015, now);

      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.hissGain.gain);
      this.lfo.start(now);
    } catch (e) {
      console.error("[Audio Synth] Failed to start continuous oscillators:", e);
    }
  }

  resumeContext() {
    if (!this.isSupported) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.startContinuousOscillators();
      });
    } else {
      this.startContinuousOscillators();
    }
  }

  toggleMute() {
    if (!this.isSupported) return this.isMuted;
    this.resumeContext();

    const now = this.ctx.currentTime;
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);

    if (this.isMuted) {
      this.masterGain.gain.linearRampToValueAtTime(0.8, now + 0.25); // fade in 250ms
      this.isMuted = false;
    } else {
      this.masterGain.gain.linearRampToValueAtTime(0, now + 0.25); // fade out 250ms
      this.isMuted = true;
    }

    try {
      localStorage.setItem('mediahive_audio_muted', this.isMuted);
    } catch (e) {}

    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('mediahive-audio-toggle', { detail: { isMuted: this.isMuted } }));
    return this.isMuted;
  }

  // Voice allocation capping to prevent GC and clipping
  allocateVoice(sourceNodes, gainNode, durationMs) {
    if (this.activeVoices.length >= 3) {
      // Reclaim oldest voice package cleanly
      const oldest = this.activeVoices.shift();
      if (oldest) {
        const now = this.ctx.currentTime;
        oldest.gainNode.gain.setValueAtTime(oldest.gainNode.gain.value, now);
        oldest.gainNode.gain.linearRampToValueAtTime(0, now + 0.2); // Clean 200ms ramp down to prevent pop
        
        setTimeout(() => {
          oldest.sources.forEach(src => {
            try { src.stop(); src.disconnect(); } catch (e) {}
          });
          try { oldest.gainNode.disconnect(); } catch (e) {}
        }, 220);
      }
    }

    const voice = { sources: sourceNodes, gainNode: gainNode };
    this.activeVoices.push(voice);

    setTimeout(() => {
      const idx = this.activeVoices.indexOf(voice);
      if (idx !== -1) {
        this.activeVoices.splice(idx, 1);
      }
      const now = this.ctx.currentTime;
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
      
      setTimeout(() => {
        sourceNodes.forEach(src => {
          try { src.stop(); src.disconnect(); } catch (e) {}
        });
        try { gainNode.disconnect(); } catch (e) {}
      }, 220);
    }, durationMs);
  }

  playUIFeedback(type) {
    if (!this.isSupported || this.isMuted) return;
    this.resumeContext();

    const now = this.ctx.currentTime;

    if (type === 'hover') {
      // Soft, high-frequency chime
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000, now);
        
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        this.allocateVoice([osc], gain, 150);
      } catch (e) {}
    } else if (type === 'click') {
      // High frequency glass click
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        this.allocateVoice([osc], gain, 60);
      } catch (e) {}
    } else if (type === 'boot') {
      // Harmonic arpeggio sweep chime
      try {
        const freqs = [146.83, 220.00, 293.66, 440.00]; // D3, A3, D4, A4 warm chord
        const sources = [];
        const subMasterGain = this.ctx.createGain();
        subMasterGain.gain.setValueAtTime(0, now);
        subMasterGain.gain.linearRampToValueAtTime(0.18, now + 0.25);
        subMasterGain.connect(this.masterGain);

        freqs.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);

          const voiceGain = this.ctx.createGain();
          voiceGain.gain.setValueAtTime(0, now);
          voiceGain.gain.linearRampToValueAtTime(0.15, now + idx * 0.06 + 0.05);
          voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

          osc.connect(voiceGain);
          voiceGain.connect(subMasterGain);
          osc.start(now);
          sources.push(osc);
        });

        this.allocateVoice(sources, subMasterGain, 1500);
      } catch (e) {}
    } else if (type === 'servo') {
      // FM servo sweep click/slide
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.35);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.14, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        this.allocateVoice([osc], gain, 500);
      } catch (e) {}
    }
  }
}

// Instantiate global audio manager
window.MediaHive_AudioSynth = new AudioSynthEngine();


// // No canvas drawing needed for the desk photo now.
// We animate the DOM elements directly.

// ==========================================================================
// 1. Shared GLTF Loader
// ==========================================================================
const gltfLoader = new GLTFLoader();

// Shared variables
let imgAspectRatio = 1;

// Offscreen canvas for drawing the Desktop App UI
let desktopTexture = null;

window.activeVideoTextures = window.activeVideoTextures || [];

function createVideoTexture(videoUrl, rotation = 0, zoom = 1.0, flipX = false, flipY = false, uvOffset = null, uvScale = null) {
  const video = document.createElement('video');
  video.src = videoUrl;
  video.crossOrigin = 'anonymous';
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.play().catch(e => console.warn("Video autoplay failed:", e));
  
  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.userData = { video, videoUrl };
  window.activeVideoTextures.push(texture);
  // Usually glTF textures expect flipY to be false
  texture.flipY = false;
  
  if (rotation !== 0 || zoom !== 1.0 || flipX || flipY || uvOffset || uvScale) {
    texture.center.set(0.5, 0.5);
  }
  
  if (rotation !== 0) {
    texture.rotation = rotation;
  }
  
  let repeatX = 1 / zoom;
  let repeatY = 1 / zoom;
  
  if (flipX) {
    texture.wrapS = THREE.RepeatWrapping;
    repeatX = -repeatX;
  }
  if (flipY) {
    texture.wrapT = THREE.RepeatWrapping;
    repeatY = -repeatY;
  }
  
  if (uvScale) {
    texture.repeat.set(uvScale.x, uvScale.y);
  } else {
    texture.repeat.set(repeatX, repeatY);
  }
  
  if (uvOffset) {
    texture.offset.set(uvOffset.x, uvOffset.y);
  }
  
  return texture;
}

function createIphoneVideoTexture(videoUrl, originalImage, observerCanvasId) {
  const video = document.createElement('video');
  video.src = videoUrl;
  video.crossOrigin = 'anonymous';
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.play().catch(e => console.warn("Video autoplay failed:", e));
  
  // Downscale canvas to 1024x1024 to reduce GPU upload data by 75% for smooth performance
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  
  // Draw the original texture atlas once at 1024x1024
  ctx.drawImage(originalImage, 0, 0, 1024, 1024);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.userData = { video };
  
  // 1024x1024 scaled coordinates
  const screenX = 259;
  const screenY = 31;
  const screenW = 663;
  const screenH = 769;
  
  const screenCenterX = screenX + screenW / 2;
  const screenCenterY = screenY + screenH / 2;
  
  // Calibrated alignment settings
  const rotation = -1.5708;
  const scaleX = 0.61;
  const scaleY = 0.89;
  const offsetX = -233;
  const offsetY = 105;
  const drawW = 616;
  const drawH = 742;
  
  let isVisible = true;
  let isAnimating = true;
  // Use the provided canvas ID for visibility tracking, or fall back to 'iphone-canvas'
  const watchCanvasId = observerCanvasId || 'iphone-canvas';
  const iphoneCanvas = document.getElementById(watchCanvasId);
  
  let lastRenderTime = 0;
  const FPS_INTERVAL = 1000 / 30; // 30 FPS cap

  function update(now) {
    if (!isVisible) {
      isAnimating = false;
      return;
    }
    requestAnimationFrame(update);
    const timestamp = now || performance.now();
    if (timestamp - lastRenderTime < FPS_INTERVAL) return;
    lastRenderTime = timestamp;

    // Only upload texture to GPU when video moves to a new frame
    if (video.readyState >= video.HAVE_CURRENT_DATA && video.currentTime !== lastTime) {
      lastTime = video.currentTime;
      
      // Clear the screen area
      ctx.fillStyle = '#000000';
      ctx.fillRect(screenX, screenY, screenW, screenH);
      
      ctx.save();
      // Translate to the adjusted center position on the atlas
      ctx.translate(screenCenterX + offsetX, screenCenterY + offsetY);
      
      // Apply calibrated rotation and scaling
      ctx.rotate(rotation);
      ctx.scale(scaleX, scaleY);
      
      // Draw the video frame
      ctx.drawImage(video, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
      
      texture.needsUpdate = true;
    }
  }

  if (iphoneCanvas) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
        
        if (isVisible) {
          video.play().catch(e => console.warn("Iphone video resume failed:", e));
        } else {
          video.pause();
        }

        if (isVisible && !isAnimating) {
          isAnimating = true;
          update();
        }
      });
    }, { threshold: 0 });
    observer.observe(iphoneCanvas);
  }

  let lastTime = -1;
  update();
  
  return texture;
}

function createDesktopTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1440;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');

  // Background: #0D1117
  ctx.fillStyle = '#0D1117';
  ctx.fillRect(0, 0, 1440, 900);

  // Left sidebar (180px): dark #111827 bg
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, 180, 900);

  // Top bar: dark #161B22 bg
  ctx.fillStyle = '#161B22';
  ctx.fillRect(180, 0, 1440 - 180, 60);

  // Top bar logo: amber #F5A623 "MediaHive" logo
  ctx.fillStyle = '#F5A623';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('ðŸ MediaHive', 210, 42);

  // Left sidebar: 5 nav items
  const navItems = ['ðŸ“Š Dashboard', 'ðŸ“‹ Tasks', 'ðŸ“… Calendar', 'ðŸ’¬ Messages', 'âš™ï¸ Settings'];
  navItems.forEach((item, index) => {
    const y = 120 + index * 55;
    if (index === 0) {
      ctx.fillStyle = 'rgba(245, 166, 35, 0.15)';
      ctx.fillRect(10, y - 30, 160, 42);
      ctx.fillStyle = '#F5A623';
    } else {
      ctx.fillStyle = '#8B949E';
    }
    ctx.font = '20px sans-serif';
    ctx.fillText(item, 25, y);
  });

  // Main: 2x2 card grid
  const drawCard = (x, y, w, h, title, lines, color, status) => {
    ctx.fillStyle = '#161B22';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = '#30363D';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(title, x + 25, y + 45);
    ctx.fillStyle = '#8B949E';
    ctx.font = '16px sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, x + 25, y + 95 + i * 30));
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + 35, y + h - 35, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8B949E';
    ctx.font = '15px sans-serif';
    ctx.fillText(status, x + 55, y - 30 + h);
  };

  const cardW = 560, cardH = 340;
  drawCard(220, 100, cardW, cardH, 'Project Transcoding',
    ['Input: Raw 4K Prores RAW','Output: AV1 10bit HDR','Destination: AWS S3 Staging','Speed: 240 fps (GPU Accelerated)'],
    '#F5A623', 'In Progress (78%)');
  drawCard(820, 100, cardW, cardH, 'Server Telemetry',
    ['Sync state: Active','Target: Firestore US-East','Throughput: 1.2 GB/s','Health index: 99.9%'],
    '#4FC3F7', 'Connected');
  drawCard(220, 480, cardW, cardH, 'Broadcast Schedule',
    ['Dept 14: Drone Broadcast','Host: Garden Live Stage','Bandwidth: 15 Mbps RTMP','Delay buffer: 1.5s'],
    '#52C41A', 'Scheduled');
  drawCard(820, 480, cardW, cardH, 'Device Inventory',
    ['Sony FX3 - Dept 4 Checked Out','DJI Mavic 3 - Active Flight','Macbook M3 Max - Admin Desk','Focusrite 4i4 - Checked In'],
    '#722ED1', 'All Assets Logged');

  // Bottom bar
  ctx.fillStyle = '#161B22';
  ctx.fillRect(180, 840, 1440 - 180, 60);
  ctx.fillStyle = '#52C41A';
  ctx.beginPath();
  ctx.arc(210, 870, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8B949E';
  ctx.font = '16px sans-serif';
  ctx.fillText('All Systems Active (Latency: 12ms)', 230, 875);

  desktopTexture = new THREE.CanvasTexture(canvas);
  desktopTexture.colorSpace = THREE.SRGBColorSpace;
  desktopTexture.needsUpdate = true;



  return desktopTexture;
}

// Render the texture when fonts are loaded
if (typeof document !== 'undefined' && document.fonts) {
  document.fonts.ready.then(() => createDesktopTexture());
} else {
  window.addEventListener('load', () => createDesktopTexture());
}

// ==========================================================================
// ==========================================================================
// 3.5. Reveal Text Component Init
// ==========================================================================
function initRevealText() {
  const container = document.querySelector('.reveal-text');
  if (!container) return;
  container.innerHTML = `
    <svg 
      id="text-hover-svg"
      width="100%" 
      height="100%" 
      viewBox="0 0 1500 500" 
      style="overflow: visible; user-select: none; cursor: default; width: 100%; display: block;"
    >
      <defs>
        <!-- Colorful linear gradient for the text fill -->
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#c084fc" />
          <stop offset="25%" stop-color="#818cf8" />
          <stop offset="50%" stop-color="#38bdf8" />
          <stop offset="75%" stop-color="#818cf8" />
          <stop offset="100%" stop-color="#c084fc" />
        </linearGradient>

        <!-- Radial gradient mask for spotlight reveal -->
        <radialGradient id="revealMask" gradientUnits="userSpaceOnUse" r="0%" cx="10%" cy="50%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
          <stop offset="40%" stop-color="#ffffff" stop-opacity="0.8" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>

        <!-- Mask containing the radial gradient -->
        <mask id="textMask">
          <rect x="-100" y="-100" width="1700" height="700" fill="url(#revealMask)" />
        </mask>
      </defs>

      <!-- Layer 1: Background stroke text (Subtle outline, always visible) -->
      <text 
        text-anchor="middle" 
        class="text-stroke"
        font-family="var(--font-title)"
      >
        <tspan x="50%" y="180" font-size="120" font-weight="500" letter-spacing="-1">Meet</tspan>
        <tspan x="50%" y="400" font-size="240" font-weight="900" letter-spacing="-4">MediaHive.</tspan>
      </text>

      <!-- Layer 2: Foreground gradient-filled text (Only visible inside the mask) -->
      <text 
        text-anchor="middle" 
        class="text-fill"
        mask="url(#textMask)"
        font-family="var(--font-title)"
      >
        <tspan x="50%" y="180" font-size="120" font-weight="500" letter-spacing="-1">Meet</tspan>
        <tspan x="50%" y="400" font-size="240" font-weight="900" letter-spacing="-4">MediaHive.</tspan>
      </text>
    </svg>
  `;

  setupTextHoverInteraction();
}

function setupTextHoverInteraction() {
  const svg = document.getElementById('text-hover-svg');
  const revealMask = document.getElementById('revealMask');
  if (!svg || !revealMask) return;

  let isHovered = false;

  const startAutoShine = () => {
    if (isHovered) return;
    gsap.killTweensOf(revealMask);
    gsap.set(revealMask, { attr: { cx: "10%", cy: "50%", r: "0%" } });
    
    // Smoothly breathe in radius, slide across, then fade out in a loop
    const tl = gsap.timeline({ repeat: -1 });
    tl.to(revealMask, { attr: { r: "12%" }, duration: 0.8, ease: "power2.out" })
      .to(revealMask, { attr: { cx: "90%" }, duration: 2.2, ease: "sine.inOut" })
      .to(revealMask, { attr: { r: "0%" }, duration: 0.8, ease: "power2.in" });
  };

  svg.addEventListener('mouseenter', (e) => {
    isHovered = true;
    gsap.killTweensOf(revealMask);
    
    // Scale up the radius
    gsap.to(revealMask, {
      attr: { r: "20%" },
      duration: 0.4,
      ease: "power2.out"
    });
  });

  svg.addEventListener('mousemove', (e) => {
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1500;
    const y = ((e.clientY - rect.top) / rect.height) * 500;
    
    gsap.to(revealMask, {
      attr: { cx: x, cy: y },
      duration: 0.15,
      ease: "power2.out",
      overwrite: "auto"
    });
  });

  svg.addEventListener('mouseleave', () => {
    isHovered = false;
    gsap.to(revealMask, {
      attr: { r: "0%" },
      duration: 0.4,
      ease: "power2.out",
      onComplete: startAutoShine
    });
  });

  startAutoShine();
}

// ==========================================================================
// 4 + 5. Animations
// ==========================================================================
function setupAnimations() {
  // Setup fixed global background color blending
  setupGlobalBackground();

  // Initialize cinematic desk awakening 3D hero background
  initDeskAwakening();

  // Initialize dynamic reveal text layout
  initRevealText();

  // Initialize desktop-overlay
  gsap.set('#desktop-overlay', { opacity: 0, x: -50, pointerEvents: 'none' });

  // Trigger Highlighted Text sliding animations
  setTimeout(() => {
    document.querySelectorAll('.highlighted-text').forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('animate');
      }, index * 250 + 400); // staggered delay
    });
  }, 100);

  // Build scroll timeline for UI elements
  const scrollTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: '#hero-photo-wrapper',
      start: 'top top',
      end: '+=3500',
      pin: true,
      scrub: 1.5,
      onUpdate: (self) => {
        const p = self.progress;
        const heroTextOverlay = document.getElementById('hero-text-container') || document.getElementById('hero-text-overlay');
        
        // Fade hero text early on
        if (heroTextOverlay) {
          if (p > 0.05) {
            const textFade = Math.min(1, (p - 0.05) / 0.07);
            heroTextOverlay.style.opacity = 1 - textFade;
          } else {
            heroTextOverlay.style.opacity = 1;
          }
        }

        // Drive the Blender keyframe animation mixer in sync with the scroll progress.
        if (window.MediaHive_Mixer) {
          const duration   = window.MediaHive_ClipDuration  || 8.333;
          // CLAMP: The Blender clip continues past the "laptop fully open" frame into
          // an unwanted lid-close + aerial camera-swing. We freeze the mixer at the
          // "peak open" time so the last ~600px of the hero pin hold the good frame.
          // window.MediaHive_ClipFreezeTime can be overridden from the browser console
          // to tune the exact freeze point without a code change.
          const freezeAt   = window.MediaHive_ClipFreezeTime ?? (duration * 0.84);
          const mixerTarget = Math.min(p * duration, freezeAt);
          window.MediaHive_Mixer.setTime(mixerTarget);
        }

        // ─── SCROLL DEBUG HUD ─── toggle visibility with Shift+H
        let hud = document.getElementById('mh-scroll-hud');
        if (!hud) {
          hud = document.createElement('div');
          hud.id = 'mh-scroll-hud';
          Object.assign(hud.style, {
            position: 'fixed', top: '12px', right: '12px', zIndex: '99999',
            background: 'rgba(0,0,0,0.85)', color: '#00ff88',
            fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.75',
            padding: '10px 14px', borderRadius: '8px',
            border: '1px solid rgba(0,255,136,0.3)',
            backdropFilter: 'blur(6px)', pointerEvents: 'none', minWidth: '210px',
          });
          document.body.appendChild(hud);
          // Shift+H toggles the HUD
          document.addEventListener('keydown', (e) => {
            if (e.shiftKey && e.key === 'H') hud.style.display = hud.style.display === 'none' ? 'block' : 'none';
          });
        }
        const mixerTime  = window.MediaHive_Mixer ? window.MediaHive_Mixer.time.toFixed(3) : 'N/A';
        const clipDur    = window.MediaHive_ClipDuration  ? window.MediaHive_ClipDuration.toFixed(3)  : '?';
        const freezeAt   = window.MediaHive_ClipFreezeTime;
        const freezeDisp = freezeAt != null ? freezeAt.toFixed(3) + 's' : '~84%';
        const scrollY    = Math.round(window.scrollY);
        const totalH     = document.documentElement.scrollHeight - window.innerHeight;
        hud.innerHTML = `
          <div style="color:#fff;font-weight:bold;margin-bottom:4px">📜 Scroll HUD <span style="color:#555;font-size:10px">(Shift+H)</span></div>
          <div>Progress : <b style="color:#00ff88">${p.toFixed(4)}</b></div>
          <div>Percent  : <b style="color:#00ff88">${(p * 100).toFixed(1)}%</b></div>
          <div>ScrollY  : <b style="color:#ffcc00">${scrollY}px</b></div>
          <div>MaxScroll: <b style="color:#aaa">${totalH}px</b></div>
          <div>Mixer t  : <b style="color:#88ccff">${mixerTime}s</b></div>
          <div>ClipDur  : <b style="color:#cc88ff">${clipDur}s</b></div>
          <div>FreezeAt : <b style="color:#ff88aa">${freezeDisp}</b></div>
          <div>Direction: <b style="color:#ff8844">${self.direction > 0 ? '▼ down' : '▲ up'}</b></div>
        `;
        // ─── END SCROLL DEBUG HUD ───
      },
      onLeaveBack: () => {
        // Hard-reset every scroll-driven element to its initial hidden state
        // so none of them get stranded when the user scrolls all the way back to the top.
        gsap.set('#desktop-overlay', { opacity: 0, x: -50, pointerEvents: 'none', visibility: 'hidden' });
        const finalMsg = document.querySelector('.chaos-message.final');
        if (finalMsg) gsap.set(finalMsg, { opacity: 0, scale: 1, y: 0 });
        const svgEl = document.getElementById('text-hover-svg');
        if (svgEl) gsap.set(svgEl, { opacity: 0, scale: 0.85, y: 30 });
        const heroTextOverlay = document.getElementById('hero-text-container') || document.getElementById('hero-text-overlay');
        if (heroTextOverlay) heroTextOverlay.style.opacity = '1';
      },
    }
  });

  // Cinematic sound effects synchronized via ScrollTrigger timeline
  const triggerBootChime = () => {
    const audioSynth = window.MediaHive_AudioSynth;
    if (!audioSynth || audioSynth.isMuted || window.MediaHive_AudioConfig.isJumping) return;
    if (scrollTimeline.scrollTrigger && scrollTimeline.scrollTrigger.direction > 0) {
      audioSynth.playUIFeedback('boot');
    }
  };

  const triggerServoWake = () => {
    const audioSynth = window.MediaHive_AudioSynth;
    if (!audioSynth || audioSynth.isMuted || window.MediaHive_AudioConfig.isJumping) return;
    if (scrollTimeline.scrollTrigger && scrollTimeline.scrollTrigger.direction > 0) {
      audioSynth.playUIFeedback('servo');
    }
  };

  scrollTimeline.call(triggerBootChime, [], 0.68);
  scrollTimeline.call(triggerServoWake, [], 0.82);

  // Staggered letters Reveal Text ("Meet MediaHive") animation
  const finalMsg = document.querySelector('.chaos-message.final');
  if (finalMsg) {
    // Fade in the container (starts at 1800px scroll / 0.514 progress)
    scrollTimeline.fromTo(finalMsg,
      { opacity: 0 },
      { opacity: 1, duration: 0.04, ease: 'none' },
      0.514
    );

    // Fade/scale in the text-hover-svg (starts at 1800px scroll / 0.514 progress)
    const svgEl = document.getElementById('text-hover-svg');
    if (svgEl) {
      scrollTimeline.fromTo(svgEl,
        { scale: 0.85, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.08, ease: 'back.out(1.2)' },
        0.514
      );
    }

    // Fade out the entire container (starts at 2700px scroll / 0.771 progress, fully gone by 2800px scroll / 0.8 progress)
    scrollTimeline.to(finalMsg,
      { opacity: 0, scale: 0.95, y: -30, duration: 0.029, ease: 'power2.in' },
      0.771
    );
  }

  // Dark Horizon Glow build up inside the main timeline (200px to 2000px scroll)
  scrollTimeline.fromTo('#hero-dark-glow',
    { opacity: 0 },
    { opacity: 1, duration: 0.514, ease: 'none' },
    0.057
  );

  // Desktop overlay appears at 2700px / 0.771 progress and slides in from the left.
  // Using fromTo so GSAP's scrub reversal has an explicit hidden from-state to return to.
  scrollTimeline
    .fromTo('#desktop-overlay',
      { opacity: 0, x: -50, y: 0, visibility: 'hidden' },
      {
        opacity: 1,
        x: 0,
        y: 0,
        visibility: 'visible',
        duration: 0.11,
        ease: 'power1.out',
        onStart: () => gsap.set('#desktop-overlay', { pointerEvents: 'auto' }),
        onReverseComplete: () => gsap.set('#desktop-overlay', { pointerEvents: 'none', visibility: 'hidden', opacity: 0, x: -50, y: 0 })
      }, 0.771)
    .to('#desktop-overlay',
      {
        y: -window.innerHeight,
        opacity: 0,
        duration: 0.12,
        ease: 'power2.in',
        onComplete: () => gsap.set('#desktop-overlay', { pointerEvents: 'none', visibility: 'hidden' })
      }, 0.88);

  // Scroll the 3D canvas upward out of view (instead of fading) in sync with the tablet section
  const deskCanvas = document.getElementById('desk-awakening-canvas');
  if (deskCanvas) {
    scrollTimeline
      .fromTo(deskCanvas,
        { y: 0 },
        { y: -window.innerHeight, duration: 0.12, ease: 'power2.in' },
        0.88);
  }

  // Expose the master scrollTimeline globally so other modules can sync with it
  window.MediaHive_ScrollTimeline = scrollTimeline;
}


// ==========================================================================
// 3.75. Desk Awakening â€” Cinematic 3D Hero Background
// All 8 review findings applied:
//   #1  Lid tween on master timeline (not detached)
//   #2  needsUpdate on every material tween
//   #3  transparent pre-set at init (no shader recompile flash)
//   #4  webglcontextlost/restored listeners
//   #5  PCFShadowMap (not Soft) for BokehPass depth compat
//   #6  Explicit z-indexes handled in HTML
//   #7  Isolated GLTFLoader to prevent shared cache leak
//   #8  Mobile-adaptive DPR + shadow map budget
// ==========================================================================
function initDeskAwakening() {
  const canvas = document.getElementById('desk-awakening-canvas');
  if (!canvas) return;

  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  // --- 1. SceneManager Setup ---
  let renderer;
  let mixer = null;
  let animations = [];
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isMobile, powerPreference: 'high-performance' });
  } catch (err) {
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // Set toneMappingExposure to 1.05 for enhanced visibility while keeping rich contrast
  renderer.toneMappingExposure = 1.05;



  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050319, 0.035);
  let camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(2.49, 14.07, 0.22); 
  const globalLookAt = new THREE.Vector3(2.49, -5.4, 0.22); 

  // Background starts as null (transparent) to blend canvas with page CSS background
  scene.background = null;
  scene.environment = null; // Will be set to PMREM RoomEnvironment below for soft IBL

  // --- Post-Processing: subtle bloom for the laptop screen glow ---
  // (must be created after scene and camera are declared)
  const composer = new EffectComposer(renderer);
  let renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.40,  // strength — beautiful glow in the dark moody scene
    0.5,   // radius
    0.85   // threshold — slightly lower to capture emissive details nicely
  );
  composer.addPass(bloomPass);

  // ==========================================================================
  // === LIGHTING: Matched to Blender source lights + IBL environment       ===
  // ==========================================================================
  // FIX Issue 2: The Blender scene uses a forest.exr HDRI world for soft IBL.
  // Three.js approximation: RoomEnvironment PMREMGenerator gives soft diffuse
  // fill on all PBR surfaces. We use default RoomEnvironment for clean, neutral, realistic reflections.
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const roomEnv = pmremGenerator.fromScene(new RoomEnvironment()).texture;
  scene.environment = roomEnv;   // IBL: soft omnidirectional fill on all PBR surfaces
  scene.background = null;
  pmremGenerator.dispose();

  // Desk centre in Three.js world space (all lights target here)
  const deskCenter = new THREE.Vector3(6.25, 6.10, 0.82);

  // 1. KEY LIGHT — Directional Light with soft shadow mapping.
  //    Color matches Blender Key_Light warm sun-ray tone.
  const keyLight = new THREE.DirectionalLight(0xfff4e0, 0.70);
  keyLight.position.set(4, 10, 6);
  keyLight.target.position.copy(deskCenter);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = isMobile ? 1024 : 2048;
  keyLight.shadow.mapSize.height = isMobile ? 1024 : 2048;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 40;
  keyLight.shadow.camera.left   = -10;
  keyLight.shadow.camera.right  =  10;
  keyLight.shadow.camera.top    =  10;
  keyLight.shadow.camera.bottom = -10;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.radius = 4;
  scene.add(keyLight);
  scene.add(keyLight.target);

  // 2. FILL LIGHT — Soft blue-white from upper-left to fill shadows.
  const fillLight = new THREE.DirectionalLight(0x88bbff, 0.22);
  fillLight.position.set(-4, 8, 4);
  fillLight.target.position.copy(deskCenter);
  scene.add(fillLight);
  scene.add(fillLight.target);

  // 3. RIM LIGHT — Backlight highlighting edges of keyboard/mouse.
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.35);
  rimLight.position.set(0, 5, -8);
  rimLight.target.position.copy(deskCenter);
  scene.add(rimLight);
  scene.add(rimLight.target);

  // 5. AMBIENT LIGHT — Soft ambient fill to soften shadows and make desk texture visible
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambientLight);

  // 4. Screen glow PointLight — blue glow from screen, start at 0.0 intensity
  const screenGlow = new THREE.PointLight(0x4488ff, 0.0, 8, 1.5);
  screenGlow.position.set(6.25, 7.5, 0.82); // positioned above laptop
  scene.add(screenGlow);


  // --- 2. GLTFModelLoader Setup ---
  const loadingManager = new THREE.LoadingManager();
  loadingManager.onProgress = (url, loaded, total) => {
     const pct = Math.round((loaded/total)*100);
     const bar = document.querySelector('.preloader-progress');
     if(bar) bar.style.width = pct + '%';
  };
  loadingManager.onLoad = () => {
     const preloader = document.getElementById('cinematic-preloader');
     if(preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => preloader.style.display = 'none', 500);
     }
  };

  const loader = new GLTFLoader(loadingManager);
  const sceneGroup = new THREE.Group();
  scene.add(sceneGroup);

  let laptopLid = null;
  let screenMesh = null;
  let plantObj = null;
  let logoMeshesToHide = [];
  let logoMeshesToBlend = [];
  let clutterObjects = [];
  let laptopVideoElement = null;
  let laptopVideoTexture = null;

  const materials = {
     'macBook-mockup': new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.2, metalness: 0.9 }),
     'desk': new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, metalness: 0.2 }),
     'clutter': new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.4, metalness: 0.1 }),
  };
  
  // Screen material — starts emissive at 1.2 so the blue glow is visible from frame 1
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.0,
    roughness: 0.9,
    metalness: 0.0,
    envMapIntensity: 0.0,
    side: THREE.DoubleSide
  });

  loader.load('/animated_mockup_macbook_pro.glb?v=99', (gltf) => {
    const model = gltf.scene;
    
    let bbox = new THREE.Box3();
    model.traverse((child) => {
       if (child.name.toLowerCase().includes('macbook')) {
           bbox.expandByObject(child);
       }
    });
    if(bbox.isEmpty()) bbox.setFromObject(model);

    const sz = new THREE.Vector3();
    bbox.getSize(sz);
    const scale = 1.0;
    model.scale.setScalar(scale);
    
    model.updateMatrixWorld(true);

    bbox = new THREE.Box3();
    model.traverse((child) => {
       if (child.name.toLowerCase().includes('macbook')) {
           bbox.expandByObject(child);
       }
    });
    if(bbox.isEmpty()) bbox.setFromObject(model);

    const center = new THREE.Vector3();
    bbox.getCenter(center);
    model.position.set(0, 0, 0);
    
    console.log(`[3D Setup] Model scale: ${scale}`);
    console.log(`[3D Setup] Model bounding box size: ${sz.x}, ${sz.y}, ${sz.z}`);
    console.log(`[3D Setup] Model centered at: ${-center.x}, ${-center.y}, ${-center.z}`);

    model.traverse((child) => {
      const lowerName = (child.name || '').toLowerCase();
      if (lowerName.includes('aqdtiijfiakvckx') || lowerName.includes('znrfbdnyocoxsdd')) {
         console.log('[DEBUG] Hiding Apple logo by name:', child.name);
         child.visible = false;
         child.scale.set(0, 0, 0);
         return;
      }
      
      if (child.isMesh && child.material) {
         const mats = Array.isArray(child.material) ? child.material : [child.material];
         const hasLogoMat = mats.some(m => {
           const mn = (m.name || '').toLowerCase();
           return mn.includes('znrfbdnyocoxsdd') || mn.includes('logo-plate');
         });
         if (hasLogoMat) {
           console.log('[DEBUG] Hiding Apple logo by material:', child.name);
           child.visible = false;
           child.scale.set(0, 0, 0);
           return;
         }
      }
      // if (child.name.toLowerCase().includes('floor') || child.name.toLowerCase().includes('wall')) {
      //     child.visible = false;
      // }
      if (!child.isMesh) return;
      // Wall/acoustic panels must NOT cast shadows — they produce a hard diagonal band
      // across the desk that doesn't appear in the Blender reference render.
      // Applied in BOTH traversals (Traverse #1 and #2) to prevent ordering bugs.
      const _cn1 = child.name.toLowerCase();
      if (_cn1.includes('wall') || _cn1.includes('acoustic')) {
        child.castShadow = false;
      } else {
        child.castShadow = true;
      }
      child.receiveShadow = true;
      
      const name = child.name.toLowerCase();

      if (child.material) {
        const isScreenName = name.includes('screen') || name.includes('tftbkkzhxqpkrgc') || name.includes('naiwmivetsydjdz') || name.includes('display');
        const isExcluded = name.includes('border') || name.includes('metalic') || name.includes('frame') || name.includes('bezel') || name.includes('back');
        
        if (isScreenName && !isExcluded) {
          screenMesh = child;
          console.log('[SCREEN MESH FOUND]', child.name, 'parent:', child.parent?.name, 'isMultiMaterial:', Array.isArray(child.material));
          
          if (!laptopVideoTexture) {
            laptopVideoTexture = createVideoTexture('/video/laptop-demo.mp4');
            laptopVideoElement = laptopVideoTexture.userData.video;
            laptopVideoElement.addEventListener('canplay', () => console.log('[VIDEO] canplay — frames ready'));
            laptopVideoElement.addEventListener('playing', () => console.log('[VIDEO] playing'));
            laptopVideoElement.addEventListener('error', (e) => console.error('[VIDEO] load error', e));
          }
          
          screenMat.color.set(0xffffff); // Stop killing the map
          screenMat.map = laptopVideoTexture; // Map video to diffuse
          screenMat.emissiveMap = laptopVideoTexture;
          screenMat.emissive.set(0xffffff); // White so emissiveMap is not tinted
          screenMat.emissiveIntensity = 0.4;
          screenMat.needsUpdate = true;
          
          if (Array.isArray(child.material)) {
            for (let i = 0; i < child.material.length; i++) {
              const m = child.material[i];
              const mName = (m.name || '').toLowerCase();
              if (mName.includes('screen') || mName.includes('display') || mName.includes('glass') || mName.includes('tft') || mName.includes('lcd') || mName.includes('hlqwfcapwzetdqy')) {
                child.material[i] = screenMat;
                console.log(`[SCREEN MESH] Replaced material slot ${i} (${m.name}) on "${child.name}" with screenMat`);
              } else {
                m.needsUpdate = true;
              }
            }
          } else {
            child.material = screenMat;
          }
        } else {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => { m.needsUpdate = true; });
          } else {
            child.material.needsUpdate = true;
          }
        }
      }

      let isTopLevelClutter = false;
      let p = child;
      while(p && p !== model) {
         if (p.name.includes('Sketchfab_model') || (p.parent && p.parent.name === 'root')) {
            isTopLevelClutter = true;
            break;
         }
         p = p.parent;
      }
      
      if (isTopLevelClutter && p && !p.name.toLowerCase().includes('macbook') && !p.name.toLowerCase().includes('table') && !p.name.toLowerCase().includes('desk') && !p.name.toLowerCase().includes('plane') && !clutterObjects.includes(p)) {
         p.userData.flyDir = {
           x: (Math.random() - 0.5) * 8,
           y: Math.random() * 4 + 2,
           z: (Math.random() - 0.5) * 8
         };
         clutterObjects.push(p);
      }
    });

    model.traverse((child) => {  // Traverse #2 — AUTHORITATIVE pass for castShadow
        if (child.isMesh) {
           const _cn2 = child.name.toLowerCase();
           
           // Hide the leather desk mat/cushion completely so laptop sits directly on the wood desk
           let isCushion = _cn2.includes('leathercushion') || _cn2.includes('cushion');
           if (child.material) {
              const checkMat = (m) => {
                 const mn = m.name ? m.name.toLowerCase() : '';
                 if (mn.includes('leathercushion') || mn.includes('cushion')) {
                    isCushion = true;
                 }
              };
              if (Array.isArray(child.material)) {
                 child.material.forEach(checkMat);
              } else {
                 checkMat(child.material);
              }
           }
           if (isCushion) {
              child.visible = false;
              return;
           }

           // Wall/acoustic panels: exclude from shadow casting to prevent hard diagonal band.
           // This is Traverse #2 (runs LAST) so it is the authoritative final state.
           if (_cn2.includes('wall') || _cn2.includes('acoustic')) {
             child.castShadow = false;
           } else {
             child.castShadow = true;
           }
           
           // Determine if this mesh belongs to the laptop to disable self-shadowing blackout
           let isLaptop = false;
           let parentNode = child;
           while (parentNode) {
              if (parentNode.name && (parentNode.name.toLowerCase().includes('macbook') || parentNode.name.toLowerCase().includes('laptop'))) {
                 isLaptop = true;
                 break;
              }
              parentNode = parentNode.parent;
           }
           
           if (isLaptop) {
              child.receiveShadow = false;
           } else {
              child.receiveShadow = true;
           }
           
          if (child.material) {
             const applyMat = (m) => {
                 const matName = m.name ? m.name.toLowerCase() : '';
                 if (matName.includes('znrfbdnyocoxsdd')) {
                    console.log('[DEBUG] FOUND LOGO MATERIAL!', m.name, 'ON MESH:', child.name);
                 }
                 
                 // Logging unique material names once (Condition 2)
                if (m.name) {
                   if (!window.MediaHive_LoggedMaterials) {
                      window.MediaHive_LoggedMaterials = new Set();
                   }
                   if (!window.MediaHive_LoggedMaterials.has(m.name)) {
                      window.MediaHive_LoggedMaterials.add(m.name);
                      console.log(`[Material Traverse] Found material: "${m.name}"`);
                   }
                }

                const isOpaque = matName.includes('desk') || matName.includes('concrete') || matName.includes('wall') || matName.includes('table');
                
                 if (isOpaque) {
                     m.transparent = false;
                     m.depthWrite = true;
                  } else {
                     const hasAlpha = m.opacity < 0.99 || m.alphaTest > 0 || m.alphaMode === 'BLEND' || m.alphaMode === 'MASK' || m.transparent === true;
                     m.transparent = hasAlpha;
                     m.depthWrite = !hasAlpha;
                  }
                
                const mn = m.name ? m.name.toLowerCase() : '';
                if (mn.includes('walnutdesk') || m.name === 'MH_WalnutDesk') {
                   m.map = null;
                   m.color.setHex(0x382c24); // Beautiful rich dark walnut tone
                   m.roughness = 0.70;
                   m.metalness = 0.05;
                   m.needsUpdate = true;
                } else if (mn.includes('leathercushion') || m.name === 'MH_LeatherCushion' || mn.includes('cushion')) {
                   m.roughness = 0.85;
                   m.metalness = 0.0;
                   m.color.setHex(0x3a3a3a); // beautiful gray leather color, not pitch black
                   if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
                } else if (mn.includes('darkconcrete') || m.name === 'MH_DarkConcrete') {
                   m.roughness = 0.95;
                   m.metalness = 0.0;
                   if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
                } else if (mn.includes('backwall_acoustic') || m.name === 'MH_BackWall_Acoustic') {
                   m.roughness = 0.85;
                   m.metalness = 0.0;
                   if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
                } else if (mn.includes('backwall') || m.name === 'MH_BackWall') {
                   m.roughness = 0.95;
                   m.metalness = 0.0;
                   if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
                } else if (mn.includes('body-metal') || mn.includes('screen-back-metal') || mn.includes('spacegray_aluminum') || m.name === 'MH_SpaceGray_Aluminum' || mn === 'ggmexfbynnyrwmm' || mn === 'xvtjevwvvydejrr' || mn === 'hdeqgqdhvrltuvq' || mn === 'mtvwtmeddbygzea') {
                    // Space Gray Aluminum (laptop body and outer casing)
                    if (m.map) {
                       m.map = null;
                       m.needsUpdate = true;
                    }
                    m.roughness = 0.35;
                    m.metalness = 0.85;
                    m.color.setHex(0x666666); // premium, visible space gray aluminum tone
                 } else if (mn.includes('keyboard-bed') || mn === 'quuxrfeuujyrumo') {
                    // Keyboard bed
                    if (m.map) {
                       m.map = null;
                       m.needsUpdate = true;
                    }
                    m.roughness = 0.45;
                    m.metalness = 0.2;
                    m.color.setHex(0x222222);
                 } else if (mn.includes('keycap') || [
                    'kmkiqgtfazdmtyc', 'itkedaojlogksh', 'xecnbqmzozolkiz',
                    'sqkqsxqceccdmmm', 'utaqarmjnpkrqeb', 'waaaedqzqdlobii', 'ktcwfhzytafeplg',
                    'uhoyziiufeqjbix', 'dthpmxudoflfvyk', 'pkadkdyuuvylyht'
                 ].includes(mn)) {
                    // Keycaps
                    if (m.map) {
                       m.map = null;
                       m.needsUpdate = true;
                    }
                    m.roughness = 0.65;
                    m.metalness = 0.1;
                    m.color.setHex(0x181818);
                 } else if (mn.includes('trackpad') || mn === 'wiyopyjeeihnvjf') {
                    // Trackpad
                    if (m.map) {
                       m.map = null;
                       m.needsUpdate = true;
                    }
                    m.roughness = 0.55;
                    m.metalness = 0.15;
                    m.color.setHex(0x5a5a5a);
                 } else if (mn === 'vjogifqmxcmlckf') {
                    // Key legends
                    m.roughness = 0.5;
                    m.metalness = 0.0;
                    m.color.setHex(0xbbbbbb);
                 } else if (mn.includes('hinge') || mn === 'hzlgdkvnmxfngm') {
                    // Hinge
                    if (m.map) {
                       m.map = null;
                       m.needsUpdate = true;
                    }
                    m.roughness = 0.7;
                    m.metalness = 0.1;
                    m.color.setHex(0x111111);
                } else if (mn.includes('logo-plate') || mn === 'znrfbdnyocoxsdd') {
                    // Apple logo — hidden (not branding we want to show)
                    child.visible = false;
                    m.roughness = 0.05;
                    m.metalness = 0.95;
                    m.color.setHex(0x111111);
                } else if (mn.includes('trackpad_glass') || m.name === 'MH_Trackpad_Glass' || mn.includes('trackpad')) {
                   m.roughness = 0.15;
                   m.metalness = 0.1;
                } else if (mn.includes('keyboard_pbt') || m.name === 'MH_Keyboard_PBT' || mn.includes('keycap') || mn === 'iqdrvpeoazqbhho') {
                   m.roughness = 0.7;
                   m.metalness = 0.0;
                } else if (mn.includes('paper') || mn.includes('notebook')) {
                   // Darken paper to prevent white blowout reflections
                   m.roughness = 0.95;
                   m.metalness = 0.0;
                   m.color.setHex(0x999999); // soft paper color that won't blow out
                } else if (mn.includes('leaf') || mn.includes('leaves') || mn.includes('plant') || mn.includes('mat.2')) {
                   // Darken plant leaves for the moody look
                   m.roughness = 0.85;
                   m.metalness = 0.0;
                   m.color.multiplyScalar(0.75);
                }

                if (mn.includes('blinn1')) {
                   m.color.setHex(0x111111);
                   m.roughness = 0.6;
                   m.metalness = 0.1;
                } else if (mn.includes('blinn4')) {
                   m.color.setHex(0xcc4400);
                   m.roughness = 0.5;
                   m.metalness = 0.0;
                } else if (mn.includes('blinn6')) {
                   m.color.setHex(0x222222);
                   m.roughness = 0.4;
                   m.metalness = 0.3;
                }

                // envMapIntensity - structurally separate from the existing PBR chains (Condition 1 & 2)
                m.envMapIntensity = 0.25; // default set before named checks
                if (mn.includes('walnutdesk')) {
                   m.envMapIntensity = 0.20;
                } else if (mn.includes('darkconcrete')) {
                   m.envMapIntensity = 0.15;
                } else if (mn.includes('backwall_acoustic')) {
                   m.envMapIntensity = 0.20;
                } else if (mn.includes('backwall')) {
                   m.envMapIntensity = 0.15;
                } else if (mn.includes('blinn4')) { // orange accent
                   m.envMapIntensity = 0.20;
                } else if (mn.includes('spacegray_aluminum')) { // macbook / metal parts
                   m.envMapIntensity = 0.35;
                }

                if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
                if (m.normalMap) m.normalMap.colorSpace = THREE.NoColorSpace;
                if (m.roughnessMap) m.roughnessMap.colorSpace = THREE.NoColorSpace;
                if (m.metalnessMap) m.metalnessMap.colorSpace = THREE.NoColorSpace;
                if (m.aoMap) m.aoMap.colorSpace = THREE.NoColorSpace;
                
                m.needsUpdate = true;
             };

             if (Array.isArray(child.material)) {
                child.material.forEach(applyMat);
             } else {
                applyMat(child.material);
             }
          }
       }
       
      if (child.isLight) {
          child.visible = false;
       }
    });

    sceneGroup.add(model);



    // Assign references for animation loop overrides
    plantObj = sceneGroup.getObjectByName('plant');
    laptopLid = sceneGroup.getObjectByName('screen-mockup');
    console.log('[DEBUG] Resolved plantObj:', plantObj ? plantObj.name : 'null');
    console.log('[DEBUG] Resolved laptopLid:', laptopLid ? laptopLid.name : 'null');

    // Style Apple logo mesh parts to match the Space Gray casing exactly, or hide them
    const logoHideNames = [];
    const logoBlendNames = ['xiLiwJHfkqIwaTs'];
    
    sceneGroup.traverse((child) => {
       const lowerName = (child.name || '').toLowerCase();
       
       if (logoHideNames.some(name => lowerName.includes(name.toLowerCase()))) {
          child.visible = false;
          child.scale.set(0, 0, 0);
          logoMeshesToHide.push(child);
          console.log('[DEBUG] Hid logo part:', child.name);
       } else if (logoBlendNames.some(name => lowerName.includes(name.toLowerCase()))) {
          child.visible = true;
          child.scale.set(1, 1, 1);
          if (child.material) {
             // Clone material to avoid affecting keyboard keycaps sharing the same material instance
             const mats = Array.isArray(child.material) ? child.material : [child.material];
             const clonedMats = mats.map((m) => {
                const newMat = m.clone();
                newMat.color.setHex(0x666666);       // casing base color
                newMat.roughness = 0.35;             // matching casing roughness
                newMat.metalness = 0.85;             // matching casing metalness
                if (newMat.map) newMat.map = null;
                newMat.needsUpdate = true;
                return newMat;
             });
             child.material = Array.isArray(child.material) ? clonedMats : clonedMats[0];
          }
          logoMeshesToBlend.push(child);
          console.log('[DEBUG] Blended logo part:', child.name);
       }
    });

    // Position plant to clear wall clipping on initial frame (using correct relative coordinates)
    if (plantObj) {
       plantObj.position.x = -5.5;
       plantObj.position.z = 3.5;
    }

    mixer = new THREE.AnimationMixer(model);
    animations = gltf.animations;

    // Measure the real clip duration so the scroll onUpdate can map [0..1] → [0..clipDur]
    // without over-shooting or under-shooting due to a hardcoded estimate.
    const maxClipDuration = animations.reduce((max, clip) => Math.max(max, clip.duration), 0);
    window.MediaHive_ClipDuration = maxClipDuration;

    // Freeze the mixer at 84% of the clip (≈ frame 210 of 250 / t ≈ 7.0s for an 8.333s clip).
    // The Blender keyframes after this point close the laptop lid and swing the camera to an
    // aerial top-down view — neither of which is part of the intended scroll experience.
    // Override from the browser console at runtime: window.MediaHive_ClipFreezeTime = <seconds>
    if (window.MediaHive_ClipFreezeTime == null) {
      window.MediaHive_ClipFreezeTime = maxClipDuration * 0.84;
    }
    console.log(`[3D Setup] Clip duration measured: ${maxClipDuration.toFixed(3)}s (${Math.round(maxClipDuration * 30)} frames @ 30fps)`);
    console.log(`[3D Setup] Animation freeze point: ${window.MediaHive_ClipFreezeTime.toFixed(3)}s — override via window.MediaHive_ClipFreezeTime`);

    animations.forEach((clip) => {
       // ISSUE: Gaming chair.fbxAction is an obsolete animation clip exported from Blender
       // that translates the child Gaming_chairfbx node by -403 local Y units (representing
       // depth movement in Blender, which got exported as vertical displacement in GLTF).
       // This conflicts with the correct ChairAction animating the parent Chair node.
       // Skipping it fixes the coordinate conflicts and keeps the chair in its correct position.
       if (clip.name.includes('Gaming chair.fbxAction')) {
          console.log(`[ChairFix] Skipping obsolete animation clip: "${clip.name}"`);
          return;
       }
       const action = mixer.clipAction(clip);
       action.loop = THREE.LoopOnce;
       action.clampWhenFinished = true;
       action.play();
    });
    mixer.setTime(0); // Start at frame 0 = lid fully closed

    let chairLocalDeltaZ = 0;
    model.traverse((node) => {
      if (node.name === 'Chair') {
        const parentWorldScale = new THREE.Vector3();
        if (node.parent) {
          node.parent.getWorldScale(parentWorldScale);
        } else {
          parentWorldScale.set(1, 1, 1);
        }
        const worldDeltaZ = 6.78 - 1.177;  // 5.603 Three.js units
        const localDeltaZ = parentWorldScale.z !== 0 ? worldDeltaZ / parentWorldScale.z : worldDeltaZ;
        node.position.z += localDeltaZ;
        chairLocalDeltaZ = localDeltaZ;
        console.log(`[ChairFix] Chair moved +${worldDeltaZ.toFixed(3)} world Z (local delta: ${localDeltaZ.toFixed(3)}, parentScaleZ: ${parentWorldScale.z.toFixed(4)})`);
      }
    });

    // Offset the Z keyframe tracks in the ChairAction clip so they match our load-time correction.
    // This prevents the chair from jumping forward to the table when the user scrolls back to the top.
    if (chairLocalDeltaZ !== 0 && gltf.animations) {
      gltf.animations.forEach(clip => {
        if (clip.name === 'ChairAction') {
          clip.tracks.forEach(track => {
            if (track.name === 'Chair.position') {
              console.log(`[ChairFix] Offsetting animation track "${track.name}" in clip "${clip.name}" by Z delta: ${chairLocalDeltaZ.toFixed(3)}`);
              for (let i = 2; i < track.values.length; i += 3) {
                track.values[i] += chairLocalDeltaZ;
              }
            }
          });
        }
      });
    }

    let gltfCamera = null;
    model.traverse((child) => {
       if (child.isCamera) {
          gltfCamera = child;
       }
    });
    if (gltfCamera) {
       camera = gltfCamera;
       updateCameraProjection();
       renderPass.camera = camera;
    }

    const chairNode = model.getObjectByName('Chair');
    if (chairNode) {
      window.MediaHive_ChairNode = chairNode;
      chairNode.traverse((c) => {
        if (c.isMesh && c.material) {
          const mats = Array.isArray(c.material) ? c.material : [c.material];
          mats.forEach((m) => { m.transparent = true; });
        }
      });
    }

    bindLoadedModelToTimeline();

    const nonLaptopMeshes = [];
    model.traverse((child) => {
      if (!child.isMesh) return;
      let isLaptop = false;
      let ancestor = child;
      while (ancestor) {
        const aName = ancestor.name.toLowerCase();
        if (aName.includes('macbook') || aName.includes('mac_book') || aName.includes('laptop')) {
          isLaptop = true;
          break;
        }
        ancestor = ancestor.parent;
      }
      if (!isLaptop) {
        // Clone materials to prevent shared state side-effects when changing opacity
        if (Array.isArray(child.material)) {
          child.material = child.material.map((m) => {
            const cloned = m.clone();
            cloned.transparent = true;
            return cloned;
          });
        } else if (child.material) {
          child.material = child.material.clone();
          child.material.transparent = true;
        }
        nonLaptopMeshes.push(child);
      }
    });
    window.MediaHive_NonLaptopMeshes = nonLaptopMeshes;

    // Scroll-driven fade-out animation for all non-laptop meshes (clutter, plant, desk props)
    const masterTl = window.MediaHive_ScrollTimeline;
    if (masterTl && nonLaptopMeshes.length) {
      const allNonLaptopMats = [];
      nonLaptopMeshes.forEach((m) => {
        const mats = Array.isArray(m.material) ? m.material : (m.material ? [m.material] : []);
        allNonLaptopMats.push(...mats);
      });

      masterTl.to(allNonLaptopMats, {
        opacity: 0,
        duration: 0.12,
        ease: 'power2.inOut',
        onUpdate: function() {
          const p = this.progress();
          const isComplete = p > 0.99;
          nonLaptopMeshes.forEach((m) => {
            m.visible = !isComplete;
          });
        }
      }, 0.76);
    }

    // ISSUE 6: Hide the 3D desk canvas when user reaches the tablet section.
    // Delayed creation to inside GLTF load callback prevents premature triggers on load.
    let canvasHidden = false;
    window.MH_canvasHidden = () => canvasHidden;
    ScrollTrigger.create({
      trigger: '#tablet-section',
      start: 'top 90%',
      onEnter: () => {
        console.log('[DEBUG] ScrollTrigger #tablet-section onEnter', { canvasHidden });
        if (canvasHidden) return;
        canvasHidden = true;
        active = false;
        window.MH_active_state = active;
        if (laptopVideoElement) laptopVideoElement.pause();
        // Canvas is moved off-screen by the GSAP scroll timeline; just stop rendering.
        canvas.style.pointerEvents = 'none';
      },
      onLeaveBack: () => {
        console.log('[DEBUG] ScrollTrigger #tablet-section onLeaveBack', { canvasHidden });
        if (!canvasHidden) return;
        canvasHidden = false;
        active = true;
        window.MH_active_state = active;
        if (laptopVideoElement) laptopVideoElement.play().catch(()=>{});
        canvas.style.pointerEvents = 'none';
      }
    });
  }); // end gltf.load callback

  const animState = {
    lidRotationX: Math.PI,
    screenEmissive: 0.0   // starts off (0.0) when laptop is closed
  };

  function bindLoadedModelToTimeline() {
     window.MediaHive_Mixer = mixer;

     const masterTl = window.MediaHive_ScrollTimeline;
     if (masterTl) {
       const chairNode = window.MediaHive_ChairNode;
       if (chairNode) {
         const chairMats = [];
         chairNode.traverse((c) => {
           if (c.isMesh) {
             const mats = Array.isArray(c.material) ? c.material : (c.material ? [c.material] : []);
             chairMats.push(...mats);
           }
         });
         if (chairMats.length) {
           masterTl.to(chairMats, {
             opacity: 0,
             duration: 0.10,
             ease: 'power2.in',
             onUpdate: function() {
               const p = this.progress();
               if (chairNode) chairNode.visible = (p < 0.99);
             }
           }, 0.25);
         }
       }

        // Screen glow intensity tween (existing)
        masterTl.to(animState, {
          screenEmissive: 0.4,   // tweens to 0.4 (video display baseline)
          duration: 0.15,
          ease: 'power2.inOut'
        }, 0.1);

       masterTl.to(screenGlow, {
         intensity: 3.0,
         duration: 0.15,
         ease: 'power2.inOut'
       }, 0.1);
     }
  }

  function updateCameraProjection() {
    if (!camera) return;
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    
    // Apply Blender camera lens shift (Camera.003: shift_x = -0.3, shift_y = 0.05)
    // Blender shift_x/y are in film-width / film-height units respectively.
    // Three.js projectionMatrix[8] = X NDC offset = 2 * shift_x
    // Three.js projectionMatrix[9] = Y NDC offset = 2 * shift_y  (no aspect mult — shift_y is in film HEIGHT units)
    camera.projectionMatrix.elements[8] = 2 * -0.3;   // = -0.6
    camera.projectionMatrix.elements[9] = 2 * 0.05;   // = +0.1  (no aspect ratio factor)
  }

  // --- 4. Render Loop with IntersectionObserver ---
  window.addEventListener('resize', () => {
    updateCameraProjection();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    composer.setSize(window.innerWidth, window.innerHeight);
    bloomPass.resolution.set(window.innerWidth, window.innerHeight);
  });

  let active = true;
  window.MH_active = () => active;

  let mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;
  window.addEventListener('mousemove', (e) => {
    targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouseY = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  function render() {
    requestAnimationFrame(render);
    if (!active) return;



    const scrollY = window.lenis ? window.lenis.scroll : window.scrollY;

    // Enforce plant position on every frame to override animation mixer resets
    if (plantObj) {
      plantObj.position.x = -5.5;
      plantObj.position.z = 3.5;
    }

    // Force hide and shrink Apple logo parts on every frame to override animation mixer resets
    for (let i = 0; i < logoMeshesToHide.length; i++) {
      const mesh = logoMeshesToHide[i];
      mesh.visible = false;
      mesh.scale.set(0, 0, 0);
    }

    // Force show and scale 1 for blending backing plates/logo parts
    for (let i = 0; i < logoMeshesToBlend.length; i++) {
      const mesh = logoMeshesToBlend[i];
      mesh.visible = true;
      mesh.scale.set(1, 1, 1);
    }



    // Force laptop lid fully closed at scroll 0, else let mixer or static rotation control it
    if (scrollY === 0) {
      if (laptopLid) laptopLid.rotation.x = 1.595;
    } else {
      if (!mixer) {
        if (laptopLid) laptopLid.rotation.x = animState.lidRotationX;
      }
    }

    screenMat.emissiveIntensity = animState.screenEmissive;
    const activeMap = screenMesh && screenMesh.material && (screenMesh.material.emissiveMap || screenMesh.material.map);
    if (activeMap && activeMap.image) {
      const vid = activeMap.image;
      if (vid && vid.readyState >= 2) {
        activeMap.needsUpdate = true;
      }
    }

    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;
    
    if (scrollY < 2500) {
      sceneGroup.rotation.y = mouseX * 0.1;
      sceneGroup.rotation.x = -mouseY * 0.05;
    }

    if (!mixer) {
      camera.lookAt(globalLookAt);
    }
    // Use post-processing composer (includes subtle bloom for screen)
    composer.render();
  }

  render();
}


function setupGlobalBackground() {
  // Guard — bail out silently if glow elements haven't been injected into the DOM
  if (!document.querySelector('.glow-purple')) return;
  const bgTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: '#scroll-wrapper',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
    }
  });

  bgTimeline.addLabel('hero', 0);
  bgTimeline.addLabel('tablet', 1);
  bgTimeline.addLabel('phone', 2);
  bgTimeline.addLabel('features', 3);
  bgTimeline.addLabel('showcase', 4);

  // Animate Purple Glow (Celestial Ellipse curved path)
  bgTimeline
    .to('.glow-purple', { opacity: 0.2, x: '-15%', y: '10%', scale: 0.9, duration: 1, ease: 'power2.inOut' }, 'hero')
    .to('.glow-purple', { opacity: 0.1, x: '-25%', y: '30%', scale: 0.8, duration: 1, ease: 'power2.inOut' }, 'tablet')
    .to('.glow-purple', { opacity: 0.35, x: '-10%', y: '25%', scale: 1.1, duration: 1, ease: 'power2.inOut' }, 'phone')
    .to('.glow-purple', { opacity: 0.05, x: '0%', y: '40%', scale: 0.8, duration: 1, ease: 'power2.inOut' }, 'features');

  // Animate Blue Glow (Brightens and centers behind tablet text)
  bgTimeline
    .to('.glow-blue', { opacity: 0.55, x: '25%', y: '15%', scale: 1.25, duration: 1, ease: 'power2.inOut' }, 'hero')
    .to('.glow-blue', { opacity: 0.15, x: '10%', y: '30%', scale: 1.0, duration: 1, ease: 'power2.inOut' }, 'tablet')
    .to('.glow-blue', { opacity: 0.1, x: '0%', y: '40%', scale: 0.9, duration: 1, ease: 'power2.inOut' }, 'phone')
    .to('.glow-blue', { opacity: 0.05, duration: 1, ease: 'power2.inOut' }, 'features');

  // Animate Indigo Glow (Brightens and centers behind phone text)
  bgTimeline
    .to('.glow-indigo', { opacity: 0.2, x: '0%', y: '10%', scale: 1.0, duration: 1, ease: 'power2.inOut' }, 'hero')
    .to('.glow-indigo', { opacity: 0.6, x: '-20%', y: '15%', scale: 1.35, duration: 1, ease: 'power2.inOut' }, 'tablet')
    .to('.glow-indigo', { opacity: 0.25, x: '-10%', y: '30%', scale: 1.1, duration: 1, ease: 'power2.inOut' }, 'phone')
    .to('.glow-indigo', { opacity: 0.05, duration: 1, ease: 'power2.inOut' }, 'features');

  // Animate Teal Glow (Rises and expands at the bottom)
  bgTimeline
    .to('.glow-teal', { opacity: 0.15, x: '10%', y: '0%', scale: 1.0, duration: 1, ease: 'power2.inOut' }, 'hero')
    .to('.glow-teal', { opacity: 0.25, x: '20%', y: '-10%', scale: 1.1, duration: 1, ease: 'power2.inOut' }, 'tablet')
    .to('.glow-teal', { opacity: 0.5, x: '10%', y: '-20%', scale: 1.25, duration: 1, ease: 'power2.inOut' }, 'phone')
    .to('.glow-teal', { opacity: 0.7, x: '0%', y: '-35%', scale: 1.45, duration: 1, ease: 'power2.inOut' }, 'features');
}

// (Logo Setup Removed)

// Call animations
setupAnimations();

// ==========================================================================
// 5.5  Navbar Scroll Reveal â€” appears after 2500px, fades on reverse
// ==========================================================================
(function initNavbarReveal() {
  const nav = document.querySelector('.main-nav');
  if (!nav) return;

  // Variant 1 (default): Fade + slide down from -8px â€” elegant entrance
  // Variant 2: Fade + scale from 0.96
  // Variant 3: Pure fade only

  const SCROLL_SHOW = 2500; // px â€” show navbar after this
  const SCROLL_HIDE = 2300; // px â€” hide again if scroll goes below this (hysteresis)

  let isVisible = false;

  function showNav() {
    if (isVisible) return;
    isVisible = true;
    nav.style.transition = 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1), pointer-events 0s';
    nav.style.opacity = '1';
    nav.style.transform = 'translateY(0px)';
    nav.style.pointerEvents = 'auto';
  }

  function hideNav() {
    if (!isVisible) return;
    isVisible = false;
    nav.style.transition = 'opacity 0.35s ease, transform 0.35s ease, pointer-events 0s';
    nav.style.opacity = '0';
    nav.style.transform = 'translateY(-8px)';
    nav.style.pointerEvents = 'none';
  }

  // Use Lenis scroll events if available, otherwise listen to native scroll
  function onScroll(scrollY) {
    if (scrollY >= SCROLL_SHOW) {
      showNav();
    } else if (scrollY < SCROLL_HIDE) {
      hideNav();
    }
  }

  // Hook into Lenis (set up after Lenis initialises)
  const hookLenis = () => {
    if (window.lenis) {
      window.lenis.on('scroll', ({ scroll }) => onScroll(scroll));
    } else {
      window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
    }
  };

  // Lenis is initialised slightly after this IIFE â€” defer one tick
  setTimeout(hookLenis, 200);
})();


// ==========================================================================
// 6. Window Resize Handler
// ==========================================================================
// Handle Resize (Removed global camera/renderer logic as devices handle their own)

// ==========================================================================
// 7. Lenis Smooth Scroll Setup
// ==========================================================================
let lenis = null;
if (typeof window !== 'undefined' && window.Lenis) {
  lenis = new window.Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  window.lenis = lenis;

  // Sync GSAP ScrollTrigger updates with Lenis scrolling
  lenis.on('scroll', ScrollTrigger.update);

  // Fade out scroll hint on first scroll
  lenis.on('scroll', (e) => {
    if (e.scroll > 20) {
      gsap.to('#scroll-hint', { opacity: 0, duration: 0.5, overwrite: 'auto' });
    } else {
      gsap.to('#scroll-hint', { opacity: 1, duration: 0.5, overwrite: 'auto' });
    }
  });

  // Hook Lenis into GSAP ticker
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  
  // Disable lag smoothing in GSAP to avoid sync jumps
  gsap.ticker.lagSmoothing(0);
} else {
  // Fallback scroll listener if Lenis is not available
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      gsap.to('#scroll-hint', { opacity: 0, duration: 0.5, overwrite: 'auto' });
    } else {
      gsap.to('#scroll-hint', { opacity: 1, duration: 0.5, overwrite: 'auto' });
    }
  });
}

// ==========================================================================
// 8. Intersection Observers for HTML Sections
// ==========================================================================
const tabletObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.getElementById('tablet-text').classList.add('visible');
      document.getElementById('tablet-visual').classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

const tabletSection = document.getElementById('tablet-section');
if (tabletSection) {
  tabletObserver.observe(tabletSection);
}

const phoneObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.getElementById('phone-text').classList.add('visible');
      document.getElementById('phone-visual').classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

const phoneSection = document.getElementById('phone-section');
if (phoneSection) {
  phoneObserver.observe(phoneSection);
}

const showcaseObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.getElementById('showcase-text').classList.add('visible');
      // Trigger device float-in animations
      const laptop = document.getElementById('showcase-laptop');
      const ipad = document.getElementById('showcase-ipad');
      const iphone = document.getElementById('showcase-iphone');
      if (laptop) setTimeout(() => laptop.classList.add('visible'), 200);
      if (ipad)   setTimeout(() => ipad.classList.add('visible'),  400);
      if (iphone) setTimeout(() => iphone.classList.add('visible'), 600);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.25 });

const showcaseSection = document.getElementById('showcase-section');
if (showcaseSection) {
  showcaseObserver.observe(showcaseSection);
}

// ==========================================================================
// 10. Secondary Devices (iPad and iPhone)
// ==========================================================================

function createIpadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0D1117';
  ctx.fillRect(0, 0, 1024, 768);

  // Header
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, 1024, 60);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, 59, 1024, 1);
  ctx.fillStyle = '#F5A623';
  ctx.font = '600 24px sans-serif';
  ctx.fillText('ðŸ¯ MediaHive', 24, 38);
  ctx.fillStyle = '#6b7280';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Saturday, June 7', 1000, 38);
  ctx.textAlign = 'left';

  // Sidebar
  const sidebarWidth = 225;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 60, sidebarWidth, 708);

  const sidebarItems = [
    { text: 'ðŸ“‹ Tasks', active: true },
    { text: 'ðŸ“… Calendar', active: false },
    { text: 'ðŸ“ Assets', active: false },
    { text: 'ðŸ‘¥ Team', active: false }
  ];

  sidebarItems.forEach((item, index) => {
    const y = 80 + index * 50;
    if (item.active) {
      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.roundRect(12, y - 24, sidebarWidth - 24, 40, 6);
      ctx.fill();
      ctx.fillStyle = '#F5A623';
    } else {
      ctx.fillStyle = '#9ca3af';
    }
    ctx.font = '18px sans-serif';
    ctx.fillText(item.text, 24, y + 4);
  });

  // Calendar Grid
  const gridX = 225 + 16;
  const gridY = 60 + 16;
  const gridW = 799 - 32;
  const gridH = 708 - 32;
  const cols = 3;
  const rows = 2;
  const gap = 12;
  const cellW = (gridW - gap * (cols - 1)) / cols;
  const cellH = (gridH - gap * (rows - 1)) / rows;

  const cards = [
    { label: 'VIDEO', labelColor: '#F5A623', title: 'Edit Tuesday Reel', empty: false },
    { label: 'ADMIN', labelColor: '#10b981', title: 'Send Invoice', empty: false },
    { label: 'TECH', labelColor: '#3b82f6', title: 'Drone Firmware', empty: false },
    { label: 'DESIGN', labelColor: '#a855f7', title: 'Logo Revision v3', empty: false },
    { label: 'SHOOT', labelColor: '#f59e0b', title: 'Garden Campus', empty: false },
    { label: '', labelColor: '', title: '+ Add Task', empty: true }
  ];

  cards.forEach((card, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const cx = gridX + col * (cellW + gap);
    const cy = gridY + row * (cellH + gap);

    if (card.empty) {
      ctx.fillStyle = '#111827';
      ctx.beginPath(); ctx.roundRect(cx, cy, cellW, cellH, 8); ctx.fill();
      ctx.fillStyle = '#374151';
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(card.title, cx + cellW / 2, cy + cellH / 2);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    } else {
      ctx.fillStyle = '#1f2937';
      ctx.beginPath(); ctx.roundRect(cx, cy, cellW, cellH, 8); ctx.fill();
      ctx.fillStyle = card.labelColor;
      ctx.beginPath(); ctx.roundRect(cx, cy, 6, cellH, {tl: 8, bl: 8, tr: 0, br: 0}); ctx.fill();
      ctx.font = '600 16px sans-serif';
      ctx.fillText(card.label, cx + 24, cy + 30);
      ctx.fillStyle = '#e5e7eb';
      ctx.font = '20px sans-serif';
      ctx.fillText(card.title, cx + 24, cy + 60);
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createIphoneTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 390;
  canvas.height = 844;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0D1117';
  ctx.fillRect(0, 0, 390, 844);

  // Dynamic Island
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.roundRect(135, 12, 120, 36, 18);
  ctx.fill();

  // Status Bar Left
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 14px sans-serif';
  ctx.fillText('9:41', 32, 34);

  // Status Bar Right (Icons placeholder)
  ctx.textAlign = 'right';
  ctx.fillText('ðŸ“¶ ðŸ”‹', 358, 34);
  ctx.textAlign = 'left';

  // App Header
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 60, 390, 60);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, 119, 390, 1);
  ctx.fillStyle = '#F5A623';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('ðŸ¯ MediaHive', 24, 98);

  // Task Cards
  const drawCard = (y, color, tag, title) => {
    ctx.fillStyle = '#161B22';
    ctx.beginPath();
    ctx.roundRect(20, y, 350, 100, 16);
    ctx.fill();

    // Left border
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(20, y, 6, 100, {tl: 16, bl: 16, tr: 0, br: 0});
    ctx.fill();

    ctx.fillStyle = color;
    ctx.font = '600 12px sans-serif';
    ctx.fillText(tag, 42, y + 34);

    ctx.fillStyle = '#e5e7eb';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(title, 42, y + 64);
  };

  drawCard(140, '#F5A623', 'VIDEO', 'Edit Tuesday Reel');
  drawCard(260, '#10b981', 'ADMIN', 'Send Client Invoice');
  drawCard(380, '#3b82f6', 'TECH', 'Drone Firmware');

  // Bottom Nav
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 750, 390, 94);

  // Icons
  ctx.fillStyle = '#F5A623';
  ctx.fillText('ðŸ“Š', 48, 790);

  ctx.fillStyle = '#9ca3af';
  ctx.fillText('ðŸ“‹', 138, 790);
  ctx.fillText('ðŸ’¬', 228, 790);
  ctx.fillText('âš™ï¸', 318, 790);

  // Home Indicator
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(130, 830, 130, 5, 3);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function initDevice(canvasId, modelUrl, targetSize, createTextureFn, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // Handle WebGL context loss gracefully
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    console.warn(`[WebGL] Context lost on canvas: ${canvasId}`);
    const container = canvas.parentElement;
    if (container) {
      container.classList.add('webgl-context-lost');
    }
  }, false);

  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isMobile });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 5);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  
  const light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(2, 2, 2);
  scene.add(light);
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  let modelGroup = new THREE.Group();
  scene.add(modelGroup);

  const activeVideos = [];
  const texture = createTextureFn();
  if (texture && texture.userData && texture.userData.video) {
    activeVideos.push(texture.userData.video);
  }

  gltfLoader.load(modelUrl, (gltf) => {
    const model = gltf.scene;

    const bbox = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = targetSize / (maxDim || 1);
    model.scale.setScalar(scaleFactor);

    bbox.setFromObject(model);
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    model.position.x = -center.x;
    model.position.y = -center.y;
    model.position.z = -center.z;

    const modelWrapper = new THREE.Group();
    modelWrapper.add(model);
    if (options.rotateX !== undefined) modelWrapper.rotation.x = options.rotateX;
    if (options.rotateY !== undefined) modelWrapper.rotation.y = options.rotateY;
    if (options.rotateZ !== undefined) modelWrapper.rotation.z = options.rotateZ;
    if (options.positionY !== undefined) modelWrapper.position.y = options.positionY;
    if (options.positionZ !== undefined) modelWrapper.position.z = options.positionZ;
    modelGroup.add(modelWrapper);

    if (options.glowColor) {
      const underGlow = new THREE.PointLight(options.glowColor, 0.6, 10);
      underGlow.position.set(0, -3, 2);
      scene.add(underGlow);
    }

    if (options.onModelLoaded) {
      options.onModelLoaded(modelGroup, model);
    }

    model.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.envMapIntensity = 0.22; // reduced from 0.3 for visual consistency (Condition 3)
        if (child.material.roughness !== undefined) {
          child.material.roughness = Math.max(child.material.roughness, 0.35);
        }
        
        // Force depth testing to prevent back-face elements from bleeding through to the front
        child.material.depthTest = true;
        child.material.depthWrite = true;
        child.material.needsUpdate = true;
      }

      if (child.isMesh) {
        const name = child.name.toLowerCase();
        const matName = child.material && child.material.name ? child.material.name.toLowerCase() : '';
        
        const isScreen = 
          name.includes('screen') || name.includes('display') || name.includes('lcd') ||
          (name.includes('scr_0') && !name.includes('glass')) || // iPhone screen mesh name (object.010_scr_0)
          name === 'tftbkkzhxqpkrgc' || name === 'naiwmivetsydjdz' || // Macbook screen mesh names
          name === 'auxuzfpidyyvcpo' || // iPad screen mesh name
          matName === 'hlqwfcapwzetdqy' || matName === 'ztrfkpzrroyzncn' || // Macbook screen material names
          matName === 'hlumgtgdbnvpsa' ||   // iPad screen material name
          matName === 'material_10';       // Pizza3 iPhone screen material name

        if (isScreen) {
          console.log(`[3D Setup] Applying texture to screen mesh: "${child.name}" with material: "${child.material.name}"`);
          child.material = new THREE.MeshBasicMaterial({
            map: texture,
            color: 0xffffff,
            depthTest: true,
            depthWrite: true,
            transparent: false,
            side: THREE.DoubleSide
          });
          child.material.needsUpdate = true;
        } else if (matName === 'scene_-_root') {
          // This is the original iPhone model which is a single unified mesh using a single material!
          // We draw the video onto the screen region of its original texture atlas via a 2D canvas,
          // so the rest of the phone body doesn't get overwritten with the video.
          console.log(`[3D Setup] Intercepting texture atlas for unified material: "${child.material.name}"`);
          if (child.material.map && child.material.map.image) {
            const originalImage = child.material.map.image;
            const videoTexture = createIphoneVideoTexture('/video/mobile-demo.mp4', originalImage, canvasId);
            child.material.map = videoTexture;
            if (videoTexture && videoTexture.userData && videoTexture.userData.video) {
              activeVideos.push(videoTexture.userData.video);
            }
          }
          child.material.roughness = 0.4;
          child.material.metalness = 0.8;
          child.material.needsUpdate = true;
        }
      }
    });
  });

  const resizeObserver = new ResizeObserver(() => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if(width === 0 || height === 0) return;
    camera.aspect = width / height;
    
    // Lock horizontal FOV in portrait to prevent models from being clipped on mobile/narrow screens
    if (width < height) {
      const defaultFov = 45;
      const radFov = (defaultFov * Math.PI) / 180;
      const halfHFit = Math.tan(radFov / 2);
      camera.fov = (2 * Math.atan(halfHFit / camera.aspect) * 180) / Math.PI;
    } else {
      camera.fov = 45;
    }
    
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  });
  resizeObserver.observe(canvas);

  if (!options.skipScrollTrigger) {
    ScrollTrigger.create({
      trigger: canvas.closest('section') || canvas.parentElement,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
      onUpdate: (self) => {
        modelGroup.rotation.y = (self.progress - 0.5) * Math.PI * 0.8;
        modelGroup.rotation.x = (self.progress - 0.5) * 0.4;
      }
    });
  }

  let isVisible = true;
  let isAnimating = true;
  const targetElement = canvas.closest('section') || canvas;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;
      
      // Control video playback based on visibility
      activeVideos.forEach(video => {
        if (isVisible) {
          video.play().catch(e => console.warn("Device video resume failed:", e));
        } else {
          video.pause();
        }
      });

      if (isVisible && !isAnimating) {
        isAnimating = true;
        render();
      }
    });
  }, { threshold: 0 });
  observer.observe(targetElement);

  // ── Per-instance mouse-tilt state ──────────────────────────────────────
  let mouseTargetX = 0, mouseTargetY = 0;
  let mouseCurrX   = 0, mouseCurrY   = 0;

  if (options.mouseTracking) {
    const trackEl = canvas.parentElement || canvas;

    trackEl.addEventListener('mousemove', (e) => {
      const rect = trackEl.getBoundingClientRect();
      // Normalise to -1 … +1 relative to the element centre
      mouseTargetX = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouseTargetY = ((e.clientY - rect.top)  / rect.height) * 2 - 1;
    });

    // On leave, ease back to neutral
    trackEl.addEventListener('mouseleave', () => {
      mouseTargetX = 0;
      mouseTargetY = 0;
    });
  }
  // ───────────────────────────────────────────────────────────────────────

  let lastRenderTime = 0;
  const FPS_INTERVAL = 1000 / 30; // 30 FPS cap

  function render(now) {
    if (!isVisible) {
      isAnimating = false;
      return;
    }
    requestAnimationFrame(render);
    const timestamp = now || performance.now();
    if (timestamp - lastRenderTime < FPS_INTERVAL) return;
    lastRenderTime = timestamp;

    // Smooth mouse-driven tilt (lerp factor 0.06 → silky, not snappy)
    if (options.mouseTracking) {
      mouseCurrX += (mouseTargetX - mouseCurrX) * 0.06;
      mouseCurrY += (mouseTargetY - mouseCurrY) * 0.06;
      // Horizontal mouse → rotate around Y; vertical mouse → subtle X tilt
      modelGroup.rotation.y = mouseCurrX *  0.35;
      modelGroup.rotation.x = mouseCurrY * -0.18;
    }

    renderer.render(scene, camera);
  }
  render();
}

// Initialize iPad and iPhone in Hero section
initDevice('ipad-canvas', '/models/ipad_pro_13_silver_m4.glb', 3.3, () => createVideoTexture('/video/tablet-demo.mp4', -Math.PI / 2, 1.15), { rotateX: Math.PI / 2 });

initDevice('iphone-canvas', '/models/iphone_16_pro_max.glb', 3.8, () => null, { rotateY: 0.26, rotateZ: -0.09 });

// Initialize Laptop, iPad and iPhone in Showcase ("One platform, every screen") section
// Each device plays the same looping video as its dedicated hero section
initDevice(
  'showcase-laptop-canvas',
  '/models/macbook_pro_14_inch_M5.glb',
  3.2,
  () => createVideoTexture('/video/laptop-demo.mp4'),
  { rotateY: 0.22, skipScrollTrigger: true, mouseTracking: true }
);
initDevice(
  'showcase-ipad-canvas',
  '/models/ipad_pro_13_silver_m4.glb',
  3.6,
  () => createVideoTexture('/video/tablet-demo.mp4', -Math.PI / 2, 1.15),
  { rotateX: Math.PI / 2, rotateY: -0.12, skipScrollTrigger: true, mouseTracking: true }
);
initDevice(
  'showcase-iphone-canvas',
  '/models/iphone_16_pro_max.glb',
  4.5,
  () => null,   // iPhone auto-applies mobile-demo.mp4 via scene_-_root material detection
  { rotateY: -0.22, rotateZ: -0.05, skipScrollTrigger: true, mouseTracking: true }
);

// Click ripple effect for Digital Serenity background
const heroPhotoWrapper = document.getElementById('hero-photo-wrapper');
if (heroPhotoWrapper) {
  heroPhotoWrapper.addEventListener('click', (e) => {
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';
    ripple.style.left = `${e.clientX}px`;
    ripple.style.top = `${e.clientY}px`;
    document.body.appendChild(ripple);
    
    // Auto cleanup after 1 second
    setTimeout(() => {
      ripple.remove();
    }, 1000);
  });
}

// ==========================================================================
// 11. Stats Counters and Reveal Animations for New Sections
// ==========================================================================
const counters = document.querySelectorAll('.stats-number');
counters.forEach(counter => {
  const target = parseInt(counter.getAttribute('data-target'));
  if (isNaN(target)) return;
  
  const countObj = { val: 0 };
  gsap.to(countObj, {
    val: target,
    duration: 2.2,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '#stats-section',
      start: 'top 80%',
      toggleActions: 'play none none none'
    },
    onUpdate: () => {
      if (counter.id === 'counter-visibility') {
        counter.innerText = Math.floor(countObj.val) + '%';
      } else {
        counter.innerText = Math.floor(countObj.val);
      }
    }
  });
});

// Reveal animations for new sections
const revealSections = [
  { selector: '.mid-statement-section', y: 30 },
  { selector: '.prob-card', x: -50 },
  { selector: '.sol-card', x: 50 },
  { selector: '.stats-grid', y: 30 },
  { selector: '.bento-card', y: 40, stagger: 0.08 },
  { selector: '.founder-container', y: 40 },
  { selector: '.use-case-cards', y: 30 },
  { selector: '.tools-marquee-section', y: 30 },
  { selector: '.pre-footer-cta', y: 30 }
];

revealSections.forEach(section => {
  const elements = document.querySelectorAll(section.selector);
  if (elements.length === 0) return;
  
  const animConfig = {
    opacity: 1,
    duration: 1.0,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: elements[0].closest('section') || elements[0],
      start: 'top 85%',
      toggleActions: 'play none none none'
    }
  };
  
  if (section.y !== undefined) {
    gsap.set(elements, { opacity: 0, y: section.y });
    animConfig.y = 0;
  } else if (section.x !== undefined) {
    gsap.set(elements, { opacity: 0, x: section.x });
    animConfig.x = 0;
  }
  
  if (section.stagger !== undefined) {
    animConfig.stagger = section.stagger;
  }
  
  gsap.to(elements, animConfig);
});

// ==========================================================================
// 12. Rotating Text Subheadline Animation (Dynamic Width Box Style)
// ==========================================================================
function initRotatingText() {
  const items = document.querySelectorAll('.rotating-text-item');
  const wrapper = document.querySelector('.rotating-text-wrapper');
  if (items.length === 0 || !wrapper) return;

  // Split each item's text into letters
  items.forEach(item => {
    const text = item.textContent.trim();
    const words = text.split(" ");
    item.innerHTML = ""; // Clear existing text
    
    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement("span");
      wordSpan.className = "flip-word";
      wordSpan.style.display = "inline-block";
      wordSpan.style.whiteSpace = "nowrap";
      
      const letters = word.split("");
      letters.forEach((letter) => {
        const letterSpan = document.createElement("span");
        letterSpan.className = "flip-letter";
        letterSpan.style.display = "inline-block";
        letterSpan.textContent = letter;
        wordSpan.appendChild(letterSpan);
      });
      
      item.appendChild(wordSpan);
      
      // Add non-breaking space between words
      if (wordIndex < words.length - 1) {
        const spaceSpan = document.createElement("span");
        spaceSpan.className = "flip-space";
        spaceSpan.style.display = "inline-block";
        spaceSpan.innerHTML = "&nbsp;";
        item.appendChild(spaceSpan);
      }
    });
  });

  let currentIndex = 0;

  // Helper to adjust wrapper width dynamically to fit the text
  const adjustWrapperWidth = (element) => {
    if (element) {
      wrapper.style.width = `${element.offsetWidth + 24}px`;
    }
  };

  // Set initial states
  items.forEach((item, index) => {
    if (index === currentIndex) {
      item.classList.add('active');
      gsap.set(item, { opacity: 1, y: 0, x: 0, scale: 1, filter: "blur(0px)" });
      const letters = item.querySelectorAll('.flip-letter');
      gsap.set(letters, { opacity: 1, y: 0, filter: "blur(0px)" });
    } else {
      item.classList.remove('active');
      gsap.set(item, { opacity: 0, y: 10, x: 0, scale: 1, filter: "blur(8px)" });
      const letters = item.querySelectorAll('.flip-letter');
      gsap.set(letters, { opacity: 0, y: 10, filter: "blur(8px)" });
    }
  });

  // Adjust wrapper width initially
  setTimeout(() => {
    const activeItem = items[currentIndex];
    if (activeItem) adjustWrapperWidth(activeItem);
  }, 200);

  setInterval(() => {
    const current = items[currentIndex];
    const nextIndex = (currentIndex + 1) % items.length;
    const next = items[nextIndex];

    // 1. Animate current word out (Aceternity style)
    gsap.to(current, {
      opacity: 0,
      y: -40,
      x: 40,
      scale: 2,
      filter: "blur(8px)",
      duration: 0.6,
      ease: "power2.inOut",
      onComplete: () => {
        current.classList.remove('active');
        // Reset properties so it starts from initial position next time
        gsap.set(current, { opacity: 0, y: 10, x: 0, scale: 1, filter: "blur(8px)" });
      }
    });

    // 2. Prepare next word (entrance)
    gsap.set(next, { 
      opacity: 1, 
      y: 10, 
      x: 0, 
      scale: 1, 
      filter: "blur(0px)" 
    });
    
    const nextLetters = next.querySelectorAll('.flip-letter');
    gsap.set(nextLetters, { 
      opacity: 0, 
      y: 10, 
      filter: "blur(8px)" 
    });

    next.classList.add('active');
    adjustWrapperWidth(next);

    // 3. Animate next word container (spring) and its letters (staggered)
    gsap.to(next, {
      y: 0,
      duration: 0.5,
      ease: "back.out(1.7)"
    });

    nextLetters.forEach((letter) => {
      const parentWord = letter.closest('.flip-word');
      const wordsArray = Array.from(next.querySelectorAll('.flip-word'));
      const wordIdx = wordsArray.indexOf(parentWord);
      
      const lettersInWord = Array.from(parentWord.querySelectorAll('.flip-letter'));
      const letterInWordIdx = lettersInWord.indexOf(letter);

      const delay = wordIdx * 0.3 + letterInWordIdx * 0.05;

      gsap.to(letter, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.3,
        delay: delay,
        ease: "power2.out"
      });
    });

    currentIndex = nextIndex;
  }, 3000); // cycle words every 3 seconds
}

// Start rotating text
initRotatingText();

// Dismiss cinematic preloader on load
window.addEventListener('load', () => {
  const preloader = document.getElementById('cinematic-preloader');
  if (preloader) {
    preloader.classList.add('fade-out');
  }
});

// Safety fallback timeout
setTimeout(() => {
  const preloader = document.getElementById('cinematic-preloader');
  if (preloader && !preloader.classList.contains('fade-out')) {
    preloader.classList.add('fade-out');
  }
}, 4000);

// ==========================================================================
// 13. Audio UI Controller Integration
// ==========================================================================
function initAudioUI() {
  const soundBtn = document.getElementById('sound-control-btn');
  if (!soundBtn) return;

  const audioSynth = window.MediaHive_AudioSynth;

  // 1. Silent degradation check: hide toggle if audio engine is not supported or disabled
  if (!audioSynth || !audioSynth.isSupported) {
    soundBtn.style.display = 'none';
    console.log("[Audio UI] Audio synth not supported/disabled. Hiding sound toggle.");
    return;
  }

  // 2. Initial state sync
  const updateUI = (isMuted) => {
    if (isMuted) {
      soundBtn.classList.add('muted');
      soundBtn.setAttribute('aria-pressed', 'false');
      soundBtn.setAttribute('aria-label', 'Unmute Sound Effects');
    } else {
      soundBtn.classList.remove('muted');
      soundBtn.setAttribute('aria-pressed', 'true');
      soundBtn.setAttribute('aria-label', 'Mute Sound Effects');
    }
  };

  // Sync initial UI state with synth state
  updateUI(audioSynth.isMuted);

  // 3. Toggle click handler
  const handleToggle = (e) => {
    e.preventDefault();
    audioSynth.toggleMute();
    audioSynth.playUIFeedback('click');
  };

  soundBtn.addEventListener('click', handleToggle);

  // Keyboard navigation (Enter / Space)
  soundBtn.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      audioSynth.toggleMute();
      audioSynth.playUIFeedback('click');
    }
  });

  // 4. Global state sync listener
  window.addEventListener('mediahive-audio-toggle', (e) => {
    updateUI(e.detail.isMuted);
  });
}

// Run Audio UI Initialization
initAudioUI();

// ==========================================================================
// 14. Interactive Audio Bindings & Settle Filters
// ==========================================================================
function initInteractiveAudio() {
  const audioSynth = window.MediaHive_AudioSynth;
  if (!audioSynth || !audioSynth.isSupported) return;

  // 1. Page-wide click/pointerdown to resume suspended AudioContext
  const resumeAudioOnGesture = () => {
    audioSynth.resumeContext();
    document.removeEventListener('pointerdown', resumeAudioOnGesture);
    document.removeEventListener('click', resumeAudioOnGesture);
  };
  document.addEventListener('pointerdown', resumeAudioOnGesture);
  document.addEventListener('click', resumeAudioOnGesture);

  // 2. High-velocity scroll check on Lenis
  if (lenis) {
    lenis.on('scroll', (e) => {
      // e.velocity is typically px/ms. If it exceeds 15px/ms, suppress scroll-based sounds
      if (Math.abs(e.velocity) > 15) {
        window.MediaHive_AudioConfig.isJumping = true;
        clearTimeout(window.MediaHive_AudioConfig.settleTimeout);
        window.MediaHive_AudioConfig.settleTimeout = setTimeout(() => {
          window.MediaHive_AudioConfig.isJumping = false;
        }, 150);
      }
    });

    // 3. Programmatic scroll event suppression for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          window.MediaHive_AudioConfig.isJumping = true;
          lenis.scrollTo(targetEl, {
            duration: 1.2,
            onComplete: () => {
              setTimeout(() => {
                window.MediaHive_AudioConfig.isJumping = false;
              }, 100);
            }
          });
        }
      });
    });
  }

  // 4. Tab Visibility API (Fade out/in master gain)
  document.addEventListener('visibilitychange', () => {
    const now = audioSynth.ctx.currentTime;
    if (document.hidden) {
      audioSynth.masterGain.gain.setValueAtTime(audioSynth.masterGain.gain.value, now);
      audioSynth.masterGain.gain.linearRampToValueAtTime(0, now + 0.2);
    } else {
      if (!audioSynth.isMuted) {
        audioSynth.masterGain.gain.setValueAtTime(audioSynth.masterGain.gain.value, now);
        audioSynth.masterGain.gain.linearRampToValueAtTime(0.8, now + 0.2);
      }
    }
  });

  // 5. Interactive UI micro-SFX (Hover & Click)
  const interactiveSelector = '.cta-btn, .main-nav a, .bento-card, .nav-btn-secondary, .nav-btn-primary, .use-case-card, .footer-links a';
  const interactiveEls = document.querySelectorAll(interactiveSelector);
  
  interactiveEls.forEach(el => {
    el.addEventListener('pointerenter', () => {
      if (!audioSynth.isMuted) {
        audioSynth.playUIFeedback('hover');
      }
    });

    el.addEventListener('pointerdown', () => {
      if (!audioSynth.isMuted) {
        audioSynth.playUIFeedback('click');
      }
    });
  });
}

// Run Interactive Audio bindings
initInteractiveAudio();
