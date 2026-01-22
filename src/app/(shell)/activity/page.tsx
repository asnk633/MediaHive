import { Suspense } from 'react';
import ActivityClient from './ActivityClient';

export default function ActivityPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--bg-card)]" />}>
            <ActivityClient />
        </Suspense>
    );
}
