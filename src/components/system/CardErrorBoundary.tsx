import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    children: ReactNode;
    className?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class CardErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('CardErrorBoundary caught an error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className={cn("p-4 border border-red-500/20 bg-red-500/5 rounded-xl flex flex-col items-center justify-center gap-3 text-center min-h-[120px]", this.props.className)}>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-400">
                        <AlertCircle size={16} />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-red-400">Component Error</h4>
                        <p className="text-[10px] text-foreground/50 max-w-[200px] truncate">
                            {this.state.error?.message || 'Something went wrong.'}
                        </p>
                    </div>
                    <button
                        onClick={this.handleReset}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-[10px] font-bold text-foreground/80 transition-colors"
                    >
                        <RefreshCw size={12} />
                        Reload
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
