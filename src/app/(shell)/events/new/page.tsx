import { Suspense } from 'react';
import CreateEventClient from './CreateEventClient';

export default function NewEventPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--bg-card)]" />}>
            <CreateEventClient />
        </Suspense>
    );
}
