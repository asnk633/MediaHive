import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { EquipmentItem } from '@/services/inventory/inventoryContract';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Edit, Box, ChevronLeft, ChevronRight, ShieldCheck, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface InventoryDetailDialogProps {
    item: EquipmentItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit?: (item: EquipmentItem) => void;
    onRequest?: (item: EquipmentItem) => void;
    onBook?: (item: EquipmentItem) => void;
    onDelete?: (item: EquipmentItem) => void;
    role?: string;
}

export const InventoryDetailDialog: React.FC<InventoryDetailDialogProps> = ({
    item,
    open,
    onOpenChange,
    onEdit,
    onRequest,
    onBook,
    onDelete,
    role
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (open) setCurrentIndex(0);
    }, [open, item?.id]);

    if (!item) return null;

    // consolidate images: verify if images array exists, else fallback to single imageUrl, else empty
    const images: any[] = (item as any).images && (item as any).images.length > 0
        ? (item as any).images
        : ((item as any).imageUrl ? [{ url: (item as any).imageUrl, file_id: (item as any).driveFileId || '' }] : []);

    const hasMultipleImages = images.length > 1;

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[1100px] w-[95vw] h-[760px] p-0 gap-0 bg-[#0F1218] border border-foreground/5 overflow-hidden flex flex-row focus:outline-none shadow-2xl rounded-lg font-sans text-slate-400">

                {/* LEFT: Visually blended inspection area (50%) */}
                <div className="w-[50%] h-full p-8 flex flex-col relative bg-[#090b0f] justify-center items-center">
                    {images.length > 0 ? (
                        <>
                            <div className="flex-1 w-full relative mb-4 min-h-0 group/image">
                                <Image
                                    src={images[currentIndex]?.url || images[0].url}
                                    alt={item.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-contain"
                                    priority
                                />
                                {hasMultipleImages && (
                                    <>
                                        <button
                                            onClick={handlePrev}
                                            className="absolute left-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-foreground/70 hover:text-foreground hover:bg-black/70 opacity-0 group-hover/image:opacity-100 transition-opacity"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-foreground/70 hover:text-foreground hover:bg-black/70 opacity-0 group-hover/image:opacity-100 transition-opacity"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </>
                                )}
                            </div>
                            {images.length > 1 && (
                                <div className="flex items-center gap-2 h-12 shrink-0 overflow-x-auto scrollbar-hide">
                                    {images.map((img, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setCurrentIndex(idx)}
                                            className={`relative w-10 h-10 rounded-sm overflow-hidden cursor-pointer transition-all ${idx === currentIndex ? 'opacity-100 ring-1 ring-foreground/50' : 'opacity-50 hover:opacity-80 border border-transparent'}`}
                                        >
                                            <Image src={img.url} alt="thumb" fill sizes="40px" className="object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center opacity-20">
                            <Box size={32} strokeWidth={1.5} />
                        </div>
                    )}
                </div>

                {/* RIGHT: Information Stream (50%) */}
                <div className="w-[50%] h-full p-8 flex flex-col min-w-0 bg-[#0A0D14]/90 backdrop-blur-md">

                    {/* Header: Premium with Asset ID badge */}
                    <div className="mb-6 shrink-0 relative pr-6">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Item ID</span>
                            {item.assetId && (
                                <Badge className="bg-[#D69E2E] hover:bg-[#D69E2E] text-[#2C1D06] text-[10px] font-extrabold px-2 py-0.5 rounded-md tracking-wider">
                                    {item.assetId}
                                </Badge>
                            )}
                        </div>
                        <DialogTitle className="text-2xl font-bold text-foreground tracking-tight leading-snug">
                            {item.name}
                        </DialogTitle>
                    </div>

                    {/* Content Section: Fully visible without scrollbar */}
                    <div className="flex-1 space-y-5 min-h-0 flex flex-col">
                        
                        {/* Two elegant glassmorphic cards side-by-side (Category & Condition) */}
                        <div className="flex gap-4">
                            {/* Category Card */}
                            <div className="flex-1 bg-[#131924] border border-foreground/[0.03] rounded-2xl p-4 flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                                    <Box size={18} strokeWidth={2} />
                                </div>
                                <div className="min-w-0">
                                    <span className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-0.5">Category</span>
                                    <span className="block text-[11px] font-extrabold text-slate-200 uppercase tracking-tight truncate max-w-[130px]" title={item.category}>
                                        {item.category}
                                    </span>
                                </div>
                            </div>

                            {/* Condition Card */}
                            <div className="flex-1 bg-[#131924] border border-foreground/[0.03] rounded-2xl p-4 flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                                    <ShieldCheck size={18} strokeWidth={2} />
                                </div>
                                <div>
                                    <span className="block text-[9px] uppercase font-bold tracking-widest text-slate-500 mb-0.5">Condition</span>
                                    <span className="block text-xs font-extrabold text-slate-200 uppercase tracking-tight">
                                        {item.condition?.replace('_', ' ') || 'Good'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Details Table */}
                        <div className="space-y-0.5">
                            {/* STATUS */}
                            <div className="flex items-center justify-between py-3 border-b border-foreground/[0.03]">
                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Status</span>
                                <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    item.status?.toLowerCase() === 'available' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    item.status?.toLowerCase() === 'in use' || item.status?.toLowerCase() === 'in_use' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    item.status?.toLowerCase() === 'maintenance' || item.status?.toLowerCase() === 'under repair' || item.status?.toLowerCase() === 'under_repair' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                    {item.status || 'Available'}
                                </Badge>
                            </div>

                            {/* SERIAL NO. */}
                            <div className="flex items-center justify-between py-3 border-b border-foreground/[0.03]">
                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Serial No.</span>
                                <span className="text-sm font-semibold text-slate-300 font-mono">
                                    {item.serialNumber || '-'}
                                </span>
                            </div>

                            {/* AVAILABILITY */}
                            <div className="flex items-center justify-between py-3 border-b border-foreground/[0.03]">
                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Availability</span>
                                <span className="text-sm font-semibold text-slate-300">
                                    {item.status?.toLowerCase() === 'in use' || item.status?.toLowerCase() === 'in_use' 
                                        ? `0 of ${item.quantity} Units Available` 
                                        : `${item.quantity} of ${item.quantity} Units Available`}
                                </span>
                            </div>

                            {/* LOCATION */}
                            <div className="flex items-center justify-between py-3 border-b border-foreground/[0.03]">
                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Location</span>
                                <span className="text-sm font-semibold text-slate-300 truncate max-w-[200px]" title={item.locationStr || ''}>
                                    {item.locationStr || '-'}
                                </span>
                            </div>

                            {/* PURCHASE AMOUNT (Admins / Managers only) */}
                            {['admin', 'manager'].includes(role || '') && (
                                <div className="flex items-center justify-between py-3 border-b border-foreground/[0.03]">
                                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Purchase Amount</span>
                                    <span className="text-sm font-semibold text-slate-300 tabular-nums">
                                        {item.purchasePrice ? `₹${item.purchasePrice.toLocaleString()}` : '-'}
                                    </span>
                                </div>
                            )}

                            {/* PURCHASE DATE (Admins / Managers only) */}
                            {['admin', 'manager'].includes(role || '') && (
                                <div className="flex items-center justify-between py-3 border-b border-foreground/[0.03]">
                                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Purchase Date</span>
                                    <span className="text-sm font-semibold text-slate-300 tabular-nums">
                                        {item.purchaseDate ? format(new Date(item.purchaseDate), 'dd-MM-yyyy') : '-'}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Description Section */}
                        <div>
                            <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">Description</span>
                            <p className="text-xs text-slate-400 font-normal leading-relaxed">
                                {item.description || 'No description provided.'}
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons Section (Fixed at bottom) */}
                    <div className="mt-auto shrink-0 pt-4 border-t border-foreground/5 space-y-3">
                        <div className="flex gap-4">
                            {onRequest && (
                                <Button
                                    onClick={() => onRequest(item)}
                                    className="w-1/2 py-6 rounded-xl bg-[#131924] border border-foreground/[0.05] hover:bg-[#1C2434] hover:border-foreground/10 text-foreground font-bold text-sm shadow-md transition-all duration-200"
                                >
                                    Request
                                </Button>
                            )}
                            {onBook && (
                                <Button
                                    onClick={() => onBook(item)}
                                    className="w-1/2 py-6 rounded-xl bg-[#D69E2E] hover:bg-[#B7791F] text-[#2C1D06] font-bold text-sm shadow-lg shadow-[#D69E2E]/15 transition-all duration-200"
                                >
                                    Book Now
                                </Button>
                            )}
                        </div>

                        {/* Admin Action Row */}
                        {['admin', 'manager'].includes(role || '') && (onEdit || onDelete) && (
                            <div className="flex gap-4">
                                {onEdit && (
                                    <Button
                                        onClick={() => onEdit(item)}
                                        className="w-1/2 py-5 rounded-xl bg-[#131924] border border-foreground/[0.05] hover:bg-[#1C2434] hover:border-foreground/10 text-slate-300 font-bold text-xs shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                        <Edit size={14} /> Edit Asset
                                    </Button>
                                )}
                                {onDelete && (
                                    <Button
                                        onClick={() => {
                                            if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
                                                onDelete(item);
                                            }
                                        }}
                                        className="w-1/2 py-5 rounded-xl bg-[#131924] border border-foreground/[0.05] hover:bg-[#1C2434]/50 hover:border-red-500/20 hover:text-red-400 text-slate-300 font-bold text-xs shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={14} /> Delete Asset
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

