'use client';



import React, { useState } from 'react';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstitutionsTab } from './InstitutionsTab';
import { DepartmentsTab } from './DepartmentsTab';
import AppLink from '@/components/AppLink';
import { ChevronLeft } from 'lucide-react';

export default function StructurePage() {
    const [activeTab, setActiveTab] = useState("institutions");

    return (
        <PageLayout mode="plain">
            <div className="mb-2">
                <AppLink href="/settings" className="inline-flex items-center text-sm text-muted hover:text-foreground transition-colors">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Settings
                </AppLink>
            </div>

            <PageHeader
                title="Organization Structure"
                description="Manage global institutions and departments / institutions."
            />

            <div className="mt-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-surface border border-soft rounded-xl p-1">
                        <TabsTrigger value="institutions" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            Institutions
                        </TabsTrigger>
                        <TabsTrigger value="departments" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            Departments / Institutions
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                        <TabsContent value="institutions">
                            <InstitutionsTab />
                        </TabsContent>
                        <TabsContent value="departments">
                            <DepartmentsTab />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </PageLayout>
    );
}
