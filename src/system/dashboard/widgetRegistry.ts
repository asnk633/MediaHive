import { TaskIntelligenceWidget } from "@/features/dashboard/components/TaskIntelligenceWidget";
import { MyFocusWidget } from "@/features/dashboard/components/MyFocusWidget";
import { AdminOversightWidget } from "@/features/dashboard/components/AdminOversightWidget";
import { MediaTeamOverview } from "@/features/dashboard/components/MediaTeamOverview";
import { ActiveCampaignsWidget } from "@/features/dashboard/components/ActiveCampaignsWidget";
import { EventsNext7DaysWidget } from "@/features/dashboard/components/EventsNext7DaysWidget";
import { TimelineWidget } from "@/features/dashboard/components/TimelineWidget";
import { OverdueTasksWidget } from "@/features/dashboard/components/OverdueTasksWidget";
import { DashboardWidget } from "./types";

/**
 * Central Registry for MediaHive Dashboard Widgets.
 * Add new widgets here to have them automatically appear for the correct roles.
 */
export const widgetRegistry: DashboardWidget[] = [
    {
        id: "task-intelligence",
        name: "Task Intelligence",
        component: TaskIntelligenceWidget,
        roles: ["admin", "team", "guest"],
        section: "intelligence",
        priority: 10
    },
    {
        id: "my-focus",
        name: "My Focus",
        component: MyFocusWidget,
        roles: ["admin", "team"],
        section: "focus",
        priority: 20
    },
    {
        id: "admin-oversight",
        name: "Admin Oversight",
        component: AdminOversightWidget,
        roles: ["admin"],
        section: "oversight",
        priority: 30
    },
    {
        id: "media-team-overview",
        name: "Media Team Overview",
        component: MediaTeamOverview,
        roles: ["admin", "team", "guest"],
        section: "strategic",
        priority: 40
    },
    {
        id: "active-campaigns",
        name: "Active Campaigns",
        component: ActiveCampaignsWidget,
        roles: ["admin", "team"],
        section: "strategic",
        priority: 50
    },
    {
        id: "next-7-days-events",
        name: "Upcoming Events",
        component: EventsNext7DaysWidget,
        roles: ["admin", "team", "guest"],
        section: "strategic",
        priority: 60
    },
    {
        id: "timeline",
        name: "Timeline",
        component: TimelineWidget,
        roles: ["admin", "team"],
        section: "timeline",
        priority: 70
    }
];

/**
 * Filters the registry based on user role and target section.
 */
export function getWidgetsForSection(section: string, userRole: string = 'guest') {
    return widgetRegistry
        .filter(widget => widget.section === section && widget.roles.includes(userRole))
        .sort((a, b) => (a.priority || 0) - (b.priority || 0));
}
