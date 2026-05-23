'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export default class AppErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[AppErrorBoundary] Caught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                        <AlertTriangle className="text-red-500 w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
                    <p className="text-slate-400 max-w-sm text-sm">
                        The application encountered an unexpected error while rendering this view.
                    </p>
                    <Button
                        onClick={() => window.location.reload()}
                        className="mt-4 gap-2 bg-slate-800 hover:bg-slate-700 text-foreground"
                    >
                        <RefreshCw size={16} /> Reload Page
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
