import React from 'react';
import { InventoryItem } from '@/types/inventory';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Box, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';

interface InventoryCardProps {
    item: InventoryItem;
    role?: string;
    onRequest?: (item: InventoryItem) => void;
    onEdit?: (item: InventoryItem) => void;
}

export const InventoryCard: React.FC<InventoryCardProps> = ({ item, role, onRequest, onEdit }) => {
    // Adaptive Status Logic
    const isAvailable = item.status === 'ok';
    const isLow = item.status === 'low';
    const isOut = item.status === 'out';

    return (
        <Card className="group relative overflow-hidden bg-slate-900/40 border-white/5 hover:border-blue-500/30 transition-all duration-300 backdrop-blur-sm">
            {/* Image / Thumbnail Placeholder */}
            <div className="aspect-video w-full bg-slate-950/50 relative flex items-center justify-center border-b border-white/5 group-hover:bg-slate-950/70 transition-colors">
                {/* Future: Real Image Support */}
                <Box className="w-12 h-12 text-slate-700 group-hover:text-blue-500/50 transition-colors" />

                {/* Status Badge Over Image */}
                <div className="absolute top-3 right-3">
                    {isAvailable && <Badge className="bg-emerald-500/10 text-emerald-400 border-0 backdrop-blur-md">Available</Badge>}
                    {isLow && <Badge className="bg-amber-500/10 text-amber-400 border-0 backdrop-blur-md">Low Stock</Badge>}
                    {isOut && <Badge className="bg-red-500/10 text-red-400 border-0 backdrop-blur-md">Out of Stock</Badge>}
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
                    <div className="space-y-1">
                        <span className="text-slate-500 text-xs uppercase tracking-wider">Quantity</span>
                        <div className="text-slate-200 font-mono">
                            {item.quantity} <span className="text-xs text-slate-500">{item.unit}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-slate-500 text-xs uppercase tracking-wider">Threshold</span>
                        <div className="text-slate-200 font-mono">{item.threshold}</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-3">
                    {/* Admin Actions */}
                    {role === 'admin' && onEdit && (
                        <Button
                            variant="outline"
                            className="flex-1 border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
                            onClick={() => onEdit(item)}
                        >
                            Edit
                        </Button>
                    )}

                    {/* Request Action (All Roles except if out of stock?) */}
                    {onRequest && (
                        <Button
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
                            disabled={isOut}
                            onClick={() => onRequest(item)}
                        >
                            Request
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
};
