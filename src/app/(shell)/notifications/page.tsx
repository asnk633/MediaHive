"use client";

import React from "react";
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { NotificationInbox } from "@/components/notifications/NotificationInbox";

export default function NotificationsPage() {
  return (
    <PageLayout mode="plain">
      <PageHeader
        title="Notifications"
        description="Stay updated with your latest tasks, events, and system alerts."
      />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-20">
        <NotificationInbox />
      </div>
    </PageLayout>
  );
}