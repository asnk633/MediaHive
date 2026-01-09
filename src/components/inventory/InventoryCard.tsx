import React from 'react';
import Image from 'next/image';
import { InventoryItem, InventoryIssue } from '@/types/inventory';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Box, Layers, AlertCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface InventoryCardProps {
    item: InventoryItem;
    activeIssue?: InventoryIssue;
    hasPendingRequest?: boolean;
    role?: string;
    onRequest?: (item: InventoryItem) => void;
    onEdit?: (item: InventoryItem) => void;
    onReturn?: (item: InventoryItem) => void;
}

// Optimization: Prevent re-renders on grid filtering
export const InventoryCard = React.memo<InventoryCardProps>(({ item, activeIssue, hasPendingRequest, role, onRequest, onEdit, onReturn }) => {
    // Adaptive Status Logic
    const status = item.status;
    const isOk = status === 'ok' || status === 'available';
    const isLow = status === 'low';
    const isOut = status === 'out' || status === 'broken' || status === 'lost' || status === 'retired';
    const isInUse = status === 'in_use';

    // Overdue Logic
    const isOverdue = activeIssue && new Date() > new Date(activeIssue.expectedReturnAt) && activeIssue.status !== 'returned';

    // Permission Logic
    const canManage = role === 'admin' || role === 'team';

    return (
        <Card className={`group relative overflow-hidden bg-slate-900/40 border-white/5 transition-all duration-300 backdrop-blur-sm ${isOverdue ? 'border-red-500/50 shadow-lg shadow-red-900/20' : 'hover:border-blue-500/30'}`}>
            {/* Image / Thumbnail Placeholder */}
            <div className="aspect-video w-full bg-slate-950/50 relative flex items-center justify-center border-b border-white/5 group-hover:bg-slate-950/70 transition-colors overflow-hidden">
                {item.imageUrl ? (
                    <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <Box className="w-12 h-12 text-slate-700 group-hover:text-blue-500/50 transition-colors" />
                )}

                {/* Status Badge Over Image */}
                <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                    {isOk && <Badge className="bg-emerald-500/10 text-emerald-400 border-0 backdrop-blur-md">Available</Badge>}
                    {isLow && <Badge className="bg-amber-500/10 text-amber-400 border-0 backdrop-blur-md">Low Stock</Badge>}
                    {isOut && <Badge className="bg-red-500/10 text-red-400 border-0 backdrop-blur-md">Unavailable</Badge>}
                    {isInUse && !isOverdue && <Badge className="bg-blue-500/10 text-blue-400 border-0 backdrop-blur-md">In Use</Badge>}
                    {hasPendingRequest && <Badge className="bg-yellow-500/10 text-yellow-400 border-0 backdrop-blur-md">Requested</Badge>}
                    {isOverdue && <Badge className="bg-red-500/10 text-red-400 border-red-500/50 animate-pulse backdrop-blur-md">Overdue</Badge>}
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
                                <span className="text-slate-500 text-xs uppercase tracking-wider flex items-center gap-1">
                                    <Calendar size={10} /> Issued Until
                                </span>
                                <div className={`font-mono ${isOverdue ? 'text-red-400 font-bold' : 'text-slate-200'}`}>
                                    {format(new Date(activeIssue.expectedReturnAt), 'MMM d, yyyy')}
                                </div>
                                <div className="text-xs text-slate-500 truncate">
                                    To: <span className="text-slate-400">{activeIssue.issuedToUserId}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-1">
                                <span className="text-slate-500 text-xs uppercase tracking-wider">Quantity</span>
                                <div className="text-slate-200 font-mono">
                                    {item.quantity} <span className="text-xs text-slate-500">{item.unit}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-slate-500 text-xs uppercase tracking-wider">Condition</span>
                                <div className="text-slate-200 font-mono capitalize">{item.condition || 'N/A'}</div>
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
                                className={`flex-1 text-white shadow-lg ${hasPendingRequest ? 'bg-slate-700/50 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'}`}
                                disabled={isOut || isInUse || hasPendingRequest}
                                onClick={() => onRequest(item)}
                            >
                                {hasPendingRequest ? 'Pending' : 'Request'}
                            </Button>
                        )
                    )}
                </div>
            </div>
        </Card>
    );
});
