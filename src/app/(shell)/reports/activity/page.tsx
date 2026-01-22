import { Suspense } from 'react';
import ReportsActivityClient from './ReportsActivityClient';

export default function ReportsActivityPage() {
    return (
        <Suspense fallback={null}>
            <ReportsActivityClient />
        </Suspense>
    );
}
