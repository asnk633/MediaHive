"use client";

import React, { useState } from 'react';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InstitutionsTab } from './InstitutionsTab';
import { DepartmentsTab } from './DepartmentsTab';

export default function StructurePage() {
    const [activeTab, setActiveTab] = useState("institutions");

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Organization Structure"
                description="Manage global institutions and departments."
            />

            <div className="mt-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-slate-900/50 border border-white/10 rounded-xl p-1">
                        <TabsTrigger value="institutions" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                            Institutions
                        </TabsTrigger>
                        <TabsTrigger value="departments" className="rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                            Departments
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
