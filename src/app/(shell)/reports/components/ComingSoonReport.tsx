"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Construction, Clock } from 'lucide-react';
import { PageLayout } from '@/components/ui/layout/PageLayout';

interface ComingSoonReportProps {
    title: string;
    description: string;
}

export function ComingSoonReport({ title, description }: ComingSoonReportProps) {
    const router = useRouter();

    return (
        <PageLayout mode="plain" className="max-w-4xl mx-auto">
            <div className="flex flex-col gap-8 min-h-[60vh] justify-center items-center text-center">
                <div className="space-y-4 max-w-md">
                    <div className="flex justify-center mb-8">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors text-xs font-bold uppercase tracking-widest group"
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to reports
                        </button>
                    </div>

                    <div className="w-20 h-20 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-6 border border-foreground/10 shadow-2xl">
                        <Construction size={32} className="text-amber-500/60" />
                    </div>

                    <h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>
                    <p className="text-foreground/80 font-medium">{description}</p>

                    <div className="pt-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 border border-foreground/5 text-[10px] font-bold text-foreground/80 uppercase tracking-[0.2em]">
                            <Clock size={12} /> Optimization in progress
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
