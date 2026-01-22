import { Suspense } from 'react';
import ClientBoundary from './ClientBoundary';

export default function NotificationsNewPage() {
    return (
        <Suspense fallback={null}>
            <ClientBoundary />
        </Suspense>
    );
}
