import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/client/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // v3 Semantic Mappings
        background: "var(--bg-root-fallback)",
        foreground: "var(--text-primary)",

        // Tier System
        tier2: "var(--tier2-panel)",
        tier3: "var(--tier3-surface)",

        // Navigation Anchor
        sidebar: "var(--nav-sidebar)",

        card: {
          DEFAULT: "transparent",
          foreground: "var(--text-primary)",
        },
        popover: {
          DEFAULT: "#262628", // Matches Tier 2 base
          foreground: "var(--text-primary)",
        },

        // Brand / Action
        primary: {
          DEFAULT: "var(--accent-primary)",
          foreground: "var(--text-primary)",
          soft: "var(--accent-primary-soft)",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#000000",
        },

        // Text
        muted: {
          DEFAULT: "#262628",
          foreground: "var(--text-muted)",
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
  plugins: [require("tailwindcss-animate")],
};

export default config;
