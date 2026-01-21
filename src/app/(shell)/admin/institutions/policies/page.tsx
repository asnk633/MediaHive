'use client';


import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2 } from 'lucide-react';
import { StructurePolicyEditor } from '@/components/admin/StructurePolicyEditor';

function InstitutionPoliciesContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const router = useRouter();

    if (!id) return <div className="p-8 text-white">Missing Institution ID</div>;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="text-slate-400 hover:text-white pl-0 gap-2">
                <ArrowLeft size={16} /> Back
            </Button>

            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Building2 className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Institution Policies</h1>
                    <p className="text-slate-400">Configure automation rules for Institution: {id}</p>
                </div>
            </div>

            <StructurePolicyEditor
                scopeType="institution"
                scopeId={id}
            />
        </div>
    );
}

export default function InstitutionPoliciesPage() {
    return (
        <Suspense fallback={<div className="p-8 text-white">Loading...</div>}>
            <InstitutionPoliciesContent />
        </Suspense>
    );
}
