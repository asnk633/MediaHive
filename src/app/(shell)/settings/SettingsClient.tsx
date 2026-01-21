'use client';

import React from 'react';
import { PageLayout } from '@/components/ui/layout/PageLayout';
import { PageHeader } from '@/components/ui/layout/PageHeader';

export default function SettingsClient() {
    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Settings"
                description="Manage your application settings"
            />

            <div className="max-w-2xl">
                <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
                        Application Settings
                    </h3>
                    <p className="text-[var(--text-secondary)]">
                        Settings panel - configure your preferences
                    </p>
                </div>
            </div>
        </PageLayout>
    );
}
