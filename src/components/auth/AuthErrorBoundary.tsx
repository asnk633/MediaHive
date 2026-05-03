'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, ShieldAlert, LogOut } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * AuthErrorBoundary captures crashes within the authentication context
 * and provides a controlled recovery UI instead of a blank screen.
 */
export class AuthErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[AuthErrorBoundary] Uncaught auth error:', error, errorInfo);
    }

    private handleReset = () => {
        // Clear potentially corrupt state and reload
        if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/login';
        }
    };

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                    <div className="relative mb-8">
                        <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <ShieldAlert className="text-red-500 w-12 h-12" />
                        </div>
                        <div className="absolute -top-1 -right-1">
                            <div className="relative">
                                <div className="absolute inset-0 animate-ping rounded-full bg-red-500/40 opacity-75"></div>
                                <AlertCircle className="relative text-red-500 w-6 h-6 fill-red-500/20" />
                            </div>
                        </div>
                    </div>

                    <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Authentication Error</h2>
                    <p className="text-slate-400 max-w-md mb-10 leading-relaxed font-medium">
                        A critical error occurred while initializing the authentication service. This prevents the application from loading securely.
                    </p>

                    <div className="flex flex-col w-full max-w-sm gap-4">
                        <Button
                            onClick={this.handleReload}
                            className="bg-blue-600 hover:bg-blue-500 text-white gap-3 h-14 text-lg font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                        >
                            <RefreshCw size={22} className={this.state.hasError ? "animate-spin-slow" : ""} />
                            Reload Application
                        </Button>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 w-full max-w-xs">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-600">
                            Resilience Subsystem Active
                        </p>
                    </div>

                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-8 p-4 bg-red-950/20 border border-red-900/30 rounded-md max-w-2xl text-left overflow-auto max-h-40">
                            <p className="text-red-400 font-mono text-xs whitespace-pre-wrap">
                                {this.state.error?.stack}
                            </p>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
