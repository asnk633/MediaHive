'use client';



import React, { useEffect, useState } from 'react';

export default function MOCK_KEYDebugPage() {
    const [debugState, setDebugState] = useState<any>(null);

    useEffect(() => {
        // Poll for changes
        const interval = setInterval(() => {
            setDebugState({
                ready: (window as any).__MOCK_KEY_READY__ || false,
                debug: (window as any).__MOCK_KEY_INIT_DEBUG__ || null,
                fallback: (window as any).__MOCK_KEY_PERSISTENCE_FALLBACK__ || false,
                initError: (window as any).__MOCK_KEY_INIT_ERROR__ || null,
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    if (!debugState) return <div>Loading debug info...</div>;

    return (
        <div style={{ padding: 24, color: '#fff', background: '#111', minHeight: '100vh', fontFamily: 'monospace' }}>
            <h2 className="text-xl font-bold mb-4">MOCK_KEY Runtime Debug</h2>

            <div className="mb-4">
                <strong>Status: </strong>
                <span style={{ color: debugState.ready ? '#4ade80' : '#ef4444' }}>
                    {debugState.ready ? 'READY' : 'NOT READY'}
                </span>
            </div>

            <div className="bg-gray-800 p-4 rounded overflow-auto mb-4">
                <pre>{JSON.stringify(debugState, null, 2)}</pre>
            </div>

            <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 transition"
            >
                Reload Page
            </button>
        </div>
    );
}
