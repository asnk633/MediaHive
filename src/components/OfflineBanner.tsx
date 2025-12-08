'use client';

import React, { useState, useEffect } from 'react';
import { isOnline, addNetworkListener } from '@/lib/network';

export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(isOnline());
    return addNetworkListener(setOnline);
  }, []);

  if (online) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium shadow-md">
      You appear offline — some features may be limited
    </div>
  );
}