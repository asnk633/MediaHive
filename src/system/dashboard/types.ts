import React from 'react';

/**
 * Dashboard Widget Sections define where a widget is rendered in the layout.
 */
export type WidgetSection =
    | 'intelligence' // Top summary stats
    | 'focus'        // Primary task list / focus area
    | 'strategic'    // Team overview and campaigns
    | 'oversight'    // Admin specific controls
    | 'timeline';    // Activity timeline

export interface DashboardWidget {
    id: string;
    name: string;
    component: React.ComponentType<any>;
    roles: string[]; // Roles that can see this widget: e.g. ['admin', 'team']
    section: WidgetSection;
    featureFlag?: string; // Optional feature flag check
    priority?: number;    // Ordering within the same section
}
