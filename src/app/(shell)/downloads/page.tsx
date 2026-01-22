import { Suspense } from 'react';
import DownloadsClient from './DownloadsClient';

export default function DownloadsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-card)]" />}>
      <DownloadsClient />
    </Suspense>
  );
}
