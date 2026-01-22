'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { RolePolicyEditor } from '@/components/admin/RolePolicyEditor';

export default function InstitutionRolePoliciesClient() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const router = useRouter();

    if (!id) return <div className="p-8 text-white">Missing Institution ID</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="text-slate-400 hover:text-white pl-0 gap-2">
                <ArrowLeft size={16} /> Back
            </Button>

            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-red-500/20 rounded-xl">
                    <ShieldAlert className="w-8 h-8 text-red-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Admin Role Policies</h1>
                    <p className="text-slate-400">Configure escalation rules for Institution: {id}</p>
                </div>
            </div>

            <RolePolicyEditor
                scopeType="institution"
                scopeId={id}
            />
        </div>
    );
}
