import { Suspense } from 'react';
import InventoryRequestsClient from './InventoryRequestsClient';

export default function MyRequestsPage() {
    return (
        <Suspense fallback={null}>
            <InventoryRequestsClient />
        </Suspense>
    );
}
