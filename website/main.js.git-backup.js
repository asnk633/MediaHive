import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Initialize RectAreaLightUniformsLib for RectAreaLight support in MeshStandardMaterial
RectAreaLightUniformsLib.init();

console.log('Base URL:', import.meta.url);
console.log('Image test:', new URL('/images/desk-hero.jpg', import.meta.url).href);

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

function createIphoneVideoTexture(videoUrl, originalImage) {
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
  const iphoneCanvas = document.getElementById('iphone-canvas');
  
  function update() {
    if (!isVisible) {
      isAnimating = false;
      return;
    }
    requestAnimationFrame(update);

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
  ctx.fillText('🐝 MediaHive', 210, 42);

  // Left sidebar: 5 nav items
  const navItems = ['📊 Dashboard', '📋 Tasks', '📅 Calendar', '💬 Messages', '⚙️ Settings'];
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
      }
    }
  });

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

  // Desktop overlay appears at 2700px / 0.771 progress
  scrollTimeline
    .to('#desktop-overlay', {
      opacity: 1,
      x: 0,
      duration: 0.16,
      ease: 'power1.out',
      onStart: () => gsap.set('#desktop-overlay', { pointerEvents: 'auto', visibility: 'visible' }),
      onReverseComplete: () => gsap.set('#desktop-overlay', { pointerEvents: 'none', visibility: 'hidden' })
    }, 0.771);

  // --- Hero Background Sequence Animation ---
  const bgCanvas = document.getElementById('hero-bg-canvas');
  const frameNames = [
    "00000", "00007", "00013", "00020", "00027", "00034", "00040", "00047", "00054", "00061",
    "00067", "00074", "00081", "00087", "00094", "00101", "00108", "00114", "00121", "00128",
    "00134", "00141", "00148", "00155", "00161", "00168", "00175", "00182", "00188", "00195"
  ];
  let renderBgFrame = () => {};

  if (bgCanvas) {
    const bgCtx = bgCanvas.getContext('2d');
    
    const resizeBgCanvas = () => {
      bgCanvas.width = window.innerWidth;
      bgCanvas.height = window.innerHeight;
      if (typeof sequence !== 'undefined') renderBgFrame(sequence.frame);
    };
    window.addEventListener('resize', resizeBgCanvas);
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;

    const images = [];
    let imagesLoaded = 0;
    
    for (let i = 0; i < frameNames.length; i++) {
      const img = new Image();
      img.src = `/images/frames/${i + 1}.png`;
      images.push(img);
      img.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === 1) renderBgFrame(0);
      };
    }

    renderBgFrame = (index) => {
      if (!images[index] || !images[index].complete || images[index].naturalWidth === 0) return;
      
      const img = images[index];
      const canvasRatio = bgCanvas.width / bgCanvas.height;
      const imgRatio = img.width / img.height;
      let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
      
      if (imgRatio > canvasRatio) {
        drawHeight = bgCanvas.height;
        drawWidth = img.width * (bgCanvas.height / img.height);
        offsetX = (bgCanvas.width - drawWidth) / 2;
      } else {
        drawWidth = bgCanvas.width;
        drawHeight = img.height * (bgCanvas.width / img.width);
        offsetY = (bgCanvas.height - drawHeight) / 2;
      }
      
      bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      bgCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };
  }

  // --- Hero Laptop 3D Animation ---
  const heroCanvas = document.getElementById('hero-laptop-canvas');
  if (heroCanvas) {
    let heroModelGroup = null;
    
    initDevice('hero-laptop-canvas', '/models/macbook_pro_14_inch_M5.glb', 2.8, () => createVideoTexture('/video/laptop-demo.mp4'), { 
      skipScrollTrigger: true,
      rotateX: 0.1,
      rotateY: -0.5,
      onModelLoaded: (group) => {
        heroModelGroup = group;
      }
    });

    const sequence = { frame: 0 };
    const laptopAnim = { p: 0 };

    if (bgCanvas) bgCanvas.style.opacity = 1;
    if (heroCanvas) heroCanvas.style.opacity = 0;

    // 1. Background Sequence Animation (scrubs up to progress 0.75)
    scrollTimeline.to(sequence, {
      frame: frameNames.length - 1,
      snap: "frame",
      duration: 0.75, 
      ease: "none",
      onUpdate: function() {
        if (bgCanvas) renderBgFrame(sequence.frame);
      }
    }, 0);

    // Logo styling initial setup
    const logoOverlayEl = document.getElementById('hero-logo-overlay');
    if (logoOverlayEl) {
      logoOverlayEl.style.display = 'none';
      logoOverlayEl.style.opacity = 0;
    }

    // 2. Fade out background sequence, bottom gradient, and dark horizon glow (starts at 0.65, fully transparent by 0.75)
    if (bgCanvas) {
      scrollTimeline.to(bgCanvas, {
        opacity: 0,
        duration: 0.10, 
        ease: "none"
      }, 0.65);
    }

    const bottomFadeEl = document.getElementById('hero-bottom-fade');
    if (bottomFadeEl) {
      scrollTimeline.to(bottomFadeEl, {
        opacity: 0,
        duration: 0.10,
        ease: "none"
      }, 0.65);
    }

    const darkGlowEl = document.getElementById('hero-dark-glow');
    if (darkGlowEl) {
      scrollTimeline.to(darkGlowEl, {
        opacity: 0,
        duration: 0.10,
        ease: "none"
      }, 0.65);
    }

    // 3. Fade in 3D Laptop (starts at 0.65, fully visible by 0.75)
    if (heroCanvas) {
      scrollTimeline.to(heroCanvas, {
        opacity: 1,
        duration: 0.10, 
        ease: "none"
      }, 0.65);
    }

    // 4. Laptop 3D Animation (starts at 0.65 and completes at 1.0)
    scrollTimeline.to(laptopAnim, {
      p: 1,
      duration: 0.35,
      ease: "power2.out",
      onUpdate: function() {
        if (heroModelGroup) {
          const p = laptopAnim.p;
          heroModelGroup.position.y = -4.2 + (p * 4.5);  
          heroModelGroup.position.x = p * 0.65;
          heroModelGroup.rotation.y = -0.8 + (p * 0.8); 
          heroModelGroup.rotation.x = 0.5 - (p * 0.4);  
        }
      }
    }, 0.65);
  }
}

function initSilkBackground() {
  const canvas = document.getElementById('global-silk-canvas');
  const dbg = document.getElementById('frame-debugger');
  if (!canvas) {
    if (dbg) dbg.innerText += "\n[Silk: Canvas NotFound]";
    return;
  }

  try {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.set(0, 0, 1);

    const hexToNormalizedRGB = (hex) => {
      const clean = hex.replace('#', '');
      const r = parseInt(clean.slice(0, 2), 16) / 255;
      const g = parseInt(clean.slice(2, 4), 16) / 255;
      const b = parseInt(clean.slice(4, 6), 16) / 255;
      return new THREE.Vector3(r, g, b);
    };

    // Cinematic dark indigo/purple color that fits perfectly with MediaHive theme (brightened for visibility)
    const uColorValue = hexToNormalizedRGB('#4f3987');

    const uniforms = {
      uTime: { value: 0 },
      uSpeed: { value: 5.0 }, // ReactBits default speed
      uScale: { value: 1.0 }, // Wavy texture frequency scale
      uNoiseIntensity: { value: 0.6 }, // Subtle background noise (grain)
      uColor: { value: uColorValue },
      uRotation: { value: 0.0 }
    };

    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vPosition;

      void main() {
        vPosition = position;
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec2 vUv;
      varying vec3 vPosition;

      uniform float uTime;
      uniform vec3  uColor;
      uniform float uSpeed;
      uniform float uScale;
      uniform float uRotation;
      uniform float uNoiseIntensity;

      const float e = 2.71828182845904523536;

      float noise(vec2 texCoord) {
        float G = e;
        vec2  r = (G * sin(G * texCoord));
        return fract(r.x * r.y * (1.0 + texCoord.x));
      }

      vec2 rotateUvs(vec2 uv, float angle) {
        float c = cos(angle);
        float s = sin(angle);
        mat2  rot = mat2(c, -s, s, c);
        return rot * uv;
      }

      void main() {
        float rnd        = noise(gl_FragCoord.xy);
        vec2  uv         = rotateUvs(vUv * uScale, uRotation);
        vec2  tex        = uv * uScale;
        float tOffset    = uSpeed * uTime;

        tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

        float pattern = 0.6 +
                        0.4 * sin(5.0 * (tex.x + tex.y +
                                         cos(3.0 * tex.x + 5.0 * tex.y) +
                                         0.02 * tOffset) +
                                 sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

        vec4 col = vec4(uColor, 1.0) * vec4(pattern);
        col.rgb -= (rnd / 15.0 * uNoiseIntensity);
        col.a = 1.0;
        gl_FragColor = col;
      }
    `;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const clock = new THREE.Clock();
    let renderCount = 0;

    function animate() {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const clampedDelta = Math.min(delta, 0.1); // Prevent jumps when switching tabs
      uniforms.uTime.value += 0.1 * clampedDelta;
      renderer.render(scene, camera);
      
      // Update screen debugger once to show rendering loop is successfully executing
      renderCount++;
      if (renderCount === 60) {
        if (dbg && !dbg.innerText.includes("Silk rendering")) {
          dbg.innerText += " | Silk rendering";
        }
      }
    }

    animate();

    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  } catch (err) {
    if (dbg) dbg.innerText += `\n[Silk: InitErr - ${err.message}]`;
    console.error("Silk background initialization error:", err);
  }
}

function setupGlobalBackground() {
  // Initialize dynamic Silk shader background
  initSilkBackground();

  // Set initial glow states (ensures smooth transition on load)
  gsap.set('.glow-purple', { opacity: 0.55, scale: 1.0, x: 0, y: 0 });
  gsap.set('.glow-blue', { opacity: 0.15, scale: 1.0, x: 0, y: 0 });
  gsap.set('.glow-indigo', { opacity: 0.1, scale: 1.0, x: 0, y: 0 });
  gsap.set('.glow-teal', { opacity: 0.1, scale: 1.0, x: 0, y: 0 });

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

  // Global debugger update
  const updateDebugger = () => {
    const debuggerEl = document.getElementById('frame-debugger');
    if (debuggerEl) {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? (scrollY / maxScroll * 100).toFixed(1) : 0;
      
      debuggerEl.innerText = `Scroll: ${Math.round(scrollY)}px (${progress}%)`;
    }
  };

  lenis.on('scroll', updateDebugger);
  window.addEventListener('scroll', updateDebugger);
  
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
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

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
  ctx.fillText('🍯 MediaHive', 24, 38);
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
    { text: '📋 Tasks', active: true },
    { text: '📅 Calendar', active: false },
    { text: '📁 Assets', active: false },
    { text: '👥 Team', active: false }
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
  ctx.fillText('📶 🔋', 358, 34);
  ctx.textAlign = 'left';

  // App Header
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 60, 390, 60);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, 119, 390, 1);
  ctx.fillStyle = '#F5A623';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('🍯 MediaHive', 24, 98);

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
  ctx.fillText('📊', 48, 790);

  ctx.fillStyle = '#9ca3af';
  ctx.fillText('📋', 138, 790);
  ctx.fillText('💬', 228, 790);
  ctx.fillText('⚙️', 318, 790);

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

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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

  const texture = createTextureFn();

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
        child.material.envMapIntensity = 0.3;
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
          name === 'tftbkkzhxqpkrgc' || // Macbook screen mesh name
          name === 'auxuzfpidyyvcpo' || // iPad screen mesh name
          matName === 'hlqwfcapwzetdqy' || // Macbook screen material name
          matName === 'hlumgtgdbnvpsa' ||   // iPad screen material name
          matName === 'material_10';       // Pizza3 iPhone screen material name

        if (isScreen) {
          console.log(`[3D Setup] Applying texture to screen mesh: "${child.name}" with material: "${child.material.name}"`);
          child.material = new THREE.MeshBasicMaterial({
            map: texture,
            color: 0xffffff,
            depthTest: true,
            depthWrite: true,
            transparent: false
          });
          child.material.needsUpdate = true;
        } else if (matName === 'scene_-_root') {
          // This is the original iPhone model which is a single unified mesh using a single material!
          // We draw the video onto the screen region of its original texture atlas via a 2D canvas,
          // so the rest of the phone body doesn't get overwritten with the video.
          console.log(`[3D Setup] Intercepting texture atlas for unified material: "${child.material.name}"`);
          if (child.material.map && child.material.map.image) {
            const originalImage = child.material.map.image;
            const videoTexture = createIphoneVideoTexture('/video/mobile-demo.mp4', originalImage);
            child.material.map = videoTexture;
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
      if (isVisible && !isAnimating) {
        isAnimating = true;
        render();
      }
    });
  }, { threshold: 0 });
  observer.observe(targetElement);

  function render() {
    if (!isVisible) {
      isAnimating = false;
      return;
    }
    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }
  render();
}

// Initialize iPad and iPhone in Hero section
initDevice('ipad-canvas', '/models/ipad_pro_13_silver_m4.glb', 2.6, () => createVideoTexture('/video/tablet-demo.mp4', -Math.PI / 2, 1.15), { rotateX: Math.PI / 2 });

initDevice('iphone-canvas', '/models/iphone_16_pro_max.glb', 3.0, () => null, { rotateY: 0.26, rotateZ: -0.09 });

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
  { selector: '.feature-card', y: 40, stagger: 0.08 },
  { selector: '.founder-container', y: 40 },
  { selector: '.before-footer-section', y: 30 }
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
