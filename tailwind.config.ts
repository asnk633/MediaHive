import type { Config } from "tailwindcss";
const tokens = {
  colors: {
    primary: {
      DEFAULT: "#10b981", // emerald-500
      foreground: "#ffffff",
      50: "#ecfdf5",
      100: "#d1fae5",
      200: "#a7f3d0",
      300: "#6ee7b7",
      400: "#34d399",
      500: "#10b981",
      600: "#059669",
      700: "#047857",
      800: "#065f46",
      900: "#064e3b",
      950: "#022c22",
    },
    accent: {
      DEFAULT: "#3b82f6", // blue-500
      foreground: "#ffffff",
      50: "#eff6ff",
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
      950: "#172554",
    },
    background: {
      DEFAULT: "#0c0c0c",
      subtle: "#121212",
      card: "#18181b", // zinc-900
      glass: "rgba(24, 24, 27, 0.6)",
    },
    surface: {
      DEFAULT: "#27272a", // zinc-800
      hover: "#3f3f46", // zinc-700
      active: "#52525b", // zinc-600
    },
    text: {
      primary: "#fafafa", // zinc-50
      secondary: "#a1a1aa", // zinc-400
      muted: "#71717a", // zinc-500
      inverted: "#09090b", // zinc-950
    },
    status: {
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
    }
  },
  borderRadius: {
    sm: "0.375rem", // 6px
    md: "0.75rem",  // 12px
    lg: "1rem",     // 16px
    xl: "1.5rem",   // 24px
    full: "9999px",
  },
  spacing: {
    // We will use Tailwind's default spacing scale but ensure we have these specific ones
    xs: "0.25rem", // 4px
    sm: "0.5rem",  // 8px
    md: "1rem",    // 16px
    lg: "1.5rem",  // 24px
    xl: "2rem",    // 32px
  },
  shadows: {
    soft: "0 4px 20px -2px rgba(0, 0, 0, 0.2)",
    elevated: "0 10px 40px -10px rgba(0, 0, 0, 0.5)",
    glow: "0 0 20px rgba(16, 185, 129, 0.3)", // Primary glow
  },
  motion: {
    duration: {
      fast: 0.15,
      normal: 0.25,
      slow: 0.4,
    },
    ease: {
      out: [0.215, 0.61, 0.355, 1], // easeOutCubic
      inOut: [0.645, 0.045, 0.355, 1], // easeInOutCubic
    }
  }
};

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/client/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Design System Tokens
        ...tokens.colors,

        // Shadcn/Semantic Mappings
        // Shadcn/Semantic Mappings
        input: "rgba(255, 255, 255, 0.1)",
        ring: tokens.colors.primary.DEFAULT,
        foreground: tokens.colors.text.primary,
        primary: {
          ...tokens.colors.primary,
          start: 'var(--color-primary-start)',
          end: 'var(--color-primary-end)',
        },
        secondary: {
          DEFAULT: tokens.colors.surface.DEFAULT,
          foreground: tokens.colors.text.primary,
        },
        destructive: {
          DEFAULT: tokens.colors.status.error,
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: tokens.colors.surface.hover,
          foreground: tokens.colors.text.muted,
        },
        accent: {
          DEFAULT: tokens.colors.surface.active,
          foreground: tokens.colors.text.primary,
        },
        popover: {
          DEFAULT: tokens.colors.surface.DEFAULT,
          foreground: tokens.colors.text.primary,
        },


        // Brand Design Tokens
        // white: 'var(--color-white)', // Disabled to allow standard opacity modifiers (bg-white/5)
        bg: 'var(--bg-app)', // Updated to map to the new gradient variable
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
        },
        // Updated Semantic Mappings for Glassmorphism
        border: "hsl(var(--border))",
        card: {
          DEFAULT: "var(--bg-card)",
          foreground: "var(--text-primary)",
        },
        background: "hsl(var(--background))",
      },
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.shadows,
      fontFamily: {
        sans: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
