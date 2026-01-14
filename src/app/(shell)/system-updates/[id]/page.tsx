"use client";

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { formatDistanceToNow, format } from 'date-fns';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User } from 'lucide-react';

interface SystemUpdate {
    id: string;
    title: string;
    body: string;
    severity: 'info' | 'important' | 'critical';
    createdAt: any;
    createdBy?: { name: string };
}

export default function SystemUpdateDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [update, setUpdate] = useState<SystemUpdate | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        const fetchUpdate = async () => {
            try {
                const data = await apiClient(`/api/system-updates/${id}`);
                setUpdate(data.update);
            } catch (e) {
                console.error("Failed to load update", e);
            } finally {
                setLoading(false);
            }
        };
        fetchUpdate();
    }, [id]);

    const getSeverityColor = (sev: string) => {
        switch (sev) {
            case 'critical': return 'text-red-400 border-red-500/50 bg-red-500/10';
            case 'important': return 'text-orange-400 border-orange-500/50 bg-orange-500/10';
            default: return 'text-blue-400 border-blue-500/50 bg-blue-500/10';
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
    if (!update) return <div className="p-8 text-center text-slate-500">Update not found.</div>;

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="text-slate-400 hover:text-white pl-0 gap-2">
                <ArrowLeft size={16} /> Back to Updates
            </Button>

            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSeverityColor(update.severity)}`}>
                        {update.severity.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar size={14} />
                        {update.createdAt ? format(new Date(update.createdAt), 'PPP p') : ''}
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-white leading-tight">
                    {update.title}
                </h1>

                <div className="flex items-center gap-2 text-sm text-slate-500 pb-6 border-b border-slate-800">
                    <User size={14} />
                    Posted by {update.createdBy?.name || 'System Admin'}
                </div>

                <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-slate-100">
                    <p className="whitespace-pre-wrap leading-relaxed text-lg">
                        {update.body}
                    </p>
                </div>
            </div>
        </div>
    );
}
