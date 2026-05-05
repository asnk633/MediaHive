import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { EquipmentItem, InventoryIssueClean } from '@/services/inventory/inventoryContract';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Box, Layers, AlertCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { getDriveImageUrl } from '@/lib/driveUtils';
import { cn } from '@/lib/utils';

interface InventoryCardProps {
    item: EquipmentItem;
    activeIssue?: InventoryIssueClean;
    hasPendingRequest?: boolean;
    role?: string;
    onRequest?: (item: EquipmentItem) => void;
    onEdit?: (item: EquipmentItem) => void;
    onReturn?: (item: EquipmentItem) => void;
    onBook?: (item: EquipmentItem) => void;
    onView?: (item: EquipmentItem) => void;
}

export const InventoryCard = React.memo<InventoryCardProps>(({ 
    item, 
    activeIssue, 
    hasPendingRequest, 
    role, 
    onRequest, 
    onEdit, 
    onReturn, 
    onBook, 
    onView 
}) => {
    // Adaptive Status Logic
    const status = item.status;
    const isOk = status === 'ok' || status === 'available';
    const isLow = status === 'low';
    const isOut = status === 'out' || status === 'broken' || status === 'lost' || status === 'retired';
    const isInUse = status === 'in_use';

    // Overdue Logic
    const isOverdue = activeIssue && new Date() > new Date(activeIssue.expectedReturnAt) && activeIssue.status !== 'returned';

    // Permission Logic
    const canManage = role === 'admin' || (role === 'manager' || role === 'member');

    // Consolidate images for display
    const images = (item as any).images && (item as any).images.length > 0
        ? (item as any).images.map((img: any) => ({ ...img, url: getDriveImageUrl(img.url, img.file_id) }))
        : ((item as any).imageUrl || (item as any).driveFileId) 
            ? [{ url: getDriveImageUrl((item as any).imageUrl, (item as any).driveFileId), file_id: (item as any).driveFileId || '' }] 
            : [];

    return (
        <Link
            href={`/inventory/${item.id}`}
            className={cn(
                "group relative overflow-hidden bg-glass border border-white/10 rounded-xl transition-all duration-300 backdrop-blur-md cursor-pointer block",
                isOverdue ? 'border-destructive/50 shadow-lg shadow-destructive/20' : 'hover:border-primary/30 hover:shadow-md'
            )}
        >
            {/* Image / Thumbnail Placeholder */}
            <div className="aspect-video w-full bg-surface/50 relative flex items-center justify-center border-b border-soft group-hover:bg-surface/80 transition-colors overflow-hidden"
                onClick={(e) => {
                    // Check if carousel arrow was clicked, if so, stop propagation? 
                    // Actually, carousel arrows usually sit on top. 
                    // We want card click to View. Carousel swipe/nav to just change image.
                    // Embla usually handles its own events.
                }}
            >
                {images.length > 0 ? (
                    images.length === 1 ? (
                        <Image
                            src={images[0].url}
                            alt={item.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (

                        <Carousel
                            className="w-full h-full [&_[data-slot=carousel-content]]:h-full"
                            opts={{ loop: true }}
                        >
                            <CarouselContent className="h-full ml-0">
                                {images.map((img: any, idx: number) => (
                                    <CarouselItem key={idx} className="pl-0 h-full relative">
                                        <Image
                                            src={img.url}
                                            alt={`${item.name} ${idx}`}
                                            fill
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                            className="object-cover"
                                        />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <div onClick={(e) => e.stopPropagation()}>
                                <CarouselPrevious
                                    className="left-2 bg-black/50 border-white/10 opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary"
                                    aria-label="Previous image"
                                />
                                <CarouselNext
                                    className="right-2 bg-black/50 border-white/10 opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary"
                                    aria-label="Next image"
                                />
                            </div>

                            {/* Pagination Dots Indicator */}
                            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                                {images.map((_: any, i: number) => (
                                    <div key={i} className="w-1 h-1 rounded-full bg-white/40 shadow-sm" />
                                ))}
                            </div>
                        </Carousel>
                    )
                ) : (
                    <Box className="w-12 h-12 text-slate-700 group-hover:text-blue-500/50 transition-colors" />
                )}

                {/* Status Badge Over Image */}
                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end pointer-events-none z-10">
                    {isOk && <Badge className="bg-emerald-500/10 text-emerald-400 border-0 backdrop-blur-md">Available</Badge>}
                    {isLow && <Badge className="bg-amber-500/10 text-amber-400 border-0 backdrop-blur-md">Low Stock</Badge>}
                    {isOut && <Badge className="bg-red-500/10 text-red-400 border-0 backdrop-blur-md">Unavailable</Badge>}
                    {isInUse && !isOverdue && <Badge className="bg-blue-500/10 text-blue-400 border-0 backdrop-blur-md">In Use</Badge>}
                    {hasPendingRequest && <Badge className="bg-yellow-500/10 text-yellow-400 border-0 backdrop-blur-md">Requested</Badge>}
                    {isOverdue && <Badge className="bg-red-500/10 text-red-400 border-red-500/50 animate-pulse backdrop-blur-md">Overdue</Badge>}
                    {item.isRentable && <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 backdrop-blur-md">Rentable</Badge>}
                </div>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-4">
                <div>
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-lg text-white truncate pr-2" title={item.name}>
                            {item.name}
                        </h3>
                    </div>
                    <p className="text-sm text-slate-400 flex items-center gap-2">
                        <Layers size={14} />
                        {item.category}
                    </p>
                </div>

                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-2 text-sm bg-slate-950/30 p-3 rounded-lg border border-white/5">
                    {activeIssue ? (
                        <>
                            <div className="space-y-1 col-span-2">
                                <span className="text-slate-400 text-xs uppercase tracking-wider flex items-center gap-1">
                                    <Calendar size={10} /> Issued Until
                                </span>
                                <div className={`font-medium ${isOverdue ? 'text-red-400 font-bold' : 'text-slate-200'}`}>
                                    {format(new Date(activeIssue.expectedReturnAt), 'MMM d, yyyy')}
                                </div>
                                <div className="text-xs text-slate-400 truncate">
                                    To: <span className="text-slate-300">{activeIssue.issuedToUserId}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-1">
                                <span className="text-slate-400 text-xs uppercase tracking-wider">Unit</span>
                                <div className="text-slate-200 font-medium">
                                    {item.quantity}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-slate-400 text-xs uppercase tracking-wider">Condition</span>
                                <div className="text-slate-200 font-medium capitalize">{item.condition?.replace('_', ' ') || 'N/A'}</div>
                            </div>

                            {/* Price & Date Row */}
                            <div className="col-span-2 grid grid-cols-2 gap-2 pt-2 mt-2 border-t border-white/5">
                                <div className="space-y-1">
                                    <span className="text-slate-400 text-[10px] uppercase tracking-wider">Purchased</span>
                                    <div className="text-slate-300 text-xs">
                                        {item.purchaseDate ? format(new Date(item.purchaseDate), 'MMM d, yyyy') : '-'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-slate-400 text-[10px] uppercase tracking-wider">Purchased Price</span>
                                    <div className="text-slate-300 text-xs">
                                        {item.purchasePrice ? `₹${item.purchasePrice.toLocaleString()}` : '-'}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-3">
                    {/* Admin Actions */}
                    {role === 'admin' && onEdit && (
                        <Button
                            variant="outline"
                            className="flex-1 border-[#ffffff1a] text-slate-300 hover:text-white hover:bg-white/5"
                            onClick={() => onEdit(item)}
                        >
                            Edit
                        </Button>
                    )}

                    {/* Return Action (Admin/Team on In-Use items) */}
                    {canManage && isInUse && onReturn ? (
                        <Button
                            className={`flex-1 text-white shadow-lg ${isOverdue ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20' : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/20'}`}
                            onClick={() => onReturn(item)}
                        >
                            {isOverdue ? 'Return Overdue' : 'Return'}
                        </Button>
                    ) : (
                        /* Request Action (Default) */
                        onRequest && (
                            <Button
                                className={`flex-1 text-white shadow-lg h-11 sm:h-10 ${hasPendingRequest ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'}`}
                                disabled={isOut || isInUse || hasPendingRequest}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRequest(item);
                                }}
                            >
                                {hasPendingRequest ? 'Pending' : 'Request'}
                            </Button>
                        )
                    )}

                    {/* Book Action (For Assets/Equipment) */}
                    {onBook && isOk && (
                        <Button
                            variant="outline"
                            className="bg-blue-600 hover:bg-blue-500 text-white border-transparent"
                            onClick={(e) => {
                                e.stopPropagation();
                                onBook(item);
                            }}
                        >
                            Book
                        </Button>
                    )}
                </div>
            </div>
        </Link>
    );
});
