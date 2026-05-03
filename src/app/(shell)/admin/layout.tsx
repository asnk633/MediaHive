"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContextProvider';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            console.warn('[AdminLayout] Security Breach: Non-admin attempted access.');
            router.replace('/home');
        }
    }, [user, loading, router]);

    if (loading) return null;
    if (!user || user.role !== 'admin') return null;

    return (
        <div className="admin-context-wrapper">
            {/* Global Admin Sidebar - Only visible in this layout */}
            <AdminSidebar />
            
            <style jsx global>{`
                /* Hide main sidebar when in admin context */
                aside.lg\\:flex:not(.fixed.left-6) {
                    display: none !important;
                }
                
                /* Adjust main padding for admin sidebar */
                main#main-scroll-container {
                    padding-left: 240px !important;
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
