'use client';
import React from 'react';

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() { return { hasError: true }; }

  componentDidCatch(error: any, info: any) {
    import('@/lib/logger').then(m => m.logger.error("ErrorBoundary caught error", { error, info }));
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="p-6">
          <h2>Something went wrong</h2>
          <p>We're looking into it. Try refreshing the page.</p>
          <button onClick={() => location.reload()} className="btn">Reload</button>
        </main>
      );
    }
    return this.props.children;
  }
}