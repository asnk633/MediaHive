'use client';

import React, { useState } from 'react';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { ProfileSettingsView } from '@/components/settings/views/ProfileSettingsView';
import { NotificationSettingsView } from '@/components/settings/views/NotificationSettingsView';
import { ShieldAlert, Building2 } from 'lucide-react';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'notifications'>('profile');

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Settings"
                description="Manage your account."
            />
            <SettingsLayout activeTab={activeTab} onTabChange={setActiveTab}>

                {activeTab === 'profile' && <ProfileSettingsView />}
                {activeTab === 'notifications' && <NotificationSettingsView />}



            </SettingsLayout>
        </PageLayout>
    );
}