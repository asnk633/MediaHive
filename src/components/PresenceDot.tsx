// src/components/PresenceDot.tsx
// Presence indicator dot component

'use client';

import React from 'react';
import { usePresence } from '@/hooks/usePresence';

interface PresenceDotProps {
  userId: string | number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function PresenceDot({ userId, size = 'sm' }: PresenceDotProps) {
  const isOnline = usePresence(userId);

  return (
    <div
      className={`presence-dot ${isOnline ? 'online' : 'offline'} presence-dot-${size}`}
      data-testid={`presence-dot-${userId}`}
    />
  );
}
