import React from 'react';
import { InventoryItem, InventoryIssue } from '@/types/inventory';
import { InventoryCard } from './InventoryCard';
import { FileQuestion } from 'lucide-react';

interface InventoryGridProps {
    items: InventoryItem[];
    activeIssues?: InventoryIssue[];
    pendingRequestItemIds?: Set<string>;
    loading?: boolean;
    role?: string;
    onRequest?: (item: InventoryItem) => void;
    onEdit?: (item: InventoryItem) => void;
    onReturn?: (item: InventoryItem) => void;
    onView?: (item: InventoryItem) => void;
}

export const InventoryGrid: React.FC<InventoryGridProps> = ({
    items,
    activeIssues = [],
    pendingRequestItemIds,
    loading,
    role,
    onRequest,
    onEdit,
    onReturn,
    onView
}) => {
    // Optimization: Create map for O(1) access
    const issueMap = React.useMemo(() => {
        const map = new Map<string, InventoryIssue>();
        activeIssues.forEach(issue => map.set(issue.itemId, issue));
        return map;
    }, [activeIssues]);

    // Loading State
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="rounded-xl bg-surface border border-soft p-4 space-y-4">
                        {/* Image Skeleton */}
                        <div className="w-full aspect-[4/5] rounded-lg bg-muted/10 animate-pulse" />

                        {/* Content Skeleton */}
                        <div className="space-y-2">
                            <div className="h-4 w-3/4 bg-muted/20 rounded animate-pulse" />
                            <div className="h-3 w-1/2 bg-muted/20 rounded animate-pulse" />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <div className="h-6 w-16 bg-muted/10 rounded animate-pulse" />
                            <div className="h-6 w-16 bg-muted/10 rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Empty State
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-glass backdrop-blur-sm shadow-sm">
                <div className="w-16 h-16 bg-surface/50 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <FileQuestion className="text-muted/50" size={32} />
                </div>
                <h3 className="text-xl font-bold text-foreground/70 mb-2">No items found</h3>
                <p className="text-muted max-w-sm text-sm">
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
                    activeIssue={issueMap.get(item.id)}
                    hasPendingRequest={pendingRequestItemIds?.has(item.id)}
                    role={role}
                    onRequest={onRequest}
                    onEdit={onEdit}
                    onReturn={onReturn}
                    onView={onView}
                />
            ))}
        </div>
    );
};
