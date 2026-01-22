import { Suspense } from 'react';
import SystemUpdateViewClient from './SystemUpdateViewClient';

export default function SystemUpdateViewPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--bg-card)]" />}>
            <SystemUpdateViewClient />
        </Suspense>
    );
}
