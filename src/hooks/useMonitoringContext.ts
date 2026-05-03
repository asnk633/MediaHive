'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MonitoringService } from '@/services/monitoringService';

interface MonitoringUser {
  id: string;
  email?: string;
  full_name?: string;
  role?: string;
  tenant_id?: string | number;
  institution_id?: string | number;
}

export function useMonitoringContext(user: MonitoringUser | null) {
  const pathname = usePathname();

  // Set or clear user context when auth state changes
  useEffect(() => {
    if (user?.id) {
      MonitoringService.setUserContext(user);
    } else {
      MonitoringService.clearUserContext();
    }
  }, [user?.id, user?.role, user?.tenant_id, user?.institution_id]);

  // Track page views as breadcrumbs (lightweight, no quota cost)
  useEffect(() => {
    MonitoringService.info('page.view', { path: pathname });
  }, [pathname]);
}
