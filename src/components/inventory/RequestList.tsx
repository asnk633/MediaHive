"use client";

import React, { useState, useEffect } from "react";
import { InventoryRequest } from "@/types/inventory";
import { inventoryRequestService } from "@/services/inventoryRequestService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, X, Clock, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IssueItemDialog } from "./IssueItemDialog";
import { inventoryService } from "@/services/inventoryService";
import { InventoryItem } from "@/types/inventory";

export default function RequestList() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<InventoryRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [issuingRequest, setIssuingRequest] = useState<InventoryRequest | null>(null);
    const [issuingItem, setIssuingItem] = useState<InventoryItem | null>(null);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            let data: InventoryRequest[] = [];
            if (isAdmin) {
                data = await inventoryRequestService.getAll();
            } else {
                data = await inventoryRequestService.getMyRequests(user.uid);
            }
            setRequests(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (req: InventoryRequest) => {
        try {
            await inventoryRequestService.approve(req.id, user!.uid);
            toast.success("Request approved");
            loadData();
        } catch (e) {
            console.error(e);
            toast.error("Failed to approve");
        }
    };

    const handleReject = async (req: InventoryRequest) => {
        // Simple prompt for now
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;

        try {
            await inventoryRequestService.reject(req.id, reason);
            toast.success("Request rejected");
            loadData();
        } catch (e) {
            console.error(e);
            toast.error("Failed to reject");
        }
    };

    const handleIssueClick = async (req: InventoryRequest) => {
        // Fetch the item details to pass to dialog
        try {
            const item = await inventoryService.getById(req.itemId);
            if (!item) {
                toast.error("Item not found (might be deleted)");
                return;
            }
            setIssuingItem(item);
            setIssuingRequest(req);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load item for issuing");
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-slate-900/50 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="space-y-2 w-full">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
                                <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                            </div>
                            <div className="h-5 w-1/3 bg-white/5 rounded animate-pulse" />
                            <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse" />
                        </div>
                        <div className="flex gap-2">
                            <div className="h-8 w-20 bg-white/5 rounded animate-pulse" />
                            <div className="h-8 w-20 bg-white/5 rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {requests.length === 0 && (
                <div className="text-center p-8 text-slate-500 bg-slate-900/50 rounded-xl border border-white/5">
                    No requests found.
                </div>
            )}

            {requests.map(req => (
                <div key={req.id} className="bg-slate-900/50 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:border-white/10 transition-colors">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <StatusBadge status={req.status} />
                            <span className="text-xs text-slate-500">{format(new Date(req.createdAt || Date.now()), 'MMM d, h:mm a')}</span>
                        </div>
                        <h4 className="font-semibold text-white">{req.itemName}</h4>
                        <p className="text-sm text-slate-400">"{req.purpose}"</p>
                        {isAdmin && (
                            <div className="text-xs text-slate-500 mt-1">Requested by: <span className="text-slate-300">{req.requestedBy}</span></div> // Replace with Name if possible (needs user map)
                        )}
                        {req.rejectionReason && <div className="text-xs text-red-400 mt-1">Reason: {req.rejectionReason}</div>}
                    </div>

                    <div className="flex items-center gap-2">
                        {isAdmin && req.status === 'pending' && (
                            <>
                                <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={() => handleReject(req)}>
                                    Reject
                                </Button>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white" onClick={() => handleApprove(req)}>
                                    Approve
                                </Button>
                            </>
                        )}

                        {isAdmin && req.status === 'approved' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-500 text-white gap-2" onClick={() => handleIssueClick(req)}>
                                <Package size={16} /> Issue
                            </Button>
                        )}
                    </div>
                </div>
            ))}

            {issuingRequest && issuingItem && (
                <IssueItemDialog
                    open={!!issuingRequest}
                    onOpenChange={(open) => {
                        if (!open) {
                            setIssuingRequest(null);
                            setIssuingItem(null);
                            loadData(); // Refresh to reflect potentially issued state (though issue doesn't change request status? Actually request stays 'approved'. Issue is separate. Maybe we should link them? Rules don't enforce it, but logical.)
                        }
                    }}
                    request={issuingRequest}
                    item={issuingItem}
                />
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: InventoryRequest['status'] }) {
    const styles = {
        pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        approved: "bg-green-500/10 text-green-400 border-green-500/20",
        rejected: "bg-red-500/10 text-red-400 border-red-500/20",
        issued: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${styles[status]}`}>
            {status}
        </span>
    );
}
