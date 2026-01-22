import { Suspense } from 'react';
import TenantsClient from './TenantsClient';

export default function TenantsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading tenants...</div>}>
      <TenantsClient />
    </Suspense>
  );
}
