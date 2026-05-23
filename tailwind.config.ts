import type { Config } from "tailwindcss";

import plugin from "tailwindcss/plugin";
const mediahive = {
  colors: {
    canvas: "#0b1220",

    surface: {
      DEFAULT: "rgba(255,255,255,0.03)",
      subtle: "rgba(255,255,255,0.02)",
      strong: "rgba(255,255,255,0.05)",
    },

    border: {
      DEFAULT: "rgba(255,255,255,0.06)",
      soft: "rgba(255,255,255,0.04)",
    },

    text: {
      primary: "#ffffff",
      body: "#cbd5e1",     // slate-300
      secondary: "#94a3b8", // slate-400
      muted: "#64748b",     // slate-500
    },
  },

  radius: {
    panel: "0.75rem", // rounded-xl
    small: "0.5rem",  // rounded-lg
  },

  blur: {
    glass: "20px", // backdrop-blur-xl equivalent
  },

  shadow: {
    inner: "inset 0 1px 0 rgba(255,255,255,0.03)",
  },
  semantic: {
    success: {
      bg: "rgba(34,197,94,0.08)",
      border: "rgba(34,197,94,0.25)",
      text: "#4ade80",
    },
    warning: {
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.25)",
      text: "#fbbf24",
    },
    danger: { // Kept as 'danger' in tokens to match previous usage, but mapped to 'error' concept in UI
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.25)",
      text: "#f87171",
    },
    info: {
      bg: "rgba(59,130,246,0.08)",
      border: "rgba(59,130,246,0.25)",
      text: "#60a5fa",
    },
  },

  spacing: {
    // Strict 4px Grid
    xs: "0.25rem",  // 4px
    sm: "0.5rem",   // 8px
    md: "0.75rem",  // 12px
    lg: "1rem",     // 16px
    xl: "1.5rem",   // 24px
    "2xl": "2rem",  // 32px

    // Semantic Layout (Legacy/Bridge)
    sectionY: "2.5rem", // py-10
    sectionX: "2.5rem", // px-10
    cardPadding: "1.5rem", // p-6
    gap: "2rem", // gap-8
  },

  density: {
    comfortable: {
      rowHeight: "3.5rem", // 56px
      fontSize: "0.875rem", // 14px
      padding: "1rem", // 16px
    },
    compact: {
      rowHeight: "2.5rem", // 40px
      fontSize: "0.8125rem", // 13px
      padding: "0.5rem", // 8px
    }
  },

  motion: {
    duration: {
      fast: "120ms",
      normal: "200ms",
      slow: "300ms",
    },
    easing: {
      standard: "cubic-bezier(0.4, 0, 0.2, 1)",
      smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
    },
    scale: {
      press: "0.97",
    }
  },
};

const mediahivePlugin = plugin(function ({ addBase, addComponents, addUtilities }) {

  // 1️⃣ Base Layer (Canvas Lock)
  addBase({
    'body': {
      backgroundColor: mediahive.colors.canvas,
      color: mediahive.colors.text.primary,
    },
  });

  // 2️⃣ Surface Components
  addComponents({
    ".mh-surface": {
      backgroundColor: mediahive.colors.surface.DEFAULT,
      backdropFilter: "blur(" + mediahive.blur.glass + ")",
      border: "1px solid " + mediahive.colors.border.soft,
      borderRadius: mediahive.radius.panel,
      // User provided definition: boxShadow: mediahive.shadow.inner
      boxShadow: mediahive.shadow.inner,
    },

    ".mh-surface-subtle": {
      backgroundColor: mediahive.colors.surface.subtle,
    },

    ".mh-surface-strong": {
      backgroundColor: mediahive.colors.surface.strong,
    },

    ".mh-border": {
      borderColor: mediahive.colors.border.DEFAULT,
    },

    ".mh-text-body": {
      color: mediahive.colors.text.body,
    },

    ".mh-text-secondary": {
      color: mediahive.colors.text.secondary,
    },

    ".mh-text-muted": {
      color: mediahive.colors.text.muted,
    },

    // 3️⃣ Semantic Utilities
    ".mh-text-success": { color: mediahive.semantic.success.text },
    ".mh-text-warning": { color: mediahive.semantic.warning.text },
    ".mh-text-danger": { color: mediahive.semantic.danger.text },
    ".mh-text-info": { color: mediahive.semantic.info.text },

    // Badges
    ".mh-badge-success": {
      backgroundColor: mediahive.semantic.success.bg,
      color: mediahive.semantic.success.text,
      border: "1px solid " + mediahive.semantic.success.border,
    },
    ".mh-badge-warning": {
      backgroundColor: mediahive.semantic.warning.bg,
      color: mediahive.semantic.warning.text,
      border: "1px solid " + mediahive.semantic.warning.border,
    },
    ".mh-badge-danger": {
      backgroundColor: mediahive.semantic.danger.bg,
      color: mediahive.semantic.danger.text,
      border: "1px solid " + mediahive.semantic.danger.border,
    },
    ".mh-badge-info": {
      backgroundColor: mediahive.semantic.info.bg,
      color: mediahive.semantic.info.text,
      border: "1px solid " + mediahive.semantic.info.border,
    },

    // Alerts
    ".mh-alert-success": {
      backgroundColor: mediahive.semantic.success.bg,
      color: mediahive.semantic.success.text,
      border: "1px solid " + mediahive.semantic.success.border,
    },
    ".mh-alert-warning": {
      backgroundColor: mediahive.semantic.warning.bg,
      color: mediahive.semantic.warning.text,
      border: "1px solid " + mediahive.semantic.warning.border,
    },
    ".mh-alert-error": { // Visual mapping to danger token
      backgroundColor: mediahive.semantic.danger.bg,
      color: mediahive.semantic.danger.text,
      border: "1px solid " + mediahive.semantic.danger.border,
    },
    ".mh-alert-info": {
      backgroundColor: mediahive.semantic.info.bg,
      color: mediahive.semantic.info.text,
      border: "1px solid " + mediahive.semantic.info.border,
    },

    // 4️⃣ Spacing & Layout Utilities
    ".mh-workspace-layout": {
      padding: mediahive.spacing.sectionY + " " + mediahive.spacing.sectionX,
    },
    ".mh-card-padding": {
      padding: mediahive.spacing.cardPadding,
    },
    ".mh-grid-gap": {
      gap: mediahive.spacing.gap,
    }
  });

  // 5️⃣ Motion Utilities
  addUtilities({
    // Transitions
    ".mh-transition": {
      transitionProperty: "all",
      transitionDuration: mediahive.motion.duration.normal,
      transitionTimingFunction: mediahive.motion.easing.standard
    },
    ".mh-transition-fast": {
      transitionProperty: "all",
      transitionDuration: mediahive.motion.duration.fast,
      transitionTimingFunction: mediahive.motion.easing.standard
    },
    ".mh-transition-slow": {
      transitionProperty: "all",
      transitionDuration: mediahive.motion.duration.slow,
      transitionTimingFunction: mediahive.motion.easing.standard
    },

    // Entry Animations
    ".mh-fade-in": {
      animation: "mh-fade-in " + mediahive.motion.duration.normal + " " + mediahive.motion.easing.smooth + " forwards",
    },
    ".mh-slide-up": {
      animation: "mh-slide-up " + mediahive.motion.duration.normal + " " + mediahive.motion.easing.smooth + " forwards",
    },
  });

  // Interaction utilities with pseudo-selectors (must use addComponents)
  addComponents({
    ".mh-pressable": {
      transition: "transform " + mediahive.motion.duration.fast + " " + mediahive.motion.easing.standard,
      "&:active": { transform: "scale(" + mediahive.motion.scale.press + ")" },
    },
    ".mh-hover-lift": {
      transition: "transform " + mediahive.motion.duration.normal + " " + mediahive.motion.easing.standard + ", box-shadow " + mediahive.motion.duration.normal + " " + mediahive.motion.easing.standard,
      "&:hover": {
        transform: "translateY(-1px)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      },
    },
  });

  // 6️⃣ Density Utilities
  addUtilities({
    ".mh-density-comfortable": {
      "--mh-row-height": mediahive.density.comfortable.rowHeight,
      "--mh-cell-padding": mediahive.density.comfortable.padding,
      fontSize: mediahive.density.comfortable.fontSize,
    },
    ".mh-density-compact": {
      "--mh-row-height": mediahive.density.compact.rowHeight,
      "--mh-cell-padding": mediahive.density.compact.padding,
      fontSize: mediahive.density.compact.fontSize,
    },
  });

  // 7️⃣ Keyframes
  addComponents({
    "@keyframes mh-fade-in": {
      "0%": { opacity: "0" },
      "100%": { opacity: "1" },
    },
    "@keyframes mh-slide-up": {
      "0%": { transform: "translateY(6px)", opacity: "0" },
      "100%": { transform: "translateY(0)", opacity: "1" },
    },
  });
});

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // v3 Semantic Mappings
        background: "var(--bg-root-fallback)",
        foreground: "rgb(var(--text-primary) / <alpha-value>)",

        // Tier System
        tier2: "var(--tier2-panel)",
        tier3: "var(--tier3-surface)",

        // Navigation Anchor
        sidebar: "var(--nav-sidebar)",

        card: {
          DEFAULT: "transparent",
          foreground: "rgb(var(--text-primary) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "var(--popover-bg)", // Matches Tier 2 base
          foreground: "rgb(var(--text-primary) / <alpha-value>)",
        },

        // Brand / Action
        primary: {
          DEFAULT: "var(--accent-primary)",
          foreground: "rgb(var(--text-primary) / <alpha-value>)",
          soft: "var(--accent-primary-soft)",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#000000",
        },

        // Text
        muted: {
          DEFAULT: "var(--popover-bg)",
          foreground: "rgb(var(--text-muted) / <alpha-value>)",
        },

        // Borders
        border: "var(--border-subtle)",
        input: "var(--border-subtle)",
        ring: "var(--accent-primary)",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
        full: "9999px",
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
      },
      boxShadow: {
        tier2: "var(--shadow-tier2)",
        tier3: "var(--shadow-tier3)",
        none: "none",
      },
      backgroundImage: {
        'tier1-canvas': "var(--tier1-canvas)",
        'tier2-panel': "var(--tier2-panel)",
        'tier3-surface': "var(--tier3-surface)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        heading: ["var(--font-heading)", "sans-serif"],
      },
      // Removed all custom animations and keyframes to strictly follow "Zero Drama"
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    mediahivePlugin,
  ],
};

export default config;
