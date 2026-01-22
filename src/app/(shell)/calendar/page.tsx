import { Suspense } from 'react';
import CalendarClient from './CalendarClient';

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-card)]" />}>
      <CalendarClient />
    </Suspense>
  );
}
