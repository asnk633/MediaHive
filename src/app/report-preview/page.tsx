import { Suspense } from 'react';
import ReportPreviewClient from './ReportPreviewClient';

export default function ReportPreviewPage() {
    return (
        <Suspense fallback={<div>Loading Report...</div>}>
            <ReportPreviewClient />
        </Suspense>
    );
}
