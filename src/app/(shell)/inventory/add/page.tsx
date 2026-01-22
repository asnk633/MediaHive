import { Suspense } from 'react';
import InventoryAddClient from './InventoryAddClient';

export default function AddInventoryPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--bg-card)]" />}>
            <InventoryAddClient />
        </Suspense>
    );
}
