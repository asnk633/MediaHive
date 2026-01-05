"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { inventoryService } from "@/services/inventoryService";
import { InventoryItem, InventoryCondition } from "@/types/inventory";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Edit, Trash2, Tag, Calendar, DollarSign, PenTool, Hash, Info } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getDriveImageUrl } from "@/lib/driveUtils";
import { InventoryGallery } from "@/components/inventory/InventoryGallery";

const CONDITION_BADGES: Record<InventoryCondition, string> = {
    good: "bg-green-500/20 text-green-300 border-green-500/30",
    needs_repair: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    broken: "bg-red-500/20 text-red-300 border-red-500/30",
    lost: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    retired: "bg-slate-700/50 text-slate-400 border-slate-600/50",
};

export default function InventoryDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [item, setItem] = useState<InventoryItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadItem(id as string);
        }
    }, [id]);

    const getSafeDate = (date: any) => {
        if (!date) return new Date();
        if (typeof date.toDate === 'function') return date.toDate();
        if (date.seconds) return new Date(date.seconds * 1000);
        return new Date(date);
    };

    const loadItem = async (itemId: string) => {
        try {
            setLoading(true);
            const data = await inventoryService.getById(itemId);
            setItem(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load item details.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!item || !user || user.role !== 'admin') return;

        try {
            await inventoryService.delete(item.id, user);
            toast.success("Item deleted successfully.");
            router.push('/inventory');
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete item.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400">
                <AlertTriangle size={48} className="mb-4 opacity-50" />
                <p>Item not found or access denied.</p>
                <Link href="/inventory" className="mt-4 text-blue-400 hover:underline">Return to List</Link>
            </div>
        );
    }

    return (
        <div className="pt-20 px-4 pb-20 max-w-4xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/inventory" className="text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-white">{item.name}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border bg-blue-500/10 text-blue-400 border-blue-500/20`}>
                                {(item.status || 'available').replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                        <p className="text-slate-400 mt-1 flex items-center gap-2 font-medium">
                            {item.category}
                        </p>
                    </div>
                </div>

                {user?.role === 'admin' && (
                    <div className="flex gap-2">
                        <Link href={`/inventory/${item.id}/edit`}>
                            <Button variant="outline" className="border-white/10 hover:bg-white/5 gap-2">
                                <Edit size={16} /> Edit
                            </Button>
                        </Link>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20 gap-2">
                                    <Trash2 size={16} /> Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-slate-900 border-white/10">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the inventory item
                                        <span className="font-bold text-white"> {item.name}</span>.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="hover:bg-white/5 border-white/10">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete Item</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Gallery Section */}
                <div className="md:col-span-2">
                    <InventoryGallery
                        name={item.name}
                        images={item.images || (item.imageUrl ? [{ url: item.imageUrl, fileId: item.driveFileId || '' }] : [])}
                    />
                </div>

                {/* Main Info Card */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 space-y-6">
                    <h3 className="text-lg font-semibold text-white mb-4 border-b border-white/5 pb-2">Asset Details</h3>

                    <div className="space-y-4">
                        <DetailRow
                            icon={Calendar}
                            label="Purchase Date"
                            value={item.purchaseDate ? format(getSafeDate(item.purchaseDate), 'PPP') : 'N/A'}
                        />
                        {user?.role === 'admin' && (
                            <DetailRow
                                icon={DollarSign}
                                label="Purchase Price"
                                value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.purchasePrice)}
                            />
                        )}
                        <DetailRow icon={Hash} label="Serial Number" value={item.serialNumber || 'N/A'} isMono />
                        <DetailRow icon={PenTool} label="Condition" value={item.condition.replace('_', ' ').toUpperCase()} />
                    </div>
                </div>

                {/* Remarks & Audit Card */}
                <div className="space-y-6">
                    <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 h-full flex flex-col">
                        <h3 className="text-lg font-semibold text-white mb-4 border-b border-white/5 pb-2">Remarks</h3>
                        <div className="flex-1 bg-black/20 rounded-xl p-4 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {item.remarks || "No remarks added."}
                        </div>
                    </div>
                </div>

                {/* Audit Info */}
                <div className="md:col-span-2 bg-slate-900/30 border border-slate-800/50 rounded-xl p-4 flex flex-col sm:flex-row justify-between text-xs text-slate-500 gap-2">
                    <div className="flex items-center gap-2">
                        <Info size={14} />
                        <span>
                            Added on {item.createdAt ? format(getSafeDate(item.createdAt), 'PP p') : 'Unknown Date'} by {typeof item.createdBy === 'object' ? item.createdBy.name : 'Admin'}
                        </span>
                    </div>
                    {item.updatedAt && (
                        <span>Last updated: {format(getSafeDate(item.updatedAt), 'PP p')}</span>
                    )}
                </div>

            </div>
        </div>
    );
}

function DetailRow({ icon: Icon, label, value, isMono }: { icon: any, label: string, value: string, isMono?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-slate-400">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Icon size={16} />
                </div>
                <span className="text-sm font-medium">{label}</span>
            </div>
            <span className={`text-sm text-slate-200 ${isMono ? 'font-mono tracking-wider' : ''}`}>{value}</span>
        </div>
    )
}
