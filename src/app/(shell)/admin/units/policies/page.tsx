export const dynamic = 'force-dynamic';

import nextDynamic from 'next/dynamic';

const AdminUnitPoliciesClient = nextDynamic(() => import('./AdminUnitPoliciesClient'), { ssr: false });

export default function UnitPoliciesPage() {
    return <AdminUnitPoliciesClient />;
}
