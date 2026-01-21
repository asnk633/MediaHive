'use client';


import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Wait for auth to load
        if (loading) return;

        // Redirect if not authenticated or not admin
        if (!user || user.role !== 'admin') {
            console.warn('Unauthorized access attempt to admin route');
            router.push('/');
        }
    }, [user, loading, router]);

    // Show loading state while checking auth
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0c10] to-[#1a1f2e]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white/60">Verifying permissions...</p>
                </div>
            </div>
        );
    }

    // Don't render children if not admin
    if (!user || user.role !== 'admin') {
        return null;
    }

    return <>{children}</>;
}
