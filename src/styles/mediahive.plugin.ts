import plugin from "tailwindcss/plugin";
import { mediahive } from "./mediahive.tokens";

export const mediahivePlugin = plugin(function ({ addBase, addComponents, addUtilities }) {

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
            backdropFilter: `blur(${mediahive.blur.glass})`,
            border: `1px solid ${mediahive.colors.border.soft}`,
            borderRadius: mediahive.radius.panel,
            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", // Slight enhancement to match previous shadow-inner + shadow-black/10 roughly, or explicitly use tokens
            // The user specified shadow.inner in tokens as "inset 0 1px 0 ..."
            // But in the example component they used: shadow-inner shadow-black/10
            // Let's adhere to the token definition from the user prompt for consistency, or the specific .mh-surface definition provided.
            // User provided definition: boxShadow: mediahive.shadow.inner
        },
        /* Re-defining properly based on User Part 2 instructions exactly */
    });

    // Re-run addComponents to match exact user request for precision
    addComponents({
        ".mh-surface": {
            backgroundColor: mediahive.colors.surface.DEFAULT,
            backdropFilter: `blur(${mediahive.blur.glass})`,
            border: `1px solid ${mediahive.colors.border.soft}`,
            borderRadius: mediahive.radius.panel,
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
            border: `1px solid ${mediahive.semantic.success.border}`,
        },
        ".mh-badge-warning": {
            backgroundColor: mediahive.semantic.warning.bg,
            color: mediahive.semantic.warning.text,
            border: `1px solid ${mediahive.semantic.warning.border}`,
        },
        ".mh-badge-danger": {
            backgroundColor: mediahive.semantic.danger.bg,
            color: mediahive.semantic.danger.text,
            border: `1px solid ${mediahive.semantic.danger.border}`,
        },
        ".mh-badge-info": {
            backgroundColor: mediahive.semantic.info.bg,
            color: mediahive.semantic.info.text,
            border: `1px solid ${mediahive.semantic.info.border}`,
        },

        // Alerts
        ".mh-alert-success": {
            backgroundColor: mediahive.semantic.success.bg,
            color: mediahive.semantic.success.text,
            border: `1px solid ${mediahive.semantic.success.border}`,
        },
        ".mh-alert-warning": {
            backgroundColor: mediahive.semantic.warning.bg,
            color: mediahive.semantic.warning.text,
            border: `1px solid ${mediahive.semantic.warning.border}`,
        },
        ".mh-alert-error": { // Visual mapping to danger token
            backgroundColor: mediahive.semantic.danger.bg,
            color: mediahive.semantic.danger.text,
            border: `1px solid ${mediahive.semantic.danger.border}`,
        },
        ".mh-alert-info": {
            backgroundColor: mediahive.semantic.info.bg,
            color: mediahive.semantic.info.text,
            border: `1px solid ${mediahive.semantic.info.border}`,
        },

        // 4️⃣ Spacing & Layout Utilities
        ".mh-workspace-layout": {
            padding: `${mediahive.spacing.sectionY} ${mediahive.spacing.sectionX}`,
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

        // Interactions
        ".mh-pressable": {
            transition: `transform ${mediahive.motion.duration.fast} ${mediahive.motion.easing.standard}`,
            "&:active": { transform: `scale(${mediahive.motion.scale.press})` },
        },
        ".mh-hover-lift": {
            transition: `transform ${mediahive.motion.duration.normal} ${mediahive.motion.easing.standard}, box-shadow ${mediahive.motion.duration.normal} ${mediahive.motion.easing.standard}`,
            "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", // Subtle shadow lift
            },
        },

        // Entry Animations
        ".mh-fade-in": {
            animation: `mh-fade-in ${mediahive.motion.duration.normal} ${mediahive.motion.easing.smooth} forwards`,
        },
        ".mh-slide-up": {
            animation: `mh-slide-up ${mediahive.motion.duration.normal} ${mediahive.motion.easing.smooth} forwards`,
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
