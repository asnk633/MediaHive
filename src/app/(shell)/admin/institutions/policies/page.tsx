import { Suspense } from 'react';
import InstitutionPoliciesClient from './InstitutionPoliciesClient';

export default function InstitutionPoliciesPage() {
    return (
        <Suspense fallback={<div className="p-8 text-white">Loading...</div>}>
            <InstitutionPoliciesClient />
        </Suspense>
    );
}
