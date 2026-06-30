"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export interface Breadcrumb {
  label: string;
  href: string;
}

export interface BreadcrumbGroup {
  routes: string[];
  crumbs: Breadcrumb[];
}

export const breadcrumbGroups: BreadcrumbGroup[] = [
  {
    routes: ["/", "/insights", "/notifications"],
    crumbs: [
      { label: "Overview", href: "/" },
      { label: "Insights", href: "/insights" },
      { label: "Notifications", href: "/notifications" }
    ]
  },
  {
    routes: ["/tasks"],
    crumbs: [
      { label: "My Tasks", href: "/tasks" },
      { label: "Board View", href: "/tasks?view=kanban" },
      { label: "Backlog", href: "/tasks?view=backlog" }
    ]
  },
  {
    routes: ["/calendar", "/events", "/campaigns"],
    crumbs: [
      { label: "Calendar", href: "/calendar" },
      { label: "Events", href: "/events" },
      { label: "Campaigns", href: "/campaigns" }
    ]
  },
  {
    routes: ["/inventory"],
    crumbs: [
      { label: "Inventory", href: "/inventory" }
    ]
  },
  {
    routes: ["/downloads"],
    crumbs: [
      { label: "Downloads", href: "/downloads" }
    ]
  },
  {
    routes: ["/chat"],
    crumbs: [
      { label: "Direct Messages", href: "/chat" },
      { label: "Channels", href: "/chat?tab=channels" }
    ]
  },
  {
    routes: ["/settings", "/activity", "/updates"],
    crumbs: [
      { label: "General", href: "/settings" },
      { label: "Activity", href: "/activity" },
      { label: "Updates", href: "/updates" }
    ]
  },
  {
    routes: ["/profile", "/leave"],
    crumbs: [
      { label: "Profile", href: "/profile" },
      { label: "Leave Management", href: "/leave" }
    ]
  },
  {
    routes: ["/labs"],
    crumbs: [
      { label: "Labs", href: "/labs" }
    ]
  },
  {
    routes: ["/support"],
    crumbs: [
      { label: "Support", href: "/support" }
    ]
  }
];

export function BreadcrumbTabs({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();

  // Find active group checking exact match or clean subsegment
  const activeGroup = breadcrumbGroups.find((group) =>
    group.routes.some(
      (route) => pathname === route || (route !== "/" && pathname.startsWith(route + "/"))
    )
  );

  const currentCrumbs = activeGroup ? activeGroup.crumbs : [];

  const isCrumbActive = (crumbHref: string) => {
    if (crumbHref.includes("?")) {
      const [path, queryStr] = crumbHref.split("?");
      if (pathname !== path) return false;
      
      const crumbParams = new URLSearchParams(queryStr);
      // Ensure all parameters in the crumb are present and match current search parameters
      for (const [key, val] of crumbParams.entries()) {
        if (searchParams.get(key) !== val) return false;
      }
      return true;
    }

    if (pathname === crumbHref) {
      if (pathname === "/tasks") return !searchParams.has("view");
      if (pathname === "/chat") return !searchParams.has("tab");
      return true;
    }

    return false;
  };

  if (currentCrumbs.length === 0) return null;

  return (
    <div 
      className="flex items-center gap-1 px-4 overflow-x-auto min-w-0 no-scrollbar" 
      role="tablist"
      aria-label="Sub navigation"
    >
      {currentCrumbs.map((crumb) => {
        const isActive = isCrumbActive(crumb.href);
        return (
          <Link
            key={crumb.label}
            href={crumb.href}
            role="tab"
            aria-selected={isActive}
            className={`px-3 py-1 rounded-full text-xs border transition-colors shrink-0 cursor-pointer ${
              isActive
                ? "active-tab-capsule"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
            }`}
          >
            {crumb.label}
          </Link>
        );
      })}
    </div>
  );
}
