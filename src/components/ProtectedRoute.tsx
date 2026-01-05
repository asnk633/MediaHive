'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { TextCycleLoader } from './ui/TextCycleLoader';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user) {
            // Store the attempted path to redirect after login
            sessionStorage.setItem('redirectAfterLogin', pathname);
            router.push('/login');
        }
    }, [user, loading, router, pathname]);

    // Show loading state while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-app)]">
                <TextCycleLoader />
            </div>
        );
    }

    // If not logged in, show nothing (will redirect)
    if (!user) {
        return null;
    }

    // User is authenticated, show the protected content
    return <>{children}</>;
}
