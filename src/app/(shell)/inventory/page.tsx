import InventoryView from '@/components/inventory/InventoryView';
import { PageLayout } from '@/components/ui/layout/PageLayout';

export default function InventoryPage() {
    return (
        <PageLayout mode="plain">
            <InventoryView />
        </PageLayout>
    );
}
