'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { RolePolicyEditor } from '@/components/admin/RolePolicyEditor';

export default function InstitutionRolePoliciesClient() {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const id = searchParams.get('id');
    const router = useRouter();

    if (!id) return <div className="p-8 text-foreground">Missing Institution ID</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="text-foreground/60 hover:text-foreground pl-0 gap-2">
                <ArrowLeft size={16} /> Back
            </Button>

            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-red-500/20 rounded-xl">
                    <ShieldAlert className="w-8 h-8 text-red-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Admin Role Policies</h1>
                    <p className="text-foreground/60">Configure escalation rules for Institution: {id}</p>
                </div>
            </div>

            <RolePolicyEditor
                scopeType="institution"
                scopeId={id}
            />
        </div>
    );
}
