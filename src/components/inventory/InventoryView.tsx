"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { InventoryGrid } from './InventoryGrid';
import { InventoryFilters, SortOption } from './InventoryFilters';
import { InventoryItem, InventoryApiResponse, INVENTORY_CATEGORIES, INVENTORY_GUIDE } from '@/types/inventory';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus, Clock, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function InventoryView() {
    const { user } = useAuth();
    const router = useRouter();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>('name_asc');

    // Guide State
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    // Fetch
    const fetchInventory = async () => {
        setLoading(true);
        try {
            const data = await apiClient<InventoryApiResponse>(`/api/inventory?limit=300`);
            setItems(data.items || []);
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    // Derived State
    const processedItems = useMemo(() => {
        let result = items.filter(item => {
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
    }, [items, search, category, sortBy]);

    const handleRequest = (item: InventoryItem) => {
        toast.info(`requesting ${item.name} (Coming Soon)`);
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
                            My Requests
                        </Button>

                        {user?.role === 'admin' && (
                            <Button
                                onClick={() => router.push('/inventory/add')}
                                className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
                            >
                                <Plus size={18} className="mr-2" /> Add Asset
                            </Button>
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
                role={user?.role}
                onRequest={handleRequest}
                onEdit={user?.role === 'admin' ? (item) => {
                    router.push(`/inventory/edit/${item.id}`);
                } : undefined}
            />
        </div>
    );
}
