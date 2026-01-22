import { Suspense } from 'react';
import UpdatesViewClient from './UpdatesViewClient';

export default function UpdatesViewPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--bg-card)]" />}>
            <UpdatesViewClient />
        </Suspense>
    );
}
