// src/app/(shell)/notifications/page.tsx
// Notifications Page with lazy loading

"use client";

import React, { Suspense, useEffect, useState } from 'react';

// Lazy load the NotificationPanel component for bundle splitting
const NotificationPanel = React.lazy(() => 
  import('@/components/NotificationPanel').then(module => ({ default: module.NotificationPanel }))
);

export default function NotificationsPage() {
  return (
    <div className="notifications-page">
      <h1>Notifications</h1>
      <Suspense fallback={<div>Loading notifications...</div>}>
        <NotificationPanel />
      </Suspense>
    </div>
  );
}