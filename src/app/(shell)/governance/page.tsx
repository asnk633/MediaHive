'use client';

import { GovernanceDashboard } from '@/components/governance/GovernanceDashboard';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function GovernancePage() {
    const { user, authStatus } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (authStatus === 'unauthenticated' || (user && user.role === 'member')) {
            router.push('/');
        }
    }, [user, authStatus, router]);

    if (!user || user.role === 'member') return null;

    return <GovernanceDashboard />;
}
