// lib/dashboard-data.ts
// Quoder target: replace mock data with real DB / API calls later.

export type UpcomingTask = {
  id: string;
  title: string;
  meta: string; // e.g. "2h left" or "Tomorrow"
};

export type DashboardEvent = {
  id: string;
  time: string; // display-ready time string
  title: string;
  location: string;
};

export type DashboardUpdate = {
  id: string;
  title: string;
  meta: string; // e.g. "2 min ago"
};

export type DashboardStats = {
  tasksToday: number;
  dueSoonLabel: string;
  eventsToday: number;
  eventsSubtitle: string;
  pendingApprovals: number;
  pendingSubtitle: string;
  newUpdates: number;
  updatesSubtitle: string;
};

export type HomeDashboardData = {
  userName: string;
  stats: DashboardStats;
  tasks: UpcomingTask[];
  events: DashboardEvent[];
  updates: DashboardUpdate[];
};

// TODO (Quoder): replace with real implementation.
// For now we just return a resolved Promise with mock data.
export async function getHomeDashboard(): Promise<HomeDashboardData> {
  return {
    userName: "Abdul",
    stats: {
      tasksToday: 12,
      dueSoonLabel: "5 due soon",
      eventsToday: 2,
      eventsSubtitle: "1 live, 1 planning",
      pendingApprovals: 3,
      pendingSubtitle: "Need director review",
      newUpdates: 3,
      updatesSubtitle: "Since you last checked",
    },
    tasks: [
      {
        id: "task-1",
        title: "Review monthly report",
        meta: "2h left",
      },
      {
        id: "task-2",
        title: "Update inventory list",
        meta: "5h left",
      },
    ],
    events: [
      {
        id: "event-1",
        time: "10:00 AM",
        title: "Team Meeting",
        location: "Conference Room A",
      },
      {
        id: "event-2",
        time: "02:00 PM",
        title: "Client Call",
        location: "Online",
      },
    ],
    updates: [
      {
        id: "update-1",
        title: "New comment on 'Project Alpha'",
        meta: "2 min ago",
      },
      {
        id: "update-2",
        title: "System maintenance scheduled for tonight.",
        meta: "Info",
      },
    ],
  };
}