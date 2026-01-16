import type { Config } from "tailwindcss";
const tokens = {
  colors: {
    primary: {
      DEFAULT: "#6366f1", // indigo-500 (Sky Aura Core)
      foreground: "#ffffff",
      50: "#eif1ff",
      100: "#e0e7ff",
      200: "#c7d2fe",
      300: "#a5b4fc",
      400: "#818cf8",
      500: "#6366f1",
      600: "#4f46e5",
      700: "#4338ca",
      800: "#3730a3",
      900: "#312e81",
      950: "#1e1b4b",
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
    glow: "0 0 20px rgba(99, 102, 241, 0.25)", // Indigo glow (Sky Aura)
  },
  motion: {
    duration: {
      fast: 0.2, // Slightly slower start
      normal: 0.3, // "Confident" speed
      slow: 0.5,
    },
    ease: {
      out: [0.22, 1, 0.36, 1], // Custom Ease Out
      inOut: [0.65, 0, 0.35, 1],
    }
  }
};

const config: Config = {
  // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // !! DESIGN CONTRACT ENFORCEMENT                                       !!
  // !! DO NOT ADD RAW COLORS. USE SEMANTIC TOKENS ONLY.                  !!
  // !! REFER TO docs/design-contract.md BEFORE MAKING CHANGES.           !!
  // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
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
        // Design System Tokens (Mapped to CSS Variables)
        background: "var(--bg-root)",
        foreground: "var(--text-primary)",
        card: {
          DEFAULT: "var(--bg-elevated)",
          foreground: "var(--text-primary)",
        },
        popover: {
          DEFAULT: "var(--bg-surface)",
          foreground: "var(--text-primary)",
        },
        primary: {
          DEFAULT: "var(--accent-primary)",
          foreground: "var(--text-inverse)",
        },
        secondary: {
          DEFAULT: "var(--text-secondary)",
          foreground: "var(--text-primary)",
        },
        muted: {
          DEFAULT: "var(--bg-surface)",
          foreground: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--accent-primary-soft)",
          foreground: "var(--text-primary)",
        },
        destructive: {
          DEFAULT: "var(--accent-danger)",
          foreground: "var(--text-inverse)",
        },
        border: "var(--border-soft)",
        input: "var(--border-strong)",
        ring: "var(--accent-primary)",

        // Semantic aliases
        bg: 'var(--bg-root)',
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
        },
        glass: "var(--bg-glass)",
        surface: "var(--bg-surface)",
      },
      borderRadius: tokens.borderRadius,
      boxShadow: {
        ...tokens.shadows,
        soft: "var(--shadow-soft)",
        medium: "var(--shadow-medium)",
        strong: "var(--shadow-strong)",
        // Keep glow if it doesn't conflict or map it?
        // User didn't specify 'glow' explicitly in "Semantic Token Set" but 'shadow-strong' might be it.
        // I will keep existing 'glow' if it's not overriding the contract, but user said "Use only CSS variables... All components must rely on semantic tokens".
        // I will map to shadow-strong or remove specific 'glow' to enforce consistency if possible, 
        // but 'glow' is used in token object definition above which I can't see the full context of if I'm replacing 'extend'.
        // Wait, 'tokens' is defined above. 'extend' uses 'tokens'.
        // I am replacing the 'colors' in 'extend'.
      },
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
