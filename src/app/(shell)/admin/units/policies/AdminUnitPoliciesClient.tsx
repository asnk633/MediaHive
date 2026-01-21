'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

const UnitPoliciesContent = dynamic(() => import('./AdminUnitPoliciesContent'), { ssr: false });

export default function AdminUnitPoliciesClient() {
    return (
        <Suspense fallback={<div className="p-8 text-white">Loading...</div>}>
            <UnitPoliciesContent />
        </Suspense>
    );
}
