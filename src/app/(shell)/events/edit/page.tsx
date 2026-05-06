import { Suspense } from 'react';
import EditEventClient from './EditEventClient';

export default function EditEventPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-night-sky text-white flex items-center justify-center">
                <div className="text-white/30 animate-pulse font-mono text-xs uppercase tracking-widest">Initialising Edit Form...</div>
            </div>
        }>
            <EditEventClient />
        </Suspense>
    );
}
