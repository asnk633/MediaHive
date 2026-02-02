'use client';

import React from "react";
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { SmartActivityFeed } from "@/components/activity/SmartActivityFeed";

export default function ActivityClient() {
    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Activity Feed"
                description="A chronological timeline of what has happened in the workspace."
            />

            <div>
                <SmartActivityFeed />
            </div>
        </PageLayout>
    );
}
