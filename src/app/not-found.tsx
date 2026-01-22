import { Suspense } from 'react';
import NotFoundClient from './NotFoundClient';

export default function NotFoundPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--bg-card)]" />}>
            <NotFoundClient />
        </Suspense>
    );
}
