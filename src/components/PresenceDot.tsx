// src/components/PresenceDot.tsx
// Presence indicator dot component

'use client';

import React from 'react';
import { usePresence } from '@/hooks/usePresence';

interface PresenceDotProps {
  userId: number;
}

export function PresenceDot({ userId }: PresenceDotProps) {
  const isOnline = usePresence(userId);
  
  return (
    <div 
      className={`presence-dot ${isOnline ? 'online' : 'offline'}`}
      data-testid={`presence-dot-${userId}`}
    />
  );
}