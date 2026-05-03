export const mediahive = {
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
