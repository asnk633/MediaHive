import React from 'react';
import { InventoryItem } from '@/types/inventory';
import { InventoryCard } from './InventoryCard';
import { FileQuestion } from 'lucide-react';

interface InventoryGridProps {
    items: InventoryItem[];
    loading?: boolean;
    role?: string;
    onRequest?: (item: InventoryItem) => void;
    onEdit?: (item: InventoryItem) => void;
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({
    items,
    loading,
    role,
    onRequest,
    onEdit
}) => {

    // Loading State
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-[320px] rounded-xl bg-slate-900/40 border border-white/5 animate-pulse" />
                ))}
            </div>
        );
    }

    // Empty State
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-[#ffffff1a] rounded-xl bg-slate-900/20">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <FileQuestion className="text-white/20" size={32} />
                </div>
                <h3 className="text-xl font-medium text-white/40 mb-2">No items found</h3>
                <p className="text-white/20 max-w-sm">
                    Try adjusting your filters or search terms.
                </p>
            </div>
        );
    }

    // Grid Layout
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-500">
            {items.map((item) => (
                <InventoryCard
                    key={item.id}
                    item={item}
                    role={role}
                    onRequest={onRequest}
                    onEdit={onEdit}
                />
            ))}
        </div>
    );
};
