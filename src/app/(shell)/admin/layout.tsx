"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContextProvider';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Only redirect if auth is explicitly resolved and user is NOT an admin
        if (!loading) {
            const isAdmin = user?.role === 'admin';
            
            console.log('[AdminLayout] Security Audit:', { 
                authorized: isAdmin,
                role: user?.role, 
                path: window.location.pathname 
            });
            
            if (!isAdmin) {
                // Wait a tiny bit to avoid flickers on refresh
                const timer = setTimeout(() => {
                    console.warn('[AdminLayout] Unauthorized access attempt. Redirecting...');
                    router.replace('/home');
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
                    <p className="text-sm font-medium text-white/40 animate-pulse">Verifying Credentials...</p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--bg)] px-6">
                <div className="max-w-md w-full glass-liquid p-8 rounded-[32px] border-white/5 text-center space-y-6">
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 mx-auto">
                        <ShieldAlert size={32} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white mb-2">Access Restricted</h1>
                        <p className="text-sm text-white/40 leading-relaxed">
                            You don't have the required administrative privileges to view this section. 
                            If you believe this is an error, please contact your system administrator.
                        </p>
                    </div>
                    <button 
                        onClick={() => router.push('/home')}
                        className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-white transition-all border border-white/5"
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
