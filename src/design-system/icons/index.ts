// src/design-system/icons/index.ts
export { HomeIcon, TasksIcon, EventsIcon, ReportsIcon, DownloadsIcon, ProfileIcon, PlusIcon } from "./raw";

export type IconName = "home" | "tasks" | "events" | "reports" | "downloads" | "profile" | "plus";

import * as Raw from "./raw";

export const ICONS: Record<IconName, typeof Raw.HomeIcon> = {
  home: Raw.HomeIcon,
  tasks: Raw.TasksIcon,
  events: Raw.EventsIcon,
  reports: Raw.ReportsIcon,
  downloads: Raw.DownloadsIcon,
  profile: Raw.ProfileIcon,
  plus: Raw.PlusIcon,
};