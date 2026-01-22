import { Suspense } from 'react';
import InstitutionRolePoliciesClient from './InstitutionRolePoliciesClient';

export default function InstitutionRolePoliciesPage() {
    return (
        <Suspense fallback={<div className="p-8 text-white">Loading...</div>}>
            <InstitutionRolePoliciesClient />
        </Suspense>
    );
}
