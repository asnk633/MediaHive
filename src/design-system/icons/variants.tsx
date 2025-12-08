// src/design-system/icons/variants.tsx
import React, { forwardRef } from "react";

/**
 * BONUS ICON VARIANTS
 * - Filled: solid shapes
 * - Duotone: uses two fills (accent + light)
 * - Rounded: geometric rounded stroke icons
 * - Motion: small built-in subtle animation (pulse/float)
 *
 * All icons use currentColor for single-tone or CSS variables for duotone:
 * --accent (primary purple), --accent-2 (secondary teal), --icon (foreground),
 * --icon-muted (muted)
 *
 * Accessibility: supply title or aria-label.
 */

/* Shared types */
export type SVGProps = React.SVGProps<SVGSVGElement> & { title?: string };

/* ---------------------------
   FILLED (SOLID) ICONS
   --------------------------- */
export const Filled = {
    Home: forwardRef<SVGSVGElement, SVGProps>(({ title = "Home", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 24 24" {...p} xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden={!title && !p["aria-label"]}>
            {title ? <title>{title}</title> : null}
            <path fill="currentColor" d="M12 3.2l8 6.2v9.1a1 1 0 0 1-1 1h-5v-5H10v5H5a1 1 0 0 1-1-1V9.4l8-6.2z" />
        </svg>
    )),
    Tasks: forwardRef<SVGSVGElement, SVGProps>(({ title = "Tasks", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 24 24" {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <rect x="3" y="4" width="18" height="6" rx="2" fill="currentColor" />
            <rect x="3" y="14" width="18" height="6" rx="2" fill="currentColor" />
            <circle cx="7.5" cy="7" r="1" fill="rgba(255,255,255,0.96)" />
            <circle cx="7.5" cy="17" r="1" fill="rgba(255,255,255,0.96)" />
        </svg>
    )),
    Events: forwardRef<SVGSVGElement, SVGProps>(({ title = "Events", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 24 24" {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <rect x="2.5" y="4" width="19" height="16" rx="3" fill="currentColor" />
            <rect x="6" y="8" width="6" height="2" rx="1" fill="rgba(255,255,255,0.95)" />
        </svg>
    )),
    Reports: forwardRef<SVGSVGElement, SVGProps>(({ title = "Reports", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 24 24" {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <rect x="3" y="3.5" width="18" height="17" rx="2.5" fill="currentColor" />
            <g fill="rgba(255,255,255,0.95)">
                <rect x="6" y="7" width="12" height="2" rx="1" />
                <rect x="6" y="11" width="9" height="2" rx="1" />
                <rect x="6" y="15" width="6" height="2" rx="1" />
            </g>
        </svg>
    )),
    Downloads: forwardRef<SVGSVGElement, SVGProps>(({ title = "Downloads", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 24 24" {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <rect x="3" y="16" width="18" height="4" rx="1.5" fill="currentColor" />
            <path fill="currentColor" d="M12 6v8l4-4-1.4-1.4L13 10.2V6z" />
        </svg>
    )),
    Profile: forwardRef<SVGSVGElement, SVGProps>(({ title = "Profile", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 24 24" {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <circle cx="12" cy="8" r="3.2" fill="currentColor" />
            <path fill="currentColor" d="M4 20c1.8-4 6-6 8-6s6.2 2 8 6H4z" />
        </svg>
    )),
    Plus: forwardRef<SVGSVGElement, SVGProps>(({ title = "Add", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 36 36" {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <circle cx="18" cy="18" r="16" fill="currentColor" />
            <path d="M18 10v16M10 18h16" stroke="rgba(255,255,255,0.98)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )),
};

/* ---------------------------
   DUOTONE ICONS
   Uses CSS variables:
   --accent : primary purple
   --accent-2 : secondary teal (optional)
   --duo-bg : soft white-ish (or low-contrast)
   --------------------------- */
export const Duotone = {
    Home: forwardRef<SVGSVGElement, SVGProps>(({ title = "Home", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 24 24" {...p} xmlns="http://www.w3.org/2000/svg" role="img">
            {title ? <title>{title}</title> : null}
            <path fill="var(--accent)" d="M12 3.2l8 6.2v9.1a1 1 0 0 1-1 1h-5v-5H10v5H5a1 1 0 0 1-1-1V9.4l8-6.2z" />
            <path fill="var(--duo-bg, rgba(255,255,255,0.06))" d="M7 12h10v8H7z" />
        </svg>
    )),
    Tasks: forwardRef<SVGSVGElement, SVGProps>(({ title = "Tasks", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 24 24" {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <rect x="3" y="4" width="18" height="6" rx="2" fill="var(--accent)" />
            <rect x="3" y="14" width="18" height="6" rx="2" fill="var(--duo-bg)" />
            <path d="M7.2 6.5l1.8 1.6 3.6-3.2" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )),
    Events: forwardRef<SVGSVGElement, SVGProps>(({ title = "Events", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 24 24" {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <rect x="2.5" y="4" width="19" height="16" rx="3" fill="var(--duo-bg)" />
            <path d="M7 8h10" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="6.5" cy="7.5" r="1" fill="var(--accent)" />
        </svg>
    )),
    Reports: forwardRef<SVGSVGElement, SVGProps>(({ title = "Reports", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 24 24" {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <rect x="3" y="3.5" width="18" height="17" rx="2.5" fill="var(--duo-bg)" />
            <g fill="var(--accent)">
                <rect x="6" y="7" width="12" height="2" rx="1" />
                <rect x="6" y="11" width="9" height="2" rx="1" />
            </g>
            <rect x="6" y="15" width="6" height="2" rx="1" fill="rgba(255,255,255,0.9)" />
        </svg>
    )),
    Downloads: forwardRef<SVGSVGElement, SVGProps>(({ title = "Downloads", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 24 24" {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <rect x="3" y="16" width="18" height="4" rx="1.5" fill="var(--duo-bg)" />
            <path d="M12 6v8l4-4-1.4-1.4L13 10.2V6z" fill="var(--accent)" />
        </svg>
    )),
    Profile: forwardRef<SVGSVGElement, SVGProps>(({ title = "Profile", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 24 24" {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <circle cx="12" cy="8" r="3.2" fill="var(--duo-bg)" />
            <path d="M4 20c1.8-4 6-6 8-6s6.2 2 8 6H4z" fill="var(--accent)" />
        </svg>
    )),
    Plus: forwardRef<SVGSVGElement, SVGProps>(({ title = "Add", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 36 36" {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <circle cx="18" cy="18" r="16" fill="var(--duo-bg)" />
            <g fill="var(--accent)">
                <rect x="16" y="10" width="4" height="16" rx="2" />
                <rect x="10" y="16" width="16" height="4" rx="2" />
            </g>
        </svg>
    )),
};

/* ---------------------------
   ROUNDED / GEOMETRIC ICONS
   (thicker strokes, rounded caps, iOS-ish)
   --------------------------- */
export const Rounded = {
    Home: forwardRef<SVGSVGElement, SVGProps>(({ title = "Home", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 26 26" {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <path d="M13 3L22 9v10.5a1.5 1.5 0 0 1-1.5 1.5H16v-6H10v6H5.5A1.5 1.5 0 0 1 4 19.5V9l9-6z" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    )),
    Tasks: forwardRef<SVGSVGElement, SVGProps>(({ title = "Tasks", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 26 26" {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <rect x="3.5" y="4" rx="3" width="19" height="6.5" stroke="currentColor" strokeWidth="1.9" fill="none" />
            <rect x="3.5" y="15" rx="3" width="19" height="6.5" stroke="currentColor" strokeWidth="1.9" fill="none" />
            <path d="M8 7.8l2 1.8 4-3.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    )),
    Events: forwardRef<SVGSVGElement, SVGProps>(({ title = "Events", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 26 26" {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <rect x="3.5" y="4" width="19" height="18" rx="4" stroke="currentColor" strokeWidth="1.9" fill="none" />
            <path d="M8 9h10" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
    )),
    Reports: forwardRef<SVGSVGElement, SVGProps>(({ title = "Reports", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 26 26" {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <rect x="3.5" y="3.5" rx="4" width="19" height="19" stroke="currentColor" strokeWidth="1.9" fill="none" />
            <path d="M8 8h10M8 12h8M8 16h6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
    )),
    Downloads: forwardRef<SVGSVGElement, SVGProps>(({ title = "Downloads", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 26 26" {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <rect x="3.5" y="17" rx="2" width="19" height="4.5" stroke="currentColor" strokeWidth="1.9" fill="none" />
            <path d="M13 8v8l4-4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    )),
    Profile: forwardRef<SVGSVGElement, SVGProps>(({ title = "Profile", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 26 26" {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <circle cx="13" cy="8" r="3.6" stroke="currentColor" strokeWidth="1.9" fill="none" />
            <path d="M5 20c1.6-3.6 5.2-5.6 8-5.6s6.4 2 8 5.6" stroke="currentColor" strokeWidth="1.9" fill="none" strokeLinecap="round" />
        </svg>
    )),
    Plus: forwardRef<SVGSVGElement, SVGProps>(({ title = "Add", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 36 36" {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <circle cx="18" cy="18" r="12" stroke="currentColor" strokeWidth="2.4" fill="none" />
            <path d="M18 11v14M11 18h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )),
};

/* ---------------------------
   MOTION-READY ANIMATED SVGS
   - small built-in transform/opacity animations
   - also CSS-friendly with classes:
       .icon-pulse { animation: pulse 1.6s infinite; }
       .icon-float { animation: float 3s infinite; }
   --------------------------- */

/* Minimal CSS you can include in your globals for motion:
@keyframes tg-pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.06); opacity: 0.92; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes tg-float {
  0% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
  100% { transform: translateY(0); }
}
.icon-pulse { animation: tg-pulse 1.6s ease-in-out infinite; transform-origin: center; }
.icon-float { animation: tg-float 3s ease-in-out infinite; transform-origin: center; }
*/

export const Motion = {
    Home: forwardRef<SVGSVGElement, SVGProps>(({ title = "Home", className = "", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 24 24" className={["icon-pulse", className].filter(Boolean).join(" ")} {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <path fill="var(--accent)" d="M12 3.2l8 6.2v9.1a1 1 0 0 1-1 1h-5v-5H10v5H5a1 1 0 0 1-1-1V9.4l8-6.2z" />
            <circle cx="12" cy="12" r="2.2" fill="rgba(255,255,255,0.06)">
                <animate attributeName="r" dur="2.4s" values="2.2;3.6;2.2" repeatCount="indefinite" />
                <animate attributeName="opacity" dur="2.4s" values="1;0.6;1" repeatCount="indefinite" />
            </circle>
        </svg>
    )),
    Tasks: forwardRef<SVGSVGElement, SVGProps>(({ title = "Tasks", className = "", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 24 24" className={["icon-float", className].filter(Boolean).join(" ")} {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <rect x="3" y="4" width="18" height="6" rx="2" fill="var(--accent)" />
            <rect x="3" y="14" width="18" height="6" rx="2" fill="var(--duo-bg)" />
            <g opacity="0.98" fill="white">
                <path d="M7.2 6.5l1.8 1.6 3.6-3.2" />
            </g>
            <g>
                <animateTransform attributeName="transform" dur="3.2s" type="translate" values="0 0;0 -2;0 0" repeatCount="indefinite" />
            </g>
        </svg>
    )),
    Events: forwardRef<SVGSVGElement, SVGProps>(({ title = "Events", className = "", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 24 24" className={["icon-pulse", className].filter(Boolean).join(" ")} {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <rect x="2.5" y="4" width="19" height="16" rx="3" fill="var(--duo-bg)" />
            <path d="M7 8h10" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="18" cy="7" r="1.6" fill="var(--accent-2)">
                <animate attributeName="r" dur="2s" values="1.6;2.8;1.6" repeatCount="indefinite" />
            </circle>
        </svg>
    )),
    Reports: forwardRef<SVGSVGElement, SVGProps>(({ title = "Reports", className = "", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 24 24" className={["icon-float", className].filter(Boolean).join(" ")} {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <rect x="3" y="3.5" width="18" height="17" rx="2.5" fill="var(--duo-bg)" />
            <g fill="var(--accent)">
                <rect x="6" y="7" width="12" height="2" rx="1" />
                <rect x="6" y="11" width="9" height="2" rx="1" />
            </g>
            <g transform="translate(0,0)">
                <animateTransform attributeName="transform" dur="4s" type="translate" values="0 0;0 -3;0 0" repeatCount="indefinite" />
            </g>
        </svg>
    )),
    Downloads: forwardRef<SVGSVGElement, SVGProps>(({ title = "Downloads", className = "", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 24 24" className={["icon-pulse", className].filter(Boolean).join(" ")} {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <rect x="3" y="16" width="18" height="4" rx="1.5" fill="var(--duo-bg)" />
            <path d="M12 6v8l4-4-1.4-1.4L13 10.2V6z" fill="var(--accent)" />
            <g>
                <animateTransform attributeName="transform" type="scale" values="1;1.04;1" dur="2.6s" repeatCount="indefinite" />
            </g>
        </svg>
    )),
    Profile: forwardRef<SVGSVGElement, SVGProps>(({ title = "Profile", className = "", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 24 24" className={["icon-float", className].filter(Boolean).join(" ")} {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <circle cx="12" cy="8" r="3.2" fill="var(--duo-bg)" />
            <path d="M4 20c1.8-4 6-6 8-6s6.2 2 8 6" fill="var(--accent)" />
            <g>
                <animateTransform attributeName="transform" type="translate" values="0 0;0 -1.8;0 0" dur="3.6s" repeatCount="indefinite" />
            </g>
        </svg>
    )),
    Plus: forwardRef<SVGSVGElement, SVGProps>(({ title = "Add", className = "", ...p }, ref) => (
        <svg ref={ref} viewBox="0 0 36 36" className={["icon-pulse", className].filter(Boolean).join(" ")} {...p} xmlns="http://www.w3.org/2000/svg">
            {title ? <title>{title}</title> : null}
            <defs>
                <radialGradient id="gPlus" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="var(--accent-2)" stopOpacity="0.5" />
                </radialGradient>
            </defs>
            <circle cx="18" cy="18" r="14" fill="url(#gPlus)" />
            <path d="M18 11v14M11 18h14" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            <g>
                <animateTransform attributeName="transform" type="scale" values="1;1.06;1" dur="1.6s" repeatCount="indefinite" />
            </g>
        </svg>
    )),
};

/* ---------------------------
   Utility: programmatic getter
   --------------------------- */
export type IconVariantName = "filled" | "duotone" | "rounded" | "motion";
export type IconKey = "Home" | "Tasks" | "Events" | "Reports" | "Downloads" | "Profile" | "Plus";

export function getVariantIcon(key: IconKey, variant: IconVariantName) {
    switch (variant) {
        case "filled": return (Filled as any)[key];
        case "duotone": return (Duotone as any)[key];
        case "rounded": return (Rounded as any)[key];
        case "motion": return (Motion as any)[key];
        default: return (Filled as any)[key];
    }
}
