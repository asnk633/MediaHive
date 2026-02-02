'use client';

import React, { useEffect, useState } from 'react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { InventoryItem, InventoryApiResponse } from '@/types/inventory';
import { apiClient, apiPost } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContextProvider';
import { Plus, AlertCircle, RefreshCw, Archive } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

export default function InventoryTable() {
    const { user } = useAuth();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [total, setTotal] = useState(0);
    const LIMIT = 50;

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const data = await apiClient<InventoryApiResponse>(`/api/inventory?limit=${LIMIT}&offset=${page * LIMIT}`);
            setItems(data.items || []);
            setTotal(data.meta?.total || 0);
            setHasMore(data.meta?.hasMore || false);
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, [page]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ok': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">In Stock</Badge>;
            case 'low': return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20">Low Stock</Badge>;
            case 'out': return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20">Out of Stock</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-foreground">Inventory</h2>
                    <p className="text-sm text-muted">Total Items: {total}</p>
                </div>
                {user?.role === 'admin' && (
                    <CreateItemDialog onSuccess={fetchInventory} />
                )}
            </div>

            <div className="rounded-md border border-soft overflow-hidden overflow-x-auto bg-surface/30">
                <Table>
                    <TableHeader className="bg-muted/5">
                        <TableRow className="border-soft hover:bg-transparent">
                            <TableHead className="text-muted">Name</TableHead>
                            <TableHead className="text-muted">Category</TableHead>
                            <TableHead className="text-muted">Quantity</TableHead>
                            <TableHead className="text-muted">Status</TableHead>
                            <TableHead className="text-muted">Last Updated</TableHead>
                            <TableHead className="text-right text-muted">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-white/5">
                                    <TableCell><Skeleton className="h-4 w-32 bg-slate-800" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24 bg-slate-800" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16 bg-slate-800" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20 bg-slate-800" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24 bg-slate-800" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded ml-auto bg-slate-800" /></TableCell>
                                </TableRow>
                            ))
                        ) : items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted">
                                    No items found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id} className="border-soft hover:bg-primary/5">
                                    <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                                    <TableCell className="text-muted/80">{item.category}</TableCell>
                                    <TableCell className="text-muted/80">
                                        {item.quantity} <span className="text-xs text-muted">{item.unit}</span>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                                    <TableCell className="text-xs text-muted">
                                        {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {user?.role === 'admin' && (
                                            <EditItemDialog item={item} onSuccess={fetchInventory} />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-end gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0 || loading}
                    className="border-soft text-foreground hover:bg-surface/50 bg-transparent"
                >
                    Previous
                </Button>
                <span className="text-sm text-muted">Page {page + 1}</span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasMore || loading}
                    className="border-soft text-foreground hover:bg-surface/50 bg-transparent"
                >
                    Next
                </Button>
            </div>
        </div>
    );
}

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
            toast.success('Item created');
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
                <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                    <Plus size={16} className="mr-2" /> Add Item
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-surface border-soft text-foreground sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Inventory Item</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input name="name" required placeholder="e.g. AA Batteries" className="bg-surface/50 border-soft" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select name="category" required defaultValue="General">
                                <SelectTrigger className="bg-surface/50 border-soft">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-surface border-soft text-foreground">
                                    <SelectItem value="General">General</SelectItem>
                                    <SelectItem value="Electronics">Electronics</SelectItem>
                                    <SelectItem value="Cables">Cables</SelectItem>
                                    <SelectItem value="Consumables">Consumables</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Unit</Label>
                            <Input name="unit" required placeholder="pcs, kg" className="bg-surface/50 border-soft" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input name="quantity" type="number" required min="0" className="bg-surface/50 border-soft" />
                        </div>
                        <div className="space-y-2">
                            <Label>Low Stock Threshold</Label>
                            <Input name="threshold" type="number" required min="0" className="bg-surface/50 border-soft" />
                        </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                        <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-500 text-white">
                            {submitting ? 'Saving...' : 'Create Item'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditItemDialog({ item, onSuccess }: { item: InventoryItem, onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData(e.currentTarget);

        try {
            await apiClient(`/api/inventory/${item.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    quantity: Number(formData.get('quantity')),
                    threshold: Number(formData.get('threshold'))
                })
            });
            toast.success('Item updated');
            setOpen(false);
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <RefreshCw size={14} className="text-slate-400" />
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-surface border-soft text-foreground sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Update Stock: {item.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input name="quantity" type="number" required min="0" defaultValue={item.quantity} className="bg-surface/50 border-soft" />
                        </div>
                        <div className="space-y-2">
                            <Label>Low Stock Threshold</Label>
                            <Input name="threshold" type="number" required min="0" defaultValue={item.threshold} className="bg-surface/50 border-soft" />
                        </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                        <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-500 text-white">
                            {submitting ? 'Updating...' : 'Update Stock'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
