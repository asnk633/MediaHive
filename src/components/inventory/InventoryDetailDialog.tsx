import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EquipmentItem } from '@/services/inventory/inventoryContract';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Edit, Calendar, Box, Tag, MapPin, Hash, DollarSign, Info, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

interface InventoryDetailDialogProps {
    item: EquipmentItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit?: (item: EquipmentItem) => void;
    onRequest?: (item: EquipmentItem) => void;
    onBook?: (item: EquipmentItem) => void;
    role?: string;
}

export const InventoryDetailDialog: React.FC<InventoryDetailDialogProps> = ({
    item,
    open,
    onOpenChange,
    onEdit,
    onRequest,
    onBook,
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
            <DialogContent className="max-w-[1000px] w-[95vw] h-[600px] p-0 gap-0 bg-[#0F1218] border border-white/5 overflow-hidden flex flex-row focus:outline-none shadow-2xl rounded-lg font-sans text-slate-400">

                {/* LEFT: Visually blended inspection area (50%) */}
                <div className="w-[50%] h-full p-8 flex flex-col relative">
                    {images.length > 0 ? (
                        <>
                            <div className="flex-1 relative mb-4 min-h-0 group/image">
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
                                            className="absolute left-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 opacity-0 group-hover/image:opacity-100 transition-opacity"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 opacity-0 group-hover/image:opacity-100 transition-opacity"
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
                                            className={`relative w-10 h-10 rounded-sm overflow-hidden cursor-pointer transition-all ${idx === currentIndex ? 'opacity-100 ring-1 ring-white/50' : 'opacity-50 hover:opacity-80 border border-transparent'}`}
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
                <div className="w-[50%] h-full p-8 pl-0 flex flex-col min-w-0">

                    {/* Header: Zero drama */}
                    <div className="mb-6 shrink-0">
                        <div className="flex items-center gap-2 text-xs mb-1.5 opacity-60">
                            <span>{item.category}</span>
                        </div>
                        <DialogTitle className="text-lg font-medium text-slate-200 leading-snug">
                            {item.name}
                        </DialogTitle>
                    </div>

                    {/* Data Grid: Efficient, Boring, Readable */}
                    <div className="grid grid-cols-2 gap-y-5 gap-x-4 text-sm mb-8 overflow-y-auto min-h-0 pr-2 scrollbar-thin scrollbar-thumb-white/5">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] text-slate-500">Condition</span>
                            <span className="text-slate-300 capitalize">{item.condition?.replace('_', ' ') || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] text-slate-500">Unit</span>
                            <span className="text-slate-300">{item.quantity}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] text-slate-500">Purchased Price</span>
                            <span className="text-slate-300 tabular-nums">{item.purchasePrice ? `₹${item.purchasePrice.toLocaleString()}` : '-'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] text-slate-500">Purchased</span>
                            <span className="text-slate-300 tabular-nums">{item.purchaseDate ? format(new Date(item.purchaseDate), 'MMM d, yyyy') : '-'}</span>
                        </div>

                        {(item.brand || item.model) && (
                            <div className="col-span-2 flex flex-col gap-0.5 pt-1">
                                <span className="text-[11px] text-slate-500">Model Details</span>
                                <span className="text-slate-300">{item.brand} {item.model}</span>
                            </div>
                        )}

                        {(item.serialNumber || item.locationStr) && (
                            <div className="col-span-2 grid grid-cols-2 gap-x-4 gap-y-5 pt-1">
                                {item.serialNumber && (
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[11px] text-slate-500">Serial</span>
                                        <span className="text-slate-300 font-mono text-xs">{item.serialNumber}</span>
                                    </div>
                                )}
                                {item.locationStr && (
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[11px] text-slate-500">Location</span>
                                        <span className="text-slate-300 truncate" title={item.locationStr}>{item.locationStr}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {item.isRentable && (
                            <div className="col-span-2 pt-4 mt-2 border-t border-white/5">
                                <span className="text-[11px] text-blue-400 font-bold uppercase tracking-wider">Rental Information</span>
                                <div className="flex items-center justify-between mt-1 text-slate-200">
                                    <span>Rate per day</span>
                                    <span className="font-bold">₹{(item.rentalRatePerDay || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer: Just buttons in the flow */}
                    <div className="mt-auto flex items-center justify-end gap-3 shrink-0 pt-4">
                        {role === 'admin' && onEdit && (
                            <Button
                                variant="ghost"
                                onClick={() => onEdit(item)}
                                className="h-8 px-3 text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 font-normal"
                            >
                                Edit Props
                            </Button>
                        )}
                        {onRequest && (
                            <Button
                                onClick={() => onRequest(item)}
                                className="h-9 px-5 border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium rounded shadow-sm transition-colors"
                            >
                                Request Item
                            </Button>
                        )}
                        {onBook && (
                            <Button
                                onClick={() => onBook(item)}
                                className="h-9 px-5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded shadow-sm border border-transparent transition-colors"
                            >
                                Book Now
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
