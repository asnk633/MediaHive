// src/components/SSEStatusBadge.tsx
// SSE Status Badge component

'use client';

import React from 'react';

interface SSEStatusBadgeProps {
  connected: boolean;
}

export function SSEStatusBadge({ connected }: SSEStatusBadgeProps) {
  return (
    <div className="sse-status-badge" data-testid="sse-status-badge">
      <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></span>
      <span className="status-text">
        {connected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}