import type { Config } from "tailwindcss";
import { tokens } from "./src/styles/design-tokens";

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
        border: "var(--border-subtle)",
        card: {
          DEFAULT: "var(--bg-card)",
          foreground: "var(--text-primary)",
        },
        background: "var(--bg-app)",
      },
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.shadows,
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
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
