'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Layers } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import dynamic from 'next/dynamic';

const StructurePolicyEditor = dynamic(() => import('@/components/admin/StructurePolicyEditor').then(mod => mod.StructurePolicyEditor), { ssr: false });

export default function UnitPoliciesContent() {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const id = searchParams.get('id');
    const router = useRouter();
    const [institution_id, setInstitutionId] = useState<string | undefined>(undefined);

    // Fetch Dept Info to get Parent Institution
    useEffect(() => {
        if (!id) return;
        const fetchDept = async () => {
            try {
                // Assuming we can fetch generic structure or just use a helper API.
                // For now, if API missing, we might fail to show inheritance correctly (will show Global as parent if Inst not found).
                // Let's try fetching via a generic endpoint if available, or just skip if we assume admin knows context.
                // But Editor needs it for "Inherited (Institution)" resolution.
                // We'll try to find it.
                // TODO: Implement proper dept fetching.
                console.log("Fetching parent info for unit", id);
            } catch (e) {
                console.error(e);
            }
        };
        fetchDept();
    }, [id]);

    if (!id) return <div className="p-8 text-white">Missing Unit ID</div>;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="text-slate-400 hover:text-white pl-0 gap-2">
                <ArrowLeft size={16} /> Back
            </Button>

            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-indigo-500/20 rounded-xl">
                    <Layers className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Office/Unit Policies</h1>
                    <p className="text-slate-400">Configure automation rules for Unit: {id}</p>
                </div>
            </div>

            <StructurePolicyEditor
                scopeType="unit"
                scopeId={id}
                parentScopeId={institution_id}
            />
        </div>
    );
}
