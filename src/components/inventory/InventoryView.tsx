'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo } from 'react';
import { InventoryGrid } from './InventoryGrid';
import { InventoryFilters } from './InventoryFilters';
import { InventoryItem, InventoryApiResponse } from '@/types/inventory';
import { apiClient, apiPost } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock } from 'lucide-react';

export default function InventoryView() {
    const { user } = useAuth();
    const router = useRouter(); // Added router
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<string | null>(null);

    // Fetch
    const fetchInventory = async () => {
        setLoading(true);
        try {
            // Fetch more items to support client-side filtering comfortably 
            // (Since API doesn't support complex search/filter yet, we fetch a larger batch for Phase 3)
            const data = await apiClient<InventoryApiResponse>(`/api/inventory?limit=200`);
            setItems(data.items || []);
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            // toast.error('Failed to load inventory'); // Removed to be "Calm"
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    // Derived State (Client-side filtering for snappy UX)
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                item.category.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = category ? item.category === category : true;
            return matchesSearch && matchesCategory;
        });
    }, [items, search, category]);

    // Actions
    const handleRequest = (item: InventoryItem) => {
        toast.info(`requesting ${item.name} (Coming Soon)`);
        // TODO: Wire to Device Request Modal in Phase 4 or late Phase 3
    };

    return (
        <div className="space-y-6">
            {/* Header / Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white tracking-tight">
                        Inventory
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Manage and request studio assets.
                    </p>
                </div>

                {/* Actions */}
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
                        <CreateItemDialog onSuccess={fetchInventory} />
                    )}
                </div>
            </div>

            {/* Filters */}
            <InventoryFilters
                search={search}
                onSearchChange={setSearch}
                category={category}
                onCategoryChange={setCategory}
                categories={Array.from(new Set(items.map(i => i.category))).filter(Boolean).sort()}
            />

            {/* Grid */}
            <InventoryGrid
                items={filteredItems}
                loading={loading}
                role={user?.role}
                onRequest={handleRequest}
                onEdit={user?.role === 'admin' ? (item) => {
                    // We'll reimplement Edit Logic or reuse Dialog
                    // For now, let's keep it simple
                    toast.info(`Editing ${item.name}`);
                } : undefined}
            />
        </div>
    );
}

// Reuse the Create Dialog logic from before but modernized
function CreateItemDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData(e.currentTarget);

        try {
            await apiPost('/api/inventory', {
                name: formData.get('name'),
                category: formData.get('category'),
                quantity: Number(formData.get('quantity')),
                unit: formData.get('unit'),
                threshold: Number(formData.get('threshold')),
            });
            toast.success('Asset created');
            setOpen(false);
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || 'Failed to create');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20">
                    <Plus size={18} className="mr-2" /> Add Asset
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-[#ffffff1a] text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Asset</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label>Asset Name</Label>
                        <Input name="name" required placeholder="e.g. Sony A7s III" className="bg-white/5 border-[#ffffff1a]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select name="category" required defaultValue="General">
                                <SelectTrigger className="bg-white/5 border-[#ffffff1a]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-[#ffffff1a] text-white">
                                    <SelectItem value="Cameras">Cameras</SelectItem>
                                    <SelectItem value="Audio">Audio</SelectItem>
                                    <SelectItem value="Lights">Lights</SelectItem>
                                    <SelectItem value="Cables">Cables</SelectItem>
                                    <SelectItem value="Consumables">Consumables</SelectItem>
                                    <SelectItem value="General">General</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Unit</Label>
                            <Input name="unit" required placeholder="pcs, kit" className="bg-white/5 border-[#ffffff1a]" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input name="quantity" type="number" required min="0" className="bg-white/5 border-[#ffffff1a]" />
                        </div>
                        <div className="space-y-2">
                            <Label>Low Threshold</Label>
                            <Input name="threshold" type="number" required min="0" className="bg-white/5 border-[#ffffff1a]" />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-500">
                            {submitting ? 'Saving...' : 'Add Asset'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
