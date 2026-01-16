'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import ReportsDashboard from '@/components/reports/ReportsDashboard';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { AppLoader } from '@/components/ui/AppLoader';

export default function ReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role === 'guest') {
      router.replace('/profile');
    }
  }, [user, loading, router]);

  if (loading || user?.role === 'guest') {
    return <div className="flex h-full items-center justify-center"><AppLoader /></div>;
  }

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
