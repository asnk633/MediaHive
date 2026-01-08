'use client';
import React from 'react';
import ReportsDashboard from '@/components/reports/ReportsDashboard';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";

export default function ReportsPage() {
  return (
    <PageLayout mode="plain">
      <PageHeader
        title="Intelligence & Reporting"
        description="Real-time overview of system activity and resource status."
      />
      <ReportsDashboard />
    </PageLayout>
  );
}
