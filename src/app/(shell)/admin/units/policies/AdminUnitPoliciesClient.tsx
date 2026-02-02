'use client';

import React from 'react';
import dynamicImport from 'next/dynamic';

const UnitPoliciesContent = dynamicImport(() => import('./AdminUnitPoliciesContent'), { ssr: false });

export default function AdminUnitPoliciesClient() {
    return <UnitPoliciesContent />;
}
