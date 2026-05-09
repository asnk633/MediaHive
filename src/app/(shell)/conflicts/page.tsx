/**
 * Phase 8B: Conflict Resolution Center Page
 * 
 * Dedicated page route for the Conflict Resolution Center
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { ConflictResolutionCenter } from './ConflictResolutionCenter';
import { PageLayout } from '@/components/ui/layout/PageLayout';

export default function ConflictResolutionPage() {
  const { role, loading } = usePermissions() as any;
  const router = useRouter();

  useEffect(() => {
    if (!loading && role === 'member') {
      router.replace('/home');
    }
  }, [role, loading, router]);

  if (loading) return null;
  if (role === 'member') return null;

  return (
    <PageLayout>
      <ConflictResolutionCenter />
    </PageLayout>
  );
}
