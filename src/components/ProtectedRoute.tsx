'use client';
import { useAuth } from '@/contexts/AuthContextProvider';
import LoginClient from './auth/LoginClient';
import { AppLoader } from './ui/AppLoader';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                {/* No full screen loader here, just a silent space for content to arrive */}
            </div>
        );
    }

    if (!user) {
        if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            if (currentPath !== '/login' && currentPath !== '/login/') {
                console.log('[ProtectedRoute] Unauthenticated - redirecting to /login');
                window.location.href = '/login';
            }
        }
        return null;
    }

    return <>{children}</>;
}
