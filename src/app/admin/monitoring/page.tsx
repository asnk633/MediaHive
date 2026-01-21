'use client';

export const dynamic = 'force-static';


import { MonitoringDashboard } from '@/components/MonitoringDashboard';

export default function MonitoringPage() {
  return (
    <div className="admin-monitoring-page">
      <MonitoringDashboard />
    </div>
  );
}
