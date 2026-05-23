import { Suspense } from 'react';
import CreateEventClient from './CreateEventClient';

export default function NewEventPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-transparent text-foreground flex items-center justify-center">
                <div className="text-foreground/70 animate-pulse font-mono text-xs uppercase tracking-widest">Initialising Form...</div>
            </div>
        }>
            <CreateEventClient />
        </Suspense>
    );
}
