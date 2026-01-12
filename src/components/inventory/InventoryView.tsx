"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { InventoryGrid } from './InventoryGrid';
import { InventoryDetailDialog } from './InventoryDetailDialog';
import { InventoryFilters, SortOption } from './InventoryFilters';
import { InventoryItem, InventoryApiResponse, INVENTORY_CATEGORIES, INVENTORY_GUIDE, InventoryIssue } from '@/types/inventory';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus, Clock, ChevronDown, ChevronUp, Info, FileDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { InventoryRequestDialog } from './InventoryRequestDialog';
import { IssueItemDialog } from './IssueItemDialog';
import { ReturnItemDialog } from './ReturnItemDialog';
import { inventoryIssueService } from '@/services/inventoryIssueService';
import { inventoryRequestService } from '@/services/inventoryRequestService';

export default function InventoryView() {
    const { user } = useAuth();
    const router = useRouter();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIssues, setActiveIssues] = useState<InventoryIssue[]>([]);
    const [myRequests, setMyRequests] = useState<Set<string>>(new Set()); // Set of Item IDs

    // Dialog States
    const [requestDialogItem, setRequestDialogItem] = useState<InventoryItem | null>(null);
    const [issueDialogItem, setIssueDialogItem] = useState<InventoryItem | null>(null);
    const [returnDialogIssue, setReturnDialogIssue] = useState<InventoryIssue | null>(null);
    const [viewItem, setViewItem] = useState<InventoryItem | null>(null);

    // Filter State
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>('name_asc');

    // Guide State
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    // Imports
    // We need inventoryRequestService here. It was not imported in the original file I see?
    // Let me check imports. It was NOT imported in InventoryView.tsx. I need to add import too.
    // Wait, I can't see the top of the file in this tool call.
    // I will use multi_replace to add import and update fetch logic.

    const fetchData = async () => {
        setLoading(true);
        try {
            const promises: Promise<any>[] = [
                apiClient<InventoryApiResponse>(`/api/inventory?limit=300`),
            ];

            // Issues (Only fetch if scoped)
            if (user?.institutionId) {
                console.log('[InventoryView] Fetching issues for institution:', user.institutionId);
                promises.push(inventoryIssueService.getActiveIssues(user.institutionId));
            } else {
                console.warn('[InventoryView] User has no institutionId. Skipping issues fetch.');
                promises.push(Promise.resolve([]));
            }

            // If Guest, fetch my requests to disable buttons
            if (user && user.role !== 'admin' && user.role !== 'team') {
                promises.push(inventoryRequestService.getMyRequests(user.uid));
            }

            const results = await Promise.all(promises);
            const invData = results[0];
            const issuesData = results[1];
            const myRequestsData = results[2] || [];

            setItems(invData.items || []);
            setActiveIssues(issuesData);

            if (myRequestsData.length > 0) {
                // Filter for pending/approved only? Or all? User said "already requested".
                // Usually pending or approved. rejected means they can request again?
                const activeReqs = myRequestsData.filter((r: any) => r.status === 'pending' || r.status === 'approved');
                setMyRequests(new Set(activeReqs.map((r: any) => r.itemId)));
            } else {
                setMyRequests(new Set());
            }

        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    // Derived State
    const processedItems = useMemo(() => {
        // Create a map of In-Use Item IDs
        const issuedItemIds = new Set(activeIssues.map(i => i.itemId));

        // Derive Status
        const itemsWithDerivedStatus = items.map(item => {
            if (issuedItemIds.has(item.id)) {
                return { ...item, status: 'in_use' };
            }
            return item;
        });

        let result = itemsWithDerivedStatus.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                item.category.toLowerCase().includes(search.toLowerCase()) ||
                (item.serialNumber && item.serialNumber.toLowerCase().includes(search.toLowerCase()));
            const matchesCategory = category ? item.category === category : true;
            return matchesSearch && matchesCategory;
        });

        // Sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case 'name_asc': return a.name.localeCompare(b.name);
                case 'name_desc': return b.name.localeCompare(a.name);
                case 'category': return a.category.localeCompare(b.category);
                case 'status': return (a.status || '').localeCompare(b.status || '');
                case 'date_newest':
                    return new Date(b.purchaseDate || 0).getTime() - new Date(a.purchaseDate || 0).getTime();
                case 'date_oldest':
                    return new Date(a.purchaseDate || 0).getTime() - new Date(b.purchaseDate || 0).getTime();
                case 'qty_low_high': return a.quantity - b.quantity;
                case 'qty_high_low': return b.quantity - a.quantity;
                default: return 0;
            }
        });

        return result;
    }, [items, activeIssues, search, category, sortBy]);

    const handleRequest = (item: InventoryItem) => {
        if (user?.role === 'admin' || user?.role === 'team') {
            // Admin/Team -> Issue directly (Shortcut)
            setIssueDialogItem(item);
        } else {
            // Guest -> Request
            setRequestDialogItem(item);
        }
    };

    const handleReturn = (item: InventoryItem) => {
        // Find active issue for this item
        const issue = activeIssues.find(i => i.itemId === item.id);
        if (issue) {
            setReturnDialogIssue(issue);
        } else {
            toast.error("Issue record not found for this item.");
            fetchData(); // Sync up
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Inventory"
                description="Manage and request studio assets."
                actions={
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/inventory/requests')}
                            className="text-slate-300 hover:text-white hover:bg-white/10"
                        >
                            <Clock className="w-4 h-4 mr-2" />
                            {user?.role === 'admin' ? 'Requests' : 'My Requests'}
                        </Button>

                        {user?.role === 'admin' && (
                            <>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        const exportData = items.map(item => ({
                                            Name: item.name,
                                            Category: item.category,
                                            Status: item.status,
                                            Condition: item.condition,
                                            Quantity: item.quantity,
                                            Location: item.locationStr || '',
                                            Serial: item.serialNumber || '',
                                            Notes: item.notes || '',
                                            LastUpdated: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : ''
                                        }));
                                        import('@/utils/export').then(mod => mod.downloadCSV(exportData, `inventory_${new Date().toISOString().split('T')[0]}.csv`));
                                    }}
                                    className="text-slate-300 hover:text-white hover:bg-white/10 hidden sm:flex"
                                >
                                    <FileDown className="w-4 h-4 mr-2" />
                                    Export
                                </Button>
                                <Button
                                    onClick={() => router.push('/inventory/add')}
                                    className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
                                >
                                    <Plus size={18} className="mr-2" /> Add Asset
                                </Button>
                            </>
                        )}
                    </div>
                }
            />

            {/* Categorization Guide */}
            <Collapsible open={isGuideOpen} onOpenChange={setIsGuideOpen} className="border border-white/5 bg-slate-900/30 rounded-xl overflow-hidden">
                <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-400" />
                        Media Inventory Categorization Guide
                    </div>
                    {isGuideOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="px-4 pb-4 pt-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs text-slate-400 border-t border-white/5 bg-black/20">
                        {Object.entries(INVENTORY_GUIDE).map(([cat, desc]) => (
                            <div key={cat} className="py-1">
                                <span className="text-slate-200 font-semibold">{cat}:</span> <span className="text-slate-500">{desc}</span>
                            </div>
                        ))}
                    </div>
                </CollapsibleContent>
            </Collapsible>

            {/* Filters Toolbar */}
            <InventoryFilters
                search={search}
                onSearchChange={setSearch}
                category={category}
                onCategoryChange={setCategory}
                sortBy={sortBy}
                onSortChange={setSortBy}
                categories={Object.values(INVENTORY_CATEGORIES)}
            />

            {/* Grid */}
            <InventoryGrid
                items={processedItems}
                loading={loading}
                activeIssues={activeIssues}
                pendingRequestItemIds={myRequests}
                role={user?.role}
                onRequest={handleRequest}
                onReturn={handleReturn}
                onEdit={user?.role === 'admin' ? (item) => {
                    router.push(`/inventory/edit/${item.id}`);
                } : undefined}
                onView={setViewItem}
            />

            {/* Dialogs */}
            <InventoryDetailDialog
                item={viewItem}
                open={!!viewItem}
                onOpenChange={(open) => !open && setViewItem(null)}
                role={user?.role}
                onEdit={user?.role === 'admin' ? (item) => {
                    setViewItem(null); // Close view
                    router.push(`/inventory/edit/${item.id}`);
                } : undefined}
                onRequest={(item) => {
                    setViewItem(null);
                    handleRequest(item);
                }}
            />
            <InventoryRequestDialog
                item={requestDialogItem}
                open={!!requestDialogItem}
                onOpenChange={(open) => !open && setRequestDialogItem(null)}
            />

            <IssueItemDialog
                item={issueDialogItem}
                open={!!issueDialogItem}
                onOpenChange={(open) => {
                    if (!open) setIssueDialogItem(null);
                    // Refresh data on close to update status
                    if (!open) fetchData();
                }}
            />

            <ReturnItemDialog
                issue={returnDialogIssue}
                open={!!returnDialogIssue}
                onOpenChange={(open) => {
                    if (!open) setReturnDialogIssue(null);
                }}
                onReturnComplete={() => {
                    setReturnDialogIssue(null);
                    fetchData();
                }}
            />
        </div>
    );
}
