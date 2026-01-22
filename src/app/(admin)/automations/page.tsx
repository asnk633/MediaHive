import { Suspense } from 'react';
import AutomationsClient from './AutomationsClient';

export default function AutomationsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading automation rules...</div>}>
      <AutomationsClient />
    </Suspense>
  );
}
