import React from 'react';
import { EquipmentItem, InventoryIssueClean } from '@/services/inventory/inventoryContract';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Edit2, 
    Eye, 
    MoreVertical, 
    Package, 
    AlertCircle, 
    Calendar,
    ChevronRight,
    ArrowUpRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Trash2 } from 'lucide-react';

interface InventoryListProps {
    items: EquipmentItem[];
    activeIssues?: InventoryIssueClean[];
    pendingRequestItemIds?: Set<string | number>;
    loading?: boolean;
    role?: string;
    onRequest?: (item: EquipmentItem) => void;
    onEdit?: (item: EquipmentItem) => void;
    onReturn?: (item: EquipmentItem) => void;
    onBook?: (item: EquipmentItem) => void;
    onView?: (item: EquipmentItem) => void;
    onDelete?: (item: EquipmentItem) => void;
}

export const InventoryList: React.FC<InventoryListProps> = ({
    items,
    activeIssues = [],
    pendingRequestItemIds,
    loading,
    role,
    onRequest,
    onEdit,
    onReturn,
    onBook,
    onView,
    onDelete
}) => {
    // Optimization: Create map for O(1) access
    const issueMap = React.useMemo(() => {
        const map = new Map<string | number, InventoryIssueClean>();
        activeIssues.forEach(issue => map.set(issue.itemId, issue));
        return map;
    }, [activeIssues]);

    if (loading) {
        return (
            <div className="rounded-xl border border-foreground/5 bg-slate-900/20 overflow-hidden">
                <Table>
                    <TableHeader className="bg-foreground/5">
                        <TableRow className="border-foreground/5 hover:bg-transparent">
                            <TableHead className="w-[300px]">Item</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Condition</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 10 }).map((_, i) => (
                            <TableRow key={i} className="border-foreground/5">
                                <TableCell><div className="h-4 w-40 bg-foreground/5 animate-pulse rounded" /></TableCell>
                                <TableCell><div className="h-4 w-24 bg-foreground/5 animate-pulse rounded" /></TableCell>
                                <TableCell><div className="h-6 w-20 bg-foreground/5 animate-pulse rounded-full" /></TableCell>
                                <TableCell><div className="h-4 w-16 bg-foreground/5 animate-pulse rounded" /></TableCell>
                                <TableCell className="text-right"><div className="h-8 w-8 bg-foreground/5 animate-pulse rounded ml-auto" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-glass backdrop-blur-sm border border-foreground/5">
                <Package className="text-foreground/70 mb-4" size={48} />
                <h3 className="text-xl font-bold text-foreground/70 mb-2">No items found</h3>
                <p className="text-slate-400 max-w-sm text-sm">
                    Try adjusting your filters or search terms.
                </p>
            </div>
        );
    }

    const canManage = role === 'admin' || role === 'manager' || role === 'team';

    return (
        <div className="rounded-xl border border-foreground/10 bg-card backdrop-blur-md overflow-hidden animate-in fade-in duration-500">
            <Table>
                <TableHeader className="bg-foreground/[0.03]">
                    <TableRow className="border-foreground/10 hover:bg-transparent">
                        <TableHead className="text-slate-400 font-bold uppercase tracking-widest text-[10px] h-12">Asset Name</TableHead>
                        <TableHead className="text-slate-400 font-bold uppercase tracking-widest text-[10px] h-12">Category</TableHead>
                        <TableHead className="text-slate-400 font-bold uppercase tracking-widest text-[10px] h-12">Availability</TableHead>
                        <TableHead className="text-slate-400 font-bold uppercase tracking-widest text-[10px] h-12 hidden md:table-cell">Condition</TableHead>
                        <TableHead className="text-slate-400 font-bold uppercase tracking-widest text-[10px] h-12 hidden lg:table-cell">Quantity</TableHead>
                        <TableHead className="text-right text-slate-400 font-bold uppercase tracking-widest text-[10px] h-12">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => {
                        const activeIssue = issueMap.get(item.id);
                        const hasPendingRequest = pendingRequestItemIds?.has(item.id);
                        const status = item.status;
                        
                        const isOk = status === 'ok' || status === 'available';
                        const isLow = status === 'low';
                        const isOut = status === 'out' || status === 'broken' || status === 'lost' || status === 'retired';
                        const isInUse = status === 'in_use';
                        const isOverdue = activeIssue && new Date() > new Date(activeIssue.expectedReturnAt) && activeIssue.status !== 'returned';

                        return (
                            <TableRow 
                                key={item.id} 
                                className="border-foreground/5 hover:bg-foreground/[0.02] group transition-colors cursor-pointer"
                                onClick={() => onView?.(item)}
                            >
                                <TableCell className="py-4">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-foreground group-hover:text-blue-400 transition-colors">
                                            {item.name}
                                        </span>
                                        {item.serialNumber && (
                                            <span className="text-[10px] text-slate-500 font-mono">SN: {item.serialNumber}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="neutral" className="bg-foreground/5 border-foreground/10 text-slate-400 font-normal">
                                        {item.category}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {isOk && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                        {isLow && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                                        {isOut && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                                        {isInUse && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                        
                                        <span className={cn(
                                            "text-xs font-medium",
                                            isOk ? "text-emerald-400" :
                                            isLow ? "text-amber-400" :
                                            isOut ? "text-red-400" :
                                            isInUse ? "text-blue-400" : "text-slate-400"
                                        )}>
                                            {isOk ? 'Available' : 
                                             isLow ? 'Low Stock' : 
                                             isOut ? 'Unavailable' : 
                                             isInUse ? (isOverdue ? 'Overdue' : 'In Use') : 'Unknown'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <span className="text-xs text-slate-300 capitalize">
                                        {item.condition?.replace('_', ' ') || 'N/A'}
                                    </span>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                    <span className="text-xs text-slate-300">
                                        {item.quantity} units
                                    </span>
                                </TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-2">
                                        {/* Quick Actions based on status */}
                                        {isOk && onBook && (
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                                onClick={() => onBook(item)}
                                                title="Book Item"
                                            >
                                                <Calendar size={14} />
                                            </Button>
                                        )}

                                        {isInUse && canManage && onReturn && (
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className={cn(
                                                    "h-8 w-8 p-0",
                                                    isOverdue ? "text-red-400 hover:bg-red-500/10" : "text-purple-400 hover:bg-purple-500/10"
                                                )}
                                                onClick={() => onReturn(item)}
                                                title="Return Item"
                                            >
                                                <ArrowUpRight size={14} />
                                            </Button>
                                        )}

                                        {!isInUse && !isOut && onRequest && (
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className={cn(
                                                    "h-8 w-8 p-0",
                                                    hasPendingRequest ? "text-slate-500" : "text-emerald-400 hover:bg-emerald-500/10"
                                                )}
                                                disabled={hasPendingRequest}
                                                onClick={() => onRequest(item)}
                                                title={hasPendingRequest ? "Request Pending" : "Request Item"}
                                            >
                                                <ChevronRight size={14} />
                                            </Button>
                                        )}

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-foreground hover:bg-foreground/10">
                                                    <MoreVertical size={14} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40 bg-popover border-foreground/10 text-foreground">
                                                <DropdownMenuItem onClick={() => onView?.(item)} className="focus:bg-foreground/5 cursor-pointer">
                                                    <Eye size={14} className="mr-2" /> View Details
                                                </DropdownMenuItem>
                                                {canManage && onEdit && (
                                                    <DropdownMenuItem onClick={() => onEdit(item)} className="focus:bg-foreground/5 cursor-pointer">
                                                        <Edit2 size={14} className="mr-2" /> Edit Asset
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator className="bg-foreground/5" />
                                                {isOk && onBook && (
                                                    <DropdownMenuItem onClick={() => onBook(item)} className="focus:bg-foreground/5 cursor-pointer text-blue-400">
                                                        <Calendar size={14} className="mr-2" /> Book Schedule
                                                    </DropdownMenuItem>
                                                )}
                                                {canManage && onDelete && (
                                                    <DropdownMenuItem 
                                                        onClick={() => {
                                                            if (window.confirm(`Are you sure you want to delete ${item.name}?`)) {
                                                                onDelete(item);
                                                            }
                                                        }} 
                                                        className="focus:bg-red-500/10 cursor-pointer text-red-500"
                                                    >
                                                        <Trash2 size={14} className="mr-2" /> Delete Asset
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};
