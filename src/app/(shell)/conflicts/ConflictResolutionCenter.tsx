'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface ConflictResolutionCenterProps {
  onBack?: () => void;
}

export const ConflictResolutionCenter: React.FC<ConflictResolutionCenterProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <ShieldAlert size={48} className="text-foreground/80 mb-4" />
      <h2 className="text-xl font-bold text-foreground mb-2">Sync Engine Disabled</h2>
      <p className="text-foreground/80">The web application now uses direct online-first syncing. Conflict resolution is no longer applicable.</p>
    </div>
  );
};
