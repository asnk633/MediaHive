import { Suspense } from 'react';
import CreateEventClient from './CreateEventClient';

export default function NewEventPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-night-sky text-white flex items-center justify-center">
                <div className="text-white/30 animate-pulse font-mono text-xs uppercase tracking-widest">Initialising Form...</div>
            </div>
        }>
            <CreateEventClient />
        </Suspense>
    );
}
