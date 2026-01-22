import { Suspense } from 'react';
import CampaignViewClient from './CampaignViewClient';

export default function CampaignViewPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--bg-card)]" />}>
            <CampaignViewClient />
        </Suspense>
    );
}
