import { Suspense } from 'react';
import CalendarMasterClient from './CalendarMasterClient';

export default function CalendarMasterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg-primary)]" />}>
            <CalendarMasterClient />
        </Suspense>
    );
}
