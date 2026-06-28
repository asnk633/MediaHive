'use client';
import React from 'react';

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() { return { hasError: true }; }

  componentDidCatch(error: any, info: any) {
    console.error('[ErrorBoundary] Caught error:', error, info);
    import('@/lib/logger').then(m => m.logger.log({ type: "ErrorBoundary caught error", level: 'error', metadata: { error, info } })).catch(() => {});
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="p-6 flex flex-col items-center justify-center min-h-[200px] text-center gap-4">
          <h2 className="text-lg font-bold text-foreground/80">Something went wrong</h2>
          <p className="text-sm text-foreground/70 font-medium max-w-md">We&apos;re looking into it. Try refreshing the page.</p>
          <button
            onClick={() => location.reload()}
            className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl px-4 py-2 font-bold transition-all active:scale-95 text-sm"
          >
            Reload
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
