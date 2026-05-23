import { Suspense } from 'react';
import EditEventClient from './EditEventClient';

export default function EditEventPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-transparent text-foreground flex items-center justify-center">
                <div className="text-foreground/70 animate-pulse font-mono text-xs uppercase tracking-widest">Loading Editor...</div>
            </div>
        }>
            <EditEventClient />
        </Suspense>
    );
}
