"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { inventoryService } from "@/services/inventoryService";
import { deviceRequestService } from "@/services/deviceRequestService";
import { InventoryItem, InventoryCondition } from "@/types/inventory";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, Package, AlertTriangle, Camera, Laptop, Mic, Lightbulb, Plug, Armchair, Box, Aperture, Monitor, HardDrive, Wifi, RefreshCw, Users } from "lucide-react";
import { motion } from "framer-motion";
import { SafeAvatar } from "@/components/ui/SafeAvatar";
import { InventoryStatus } from "@/types/inventory";
import { InventoryRequestModal } from "@/components/inventory/InventoryRequestModal";
import { getDriveImageUrl } from "@/lib/driveUtils";
import { toast } from "sonner";

const CONDITION_COLORS: Record<InventoryCondition, string> = {
    good: "bg-green-500/20 text-green-300 border-green-500/30",
    needs_repair: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    broken: "bg-red-500/20 text-red-300 border-red-500/30",
    lost: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    retired: "bg-slate-700/50 text-slate-400 border-slate-600/50",
};

const STATUS_COLORS: Record<InventoryStatus, string> = {
    available: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    in_use: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    maintenance: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    retired: "bg-slate-700/50 text-slate-400 border-slate-600/50",
};

const CONDITION_LABELS: Record<InventoryCondition, string> = {
    good: "Good",
    needs_repair: "Needs Repair",
    broken: "Broken",
    lost: "Lost",
    retired: "Retired",
};

const STATUS_LABELS: Record<InventoryStatus, string> = {
    available: "Available",
    in_use: "In Use",
    maintenance: "Maintenance",
    retired: "Retired",
};

const CATEGORY_ICONS: Record<string, any> = {
    "Camera": Camera,
    "Lens": Aperture,
    "Audio": Mic,
    "Lights": Lightbulb,
    "Cables": Plug,
    "IT": Laptop,
    "Furniture": Armchair,
    "decoration": Box,
    "Other": Package,
};

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function InventoryListPage() {
    // ... (existing state)
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("All");
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

    // Return Dialog State
    const [itemToReturn, setItemToReturn] = useState<{ itemId: string, requestId: string, itemName: string } | null>(null);
    const [justReturnedIds, setJustReturnedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadItems();
    }, [user]);

    const loadItems = async () => {
        try {
            const data = await inventoryService.getAll();
            setItems(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        try {
            const res = await inventoryService.syncStatus();
            toast.success(`Synced ${res.count} items.`);
            loadItems();
        } catch (error) {
            toast.error("Failed to sync status.");
        }
    };

    const confirmReturn = async () => {
        if (!itemToReturn) return;
        try {
            await deviceRequestService.updateRequest(itemToReturn.requestId, { status: 'waiting_inspection' });
            toast.success("Marked as returned. Admin notified.");
            setJustReturnedIds(prev => new Set(prev).add(itemToReturn.itemId));
        } catch (e) {
            console.error(e);
            toast.error("Failed to mark return.");
        } finally {
            setItemToReturn(null);
        }
    };

    // Derived state
    const categories = ["All", ...Array.from(new Set(items.map(i => i.category || "Uncategorized")))];
    const outForUseItems = items.filter(i => i.status === 'in_use');

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === "All" || (item.category || "Uncategorized") === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!user) {
        return null; // Or redirect
    }

    return (
        <div className="px-4 pb-20 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-20">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
                        Inventory
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Managing {items.length} {items.length === 1 ? 'Asset' : 'Assets'}
                    </p>
                </div>

                {user.role === 'admin' && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleSync}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-2 rounded-xl transition-all active:scale-95"
                            title="Sync Status with Active Requests"
                        >
                            <RefreshCw size={18} />
                        </button>
                        <Link href="/inventory/requests">
                            <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-xl transition-all active:scale-95">
                                <Package size={18} />
                                <span>Requests</span>
                            </button>
                        </Link>
                        <Link href="/inventory/new">
                            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                                <Plus size={18} />
                                <span>Add Item</span>
                            </button>
                        </Link>
                    </div>
                )}
                {user.role === 'guest' && (
                    <button
                        onClick={() => setIsRequestModalOpen(true)}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition-all border border-white/10 active:scale-95"
                    >
                        <Plus size={18} />
                        <span>Request Item</span>
                    </button>
                )}
            </div>

            {/* Out for Use Widget */}
            {outForUseItems.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                        Currently Out for Use
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {outForUseItems.map(item => (
                            <div key={item.id} className={`bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 flex items-center gap-3 ${item.currentHolder?.uid === user.uid ? 'ring-1 ring-blue-400 bg-blue-500/5' : ''}`}>
                                {item.imageUrl ? (
                                    <div className="w-12 h-12 rounded-lg bg-black/20 overflow-hidden shrink-0">
                                        <img src={getDriveImageUrl(item.imageUrl)} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                                        <Package className="text-indigo-400" size={20} />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-indigo-100 truncate">{item.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-indigo-300/70">
                                        <Users size={12} />
                                        <span className="truncate">
                                            {item.currentHolder?.name || 'Unknown User'}
                                        </span>
                                    </div>
                                </div>
                                {item.currentHolder?.uid === user.uid && item.currentHolder?.requestId && !justReturnedIds.has(item.id) && (
                                    <button
                                        onClick={() => setItemToReturn({
                                            itemId: item.id,
                                            requestId: item.currentHolder!.requestId!,
                                            itemName: item.name
                                        })}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all"
                                    >
                                        Return
                                    </button>
                                )}
                                {justReturnedIds.has(item.id) && (
                                    <span className="text-xs text-green-400 font-medium px-2 py-1 bg-green-500/10 rounded-lg border border-green-500/20">
                                        Pending Inspection
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 sticky top-0 z-10 bg-[#0B1121]/80 backdrop-blur-md py-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-transparent sm:backdrop-blur-none">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>

                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="appearance-none bg-slate-800/50 border border-slate-700 rounded-xl py-2 pl-10 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-w-[160px]"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Grid */}
            {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <Package size={48} className="mb-4 opacity-50" />
                    <p>No items found matching your filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredItems.map((item) => {
                        const Icon = CATEGORY_ICONS[item.category] || Package;
                        const status = item.status || 'available';

                        return (
                            <Link key={item.id} href={`/inventory/${item.id}`}>
                                <motion.div
                                    layoutId={`card-${item.id}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="group relative bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all rounded-2xl p-4 cursor-pointer overflow-hidden"
                                >
                                    {/* Active Glow on Hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="flex justify-between items-start mb-3 relative z-[1]">
                                        {item.imageUrl ? (
                                            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/10 relative flex-shrink-0 bg-black/20">
                                                <img
                                                    src={getDriveImageUrl(item.imageUrl)}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                                <Icon size={20} />
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-2 items-end">
                                            <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${CONDITION_COLORS[item.condition] || 'bg-slate-800 text-slate-400'}`}>
                                                {CONDITION_LABELS[item.condition] || item.condition}
                                            </div>
                                            <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[item.status || 'available'] || STATUS_COLORS['available']}`}>
                                                {STATUS_LABELS[item.status || 'available']}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative z-[1] pr-2">
                                        <h3 className="font-semibold text-white truncate text-base mb-0.5">{item.name}</h3>
                                        <p className="text-xs text-slate-400 truncate mb-3">{item.category}</p>
                                    </div>

                                    <div className="flex flex-col gap-1 text-xs text-slate-400 mt-2 pt-2 border-t border-white/5 relative z-[1]">
                                        {item.serialNumber && (
                                            <div className="flex justify-between">
                                                <span>Serial:</span>
                                                <span className="font-mono text-slate-300">{item.serialNumber}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span>Purchased:</span>
                                            <span className="text-slate-300">
                                                {(() => {
                                                    const date = item.purchaseDate;
                                                    if (!date) return 'N/A';
                                                    try {
                                                        // Handle Firestore Timestamp (has toDate)
                                                        if (typeof date === 'object' && 'toDate' in date) {
                                                            return (date as any).toDate().toLocaleDateString();
                                                        }
                                                        // Handle Firestore serialized (seconds)
                                                        if (typeof date === 'object' && 'seconds' in date) {
                                                            return new Date((date as any).seconds * 1000).toLocaleDateString();
                                                        }
                                                        // Handle string/number
                                                        return new Date(date).toLocaleDateString();
                                                    } catch (e) {
                                                        return 'Invalid Date';
                                                    }
                                                })()}
                                            </span>
                                        </div>
                                        {user.role === 'admin' && item.purchasePrice > 0 && (
                                            <div className="flex justify-between">
                                                <span>Price:</span>
                                                <span className="text-slate-300">
                                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.purchasePrice)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-3 pt-2 border-t border-white/5 flex justify-end relative z-[2]">
                                        {status === 'available' && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    router.push(`/inventory/requests/new?itemId=${item.id}`);
                                                }}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
                                            >
                                                <Plus size={14} strokeWidth={3} />
                                                Request
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            </Link>
                        )
                    })}
                </div>
            )}

            <InventoryRequestModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
            />

            <AlertDialog open={!!itemToReturn} onOpenChange={() => setItemToReturn(null)}>
                <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Return Item</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-400">
                            Are you sure you want to mark <span className="text-white font-bold">{itemToReturn?.itemName}</span> as returned?
                            The admin will be notified to inspect the item.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-slate-800 text-white border-white/10 hover:bg-slate-700">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmReturn} className="bg-blue-600 text-white hover:bg-blue-500 border-none">
                            Confirm Return
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
