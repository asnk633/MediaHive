'use client';
import React from 'react';
import ReportsDashboard from '@/components/reports/ReportsDashboard';

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Intelligence & Reporting</h1>
        <p className="text-slate-400">Real-time overview of system activity and resource status.</p>
      </div>
      <ReportsDashboard />
    </div>
  );
}
