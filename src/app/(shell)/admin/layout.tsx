"use client";
import { nativeNavigate } from '@/lib/utils';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContextProvider';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { ShieldAlert } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Only redirect if auth is explicitly resolved and user is NOT an authorized role
        if (!loading) {
            const isAuthorized = ['admin', 'manager'].includes(user?.role || '');
            
            console.log('[AdminLayout] Security Audit:', { 
                authorized: isAuthorized,
                role: user?.role, 
                path: window.location.pathname 
            });
            
            if (!isAuthorized) {
                // Wait a tiny bit to avoid flickers on refresh
                const timer = setTimeout(() => {
                    console.warn('[AdminLayout] Unauthorized access attempt. Redirecting...');
                    nativeNavigate('/home', router, 'layout.tsx');
                }, 1500);
                return () => clearTimeout(timer);
            }
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--bg)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-sm font-medium text-foreground/80 animate-pulse">Verifying Credentials...</p>
                </div>
            </div>
        );
    }

    if (!user || !['admin', 'manager'].includes(user.role)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--bg)] px-6">
                <div className="max-w-md w-full glass-liquid p-8 rounded-[32px] border-foreground/5 text-center space-y-6">
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 mx-auto">
                        <ShieldAlert size={32} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground mb-2">Access Restricted</h1>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                            You don't have the required privileges to view this section. 
                            If you believe this is an error, please contact your system administrator.
                        </p>
                    </div>
                    <button 
                        onClick={() => nativeNavigate('/home', router, 'layout.tsx')}
                        className="w-full py-3 px-4 bg-foreground/5 hover:bg-foreground/10 rounded-xl text-sm font-bold text-foreground transition-all border border-foreground/5"
                    >
                        Return to Safety
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-context-wrapper">
            {/* Global Admin Sidebar - Only visible in this layout */}
            <AdminSidebar />
            
            <style jsx global>{`
                /* Adjust main padding for admin sidebar */
                main#main-scroll-container {
                    padding-left: var(--admin-sidebar-width, 240px) !important;
                }
                
                @media (max-width: 1024px) {
                    main#main-scroll-container {
                        padding-left: 0 !important;
                    }
                }
            `}</style>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {children}
            </div>
        </div>
    );
}
