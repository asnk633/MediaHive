// src/design-system/icons/raw.tsx
import React, { forwardRef } from "react";

export type SVGProps = React.SVGProps<SVGSVGElement> & { title?: string };

export const HomeIcon = forwardRef<SVGSVGElement, SVGProps>(({ title = "Home", ...p }, ref) => (
  <svg ref={ref} viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden={!p["aria-label"] && !title} role="img" {...p}>
    {title ? <title>{title}</title> : null}
    <path d="M3 10.5L12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-5H9v5H4a1 1 0 0 1-1-1V10.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
));

export const TasksIcon = forwardRef<SVGSVGElement, SVGProps>(({ title = "Tasks", ...p }, ref) => (
  <svg ref={ref} viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    {title ? <title>{title}</title> : null}
    <rect x="3" y="4" width="18" height="6" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <rect x="3" y="14" width="18" height="6" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M7 7h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 17h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
));

export const EventsIcon = forwardRef<SVGSVGElement, SVGProps>(({ title = "Events", ...p }, ref) => (
  <svg ref={ref} viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    {title ? <title>{title}</title> : null}
    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M16 3v4M8 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 12h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
));

export const ReportsIcon = forwardRef<SVGSVGElement, SVGProps>(({ title = "Reports", ...p }, ref) => (
  <svg ref={ref} viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    {title ? <title>{title}</title> : null}
    <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
));

export const DownloadsIcon = forwardRef<SVGSVGElement, SVGProps>(({ title = "Downloads", ...p }, ref) => (
  <svg ref={ref} viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    {title ? <title>{title}</title> : null}
    <path d="M12 3v12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M8 11l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="3" y="17" width="18" height="3" rx="1.5" stroke="currentColor" strokeWidth="1.6"/>
  </svg>
));

export const ProfileIcon = forwardRef<SVGSVGElement, SVGProps>(({ title = "Profile", ...p }, ref) => (
  <svg ref={ref} viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    {title ? <title>{title}</title> : null}
    <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M4 20c1.5-4 7-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
));

export const PlusIcon = forwardRef<SVGSVGElement, SVGProps>(({ title = "Add", ...p }, ref) => (
  <svg ref={ref} viewBox="0 0 24 24" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    {title ? <title>{title}</title> : null}
    <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.6" opacity="0.06" />
    <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
));