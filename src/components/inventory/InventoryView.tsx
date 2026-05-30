"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { InventoryGrid } from './InventoryGrid';
import { InventoryList } from './InventoryList';
import { InventoryDetailDialog } from './InventoryDetailDialog';
import { InventoryFilters, SortOption } from './InventoryFilters';
import { EquipmentItem, InventoryIssueClean, InventoryRequestClean } from '@/services/inventory/inventoryContract';
import { InventoryItem, INVENTORY_GUIDE, INVENTORY_CATEGORIES } from '@/types/inventory';
import { inventoryService } from '@/services/inventory/inventoryService';
import { inventoryIssueService } from '@/services/inventory/inventoryIssueService';
import { inventoryRequestService } from '@/services/inventory/inventoryRequestService';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useWorkspace } from '@/system/workspace/WorkspaceProvider';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Clock, FileDown, Plus, Info, ChevronUp, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { nativeNavigate, cn } from '@/lib/utils';
import { InventoryRequestDialog } from './InventoryRequestDialog';
import { IssueItemDialog } from './IssueItemDialog';
import { ReturnItemDialog } from './ReturnItemDialog';
import { EquipmentBookingDialog } from './EquipmentBookingDialog';
import { EquipmentScheduleWidget } from './EquipmentScheduleWidget';

import { usePermissions } from '@/hooks/usePermissions';

export default function InventoryView() {
    const { user } = useAuth();
    const { currentWorkspaceId } = useWorkspace();
    const router = useRouter();
    const [items, setItems] = useState<EquipmentItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeIssues, setActiveIssues] = useState<InventoryIssueClean[]>([]);
    const [myRequests, setMyRequests] = useState<Set<string>>(new Set()); // Set of Item IDs
    const { role: currentRole } = usePermissions();

    // Dialog States
    const [requestDialogItem, setRequestDialogItem] = useState<EquipmentItem | null>(null);
    const [issueDialogItem, setIssueDialogItem] = useState<EquipmentItem | null>(null);
    const [bookingDialogItem, setBookingDialogItem] = useState<EquipmentItem | null>(null);
    const [returnDialogIssue, setReturnDialogIssue] = useState<InventoryIssueClean | null>(null);
    const [viewItem, setViewItem] = useState<EquipmentItem | null>(null);
    const [activeTab, setActiveTab] = useState<'items' | 'schedule'>('items');

    // Filter State
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>('name_asc');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // Guide State
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Items (Critical)
            const itemsPromise = inventoryService.getEquipment({ limit: 300, institutionId: currentWorkspaceId ? String(currentWorkspaceId) : undefined })
                .catch(err => {
                    console.error("Failed to fetch inventory items", err);
                    return [];
                });

            // 2. Fetch Issues (Optional - Context Aware)
            const issuesPromise = (user?.tenant_id)
                ? inventoryIssueService.getActiveIssues()
                    .catch(err => {
                        console.warn('Failed to fetch active issues (likely permission restricted):', err);
                        return [];
                    })
                : Promise.resolve([]);

            // 3. Fetch My Requests (Optional - Member/Standard Only)
            const requestsPromise = (user && !['admin', 'manager', 'team'].includes(currentRole))
                ? inventoryRequestService.getMyRequests(user.uid, currentWorkspaceId ? String(currentWorkspaceId) : '')
                    .catch(err => {
                        console.warn('Failed to fetch my requests:', err);
                        return [];
                    })
                : Promise.resolve([]);

            const [fetchedItems, fetchedIssues, myRequestsData] = await Promise.all([
                itemsPromise,
                issuesPromise,
                requestsPromise
            ]);

            setItems(fetchedItems);
            setActiveIssues(fetchedIssues);

            if (myRequestsData.length > 0) {
                // Filter for pending/approved only
                const activeReqs = myRequestsData.filter((r: any) => r.status === 'pending' || r.status === 'approved');
                setMyRequests(new Set(activeReqs.map((r: any) => r.itemId)));
            } else {
                setMyRequests(new Set());
            }

        } catch (error) {
            console.error('Critical failure in inventory load:', error);
            toast.error("Failed to load inventory");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user, currentWorkspaceId]);

    // Derived State
    const processedItems = useMemo(() => {
        // Create a map of In-Use Item IDs
        const issuedItemIds = new Set(activeIssues.map(i => i.itemId));

        // Derive Status
        const itemsWithDerivedStatus = items.map(item => {
            if (issuedItemIds.has(item.id)) {
                return { ...item, status: 'In Use' };
            }
            return item;
        });

        let result = itemsWithDerivedStatus.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                item.category.toLowerCase().includes(search.toLowerCase()) ||
                (item.serialNumber && item.serialNumber.toLowerCase().includes(search.toLowerCase()));
            const matchesCategory = category ? item.category === category : true;
            
            if (!matchesSearch || !matchesCategory) return false;

            if (sortBy.startsWith('status_')) {
                const targetStatus = sortBy.substring(7); // "available", "in_use", "maintenance", "retired"
                const itemStatus = (item.status || '').toLowerCase();
                
                if (targetStatus === 'available') {
                    return itemStatus === 'available';
                } else if (targetStatus === 'in_use') {
                    return itemStatus === 'in use' || itemStatus === 'in_use';
                } else if (targetStatus === 'maintenance') {
                    return itemStatus === 'under repair' || itemStatus === 'under_repair' || itemStatus === 'maintenance';
                } else if (targetStatus === 'retired') {
                    return itemStatus === 'disposed' || itemStatus === 'retired';
                }
                return true;
            }

            if (sortBy.startsWith('condition_')) {
                const targetCondition = sortBy.substring(10); // "good", "fair", "poor", "damaged"
                const itemCondition = (item.condition || '').toLowerCase();
                
                if (targetCondition === 'good') {
                    return itemCondition === 'good' || itemCondition === 'excellent' || itemCondition === 'new';
                } else if (targetCondition === 'fair') {
                    return itemCondition === 'fair' || itemCondition === 'need repair' || itemCondition === 'need_repair';
                } else if (targetCondition === 'poor') {
                    return itemCondition === 'poor' || itemCondition === 'damaged';
                } else if (targetCondition === 'damaged') {
                    return itemCondition === 'damaged' || itemCondition === 'poor';
                }
                return true;
            }

            return true;
        });

        // Sorting
        result.sort((a, b) => {
            if (sortBy.startsWith('status_') || sortBy.startsWith('condition_')) {
                return a.name.localeCompare(b.name);
            }
            switch (sortBy) {
                case 'name_asc': return a.name.localeCompare(b.name);
                case 'name_desc': return b.name.localeCompare(a.name);
                case 'category': return a.category.localeCompare(b.category);
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

    const handleRequest = useCallback((item: EquipmentItem) => {
        if (['admin', 'manager', 'team'].includes(currentRole)) {
            // Admin/Manager/Team -> Issue directly (Shortcut)
            setIssueDialogItem(item);
        } else {
            // Member/Standard -> Request
            setRequestDialogItem(item);
        }
    }, [currentRole]);

    const handleReturn = useCallback((item: EquipmentItem) => {
        // Find active issue for this item
        const issue = activeIssues.find(i => i.itemId === item.id);
        if (issue) {
            setReturnDialogIssue(issue);
        } else {
            toast.error("Issue record not found for this item.");
            fetchData(); // Sync up
        }
    }, [activeIssues]);

    const handleEdit = useCallback((item: EquipmentItem) => {
        nativeNavigate(`/inventory/edit?id=${item.id}`, router, 'InventoryView (Edit)');
    }, [router]);

    const handleDelete = useCallback(async (item: EquipmentItem) => {
        try {
            await inventoryService.delete(String(item.id));
            toast.success("Item moved to trash");
            fetchData(); // Refresh list
        } catch (error) {
            console.error("Deletion failed:", error);
            toast.error("Failed to delete item");
        }
    }, [currentRole]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Inventory"
                description="Manage and request studio assets."
                actions={
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => nativeNavigate('/inventory/requests', router, 'InventoryView (Requests)')}
                            className="text-foreground hover:text-foreground hover:bg-foreground/10"
                        >
                            <Clock className="w-4 h-4 mr-2" />
                            {['admin', 'manager'].includes(currentRole) ? 'Requests' : 'My Requests'}
                        </Button>
                        
                        {['admin', 'manager'].includes(currentRole) && (
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
                                    className="text-foreground hover:text-foreground hover:bg-foreground/10 hidden sm:flex"
                                >
                                    <FileDown className="w-4 h-4 mr-2" />
                                    Export
                                </Button>
                                <Button
                                    onClick={() => nativeNavigate('/inventory/add', router, 'InventoryView (Add Asset)')}
                                    className="bg-primary hover:opacity-90 text-foreground shadow-lg shadow-primary/25 font-bold"
                                >
                                    <Plus size={18} className="mr-2" /> Add Asset
                                </Button>
                            </>
                        )}
                    </div>
                }
            />

            {/* Categorization Guide */}
            <Collapsible open={isGuideOpen} onOpenChange={setIsGuideOpen} className="glass-card rounded-xl overflow-hidden shadow-lg">
                <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors">
                    <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-400" />
                        Media Inventory Categorization Guide
                    </div>
                    {isGuideOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="px-4 pb-4 pt-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs text-secondary border-t border-foreground/5 bg-foreground/[0.02]">
                        {Object.entries(INVENTORY_GUIDE).map(([cat, desc]) => (
                            <div key={cat} className="py-1">
                                <span className="text-foreground font-semibold">{cat}:</span> <span className="text-secondary">{desc}</span>
                            </div>
                        ))}
                    </div>
                </CollapsibleContent>
            </Collapsible>

            {/* Navigation Tabs */}
            {['admin', 'manager', 'team'].includes(currentRole) && (
                <div className="flex items-center bg-foreground/[0.03] p-1 rounded-full border border-foreground/10 backdrop-blur-md w-fit mb-6">
                    <button
                        onClick={() => setActiveTab('items')}
                        className={cn(
                            "px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all duration-200",
                            activeTab === 'items' 
                            ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/5' 
                            : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5 border border-transparent'
                        )}
                    >
                        Equipment Items
                    </button>
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={cn(
                            "px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all duration-200",
                            activeTab === 'schedule' 
                            ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/5' 
                            : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5 border border-transparent'
                        )}
                    >
                        Booking Schedule
                    </button>
                </div>
            )}

            {activeTab === 'items' ? (
                <>
                    {/* Filters Toolbar */}
                    <InventoryFilters
                        search={search}
                        onSearchChange={setSearch}
                        category={category}
                        onCategoryChange={setCategory}
                        sortBy={sortBy}
                        onSortChange={setSortBy}
                        categories={Object.values(INVENTORY_CATEGORIES)}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                    />

                    {/* Content Area */}
                    {viewMode === 'list' ? (
                        <InventoryList
                            items={processedItems}
                            loading={loading}
                            activeIssues={activeIssues}
                            pendingRequestItemIds={myRequests}
                            role={currentRole}
                            onRequest={handleRequest}
                            onReturn={handleReturn}
                            onBook={setBookingDialogItem}
                            onEdit={['admin', 'manager'].includes(currentRole) ? handleEdit : undefined}
                            onView={setViewItem}
                            onDelete={handleDelete}
                        />
                    ) : (
                        <InventoryGrid
                            items={processedItems}
                            loading={loading}
                            activeIssues={activeIssues}
                            pendingRequestItemIds={myRequests}
                            role={currentRole}
                            onRequest={handleRequest}
                            onReturn={handleReturn}
                            onBook={setBookingDialogItem}
                            onEdit={['admin', 'manager'].includes(currentRole) ? handleEdit : undefined}
                            onView={setViewItem}
                            onDelete={handleDelete}
                        />
                    )}
                </>
            ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="bg-glass border-soft p-6 rounded-2xl">
                        <EquipmentScheduleWidget />
                    </div>
                    
                    {/* Secondary Info / Summary could go here */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-glass border-soft p-4 rounded-xl">
                            <h4 className="text-[10px] uppercase font-bold text-foreground/50 mb-1">Active Bookings</h4>
                            <p className="text-2xl font-bold text-foreground">{activeIssues.length}</p>
                        </div>
                        {/* More summary cards... */}
                    </div>
                </div>
            )}

            {/* Dialogs */}
            <InventoryDetailDialog
                item={viewItem}
                open={!!viewItem}
                onOpenChange={(open) => !open && setViewItem(null)}
                role={currentRole}
                onEdit={['admin', 'manager'].includes(currentRole) ? (item) => {
                    setViewItem(null); // Close view
                    handleEdit(item);
                } : undefined}
                onDelete={['admin', 'manager'].includes(currentRole) ? (item) => {
                    setViewItem(null); // Close view
                    handleDelete(item);
                } : undefined}
                onRequest={(item) => {
                    setViewItem(null);
                    handleRequest(item);
                }}
                onBook={(item) => {
                    setViewItem(null);
                    setBookingDialogItem(item);
                }}
            />
            <InventoryRequestDialog
                item={requestDialogItem}
                open={!!requestDialogItem}
                onOpenChange={(open) => !open && setRequestDialogItem(null)}
            />

            <EquipmentBookingDialog
                item={bookingDialogItem}
                open={!!bookingDialogItem}
                onOpenChange={(open) => !open && setBookingDialogItem(null)}
                onSuccess={() => fetchData()}
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
