import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InventoryRequest } from '@/services/inventory/inventoryContract';
import { inventoryRequestService } from '@/services/inventory/inventoryRequestService';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useWorkspace } from '@/system/workspace/WorkspaceProvider';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2, Check, X, Clock, AlertCircle } from 'lucide-react';

export default function RequestList() {
    const { user } = useAuth();
    const { currentWorkspaceId } = useWorkspace();
    const [requests, setRequests] = useState<InventoryRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const isAdmin = user?.role === 'admin' || user?.role === 'manager';

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, currentWorkspaceId]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            let data: InventoryRequest[] = [];
            
            const isUUID = (str: any) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(str));

            // Priority: 1. Workspace ID (if it's a UUID), 2. User Profile Institution ID (Only for non-admins)
            let institutionId: string | null = null;
            
            if (currentWorkspaceId && isUUID(currentWorkspaceId)) {
                institutionId = String(currentWorkspaceId);
            } else if (user.role !== 'admin' && user.role !== 'manager') {
                // Non-admins/managers fallback to their profile institution to limit visibility
                if (user.institution_id && isUUID(user.institution_id)) {
                    institutionId = String(user.institution_id);
                }
            }
            
            // For Admins/Managers: If institutionId is null here, service will fetch ALL tenant requests
            // For Members/Guests: We still want to try filtering by their profile ID if available
            
            if (isAdmin) {
                console.log("[RequestList] Fetching ALL for admin, scoped to institution:", institutionId);
                data = await inventoryRequestService.getAll(institutionId || undefined);
            } else {
                console.log("[RequestList] Fetching MY requests, scoped to institution:", institutionId);
                data = await inventoryRequestService.getMyRequests(user.uid, institutionId || undefined);
            }

            setRequests(data);
        } catch (error: any) {
            console.error("[RequestList] Load failed:", {
                message: error.message,
                code: error.code,
                details: error.details,
                full: JSON.stringify(error, null, 2),
                error
            });
            toast.error(error.message || "Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id: string | number, action: 'approve' | 'reject') => {
        try {
            if (action === 'approve') {
                await inventoryRequestService.approve(id, user!.uid);
                toast.success("Request approved");
            } else {
                const reason = window.prompt("Reason for rejection:");
                if (reason === null) return;
                await inventoryRequestService.reject(id, reason);
                toast.success("Request rejected");
            }
            loadData();
        } catch (err) {
            toast.error("Action failed");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge variant="warning" className="bg-amber-500/10 text-amber-500 border-amber-500/20"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
            case 'approved': return <Badge variant="success" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><Check className="w-3 h-3 mr-1" /> Approved</Badge>;
            case 'rejected': return <Badge variant="danger" className="bg-red-500/10 text-red-500 border-red-500/20"><X className="w-3 h-3 mr-1" /> Rejected</Badge>;
            case 'issued': return <Badge variant="info" className="bg-blue-500/10 text-blue-400 border-blue-500/20">Issued</Badge>;
            default: return <Badge variant="neutral">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-foreground/60 gap-4">
                <AlertCircle className="w-12 h-12 opacity-20" />
                <p>No inventory requests found.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {requests.map((request) => (
                <Card key={request.id} className="bg-slate-900/50 border-foreground/5 hover:border-foreground/10 transition-all overflow-hidden group">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-foreground text-lg">{request.itemName}</h3>
                                    {getStatusBadge(request.status)}
                                </div>
                                <p className="text-sm text-foreground/60">
                                    Requested by: <span className="text-foreground font-medium">User {request.requestedBy}</span>
                                </p>
                                <div className="text-xs text-foreground/50 flex items-center gap-2 mt-2">
                                    <Clock className="w-3 h-3" />
                                    {request.createdAt ? format(new Date(request.createdAt), 'MMM d, h:mm a') : 'Unknown Date'}
                                </div>
                            </div>

                            {isAdmin && request.status === 'pending' && (
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                        onClick={() => handleAction(request.id, 'approve')}
                                    >
                                        Approve
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        onClick={() => handleAction(request.id, 'reject')}
                                    >
                                        Reject
                                    </Button>
                                </div>
                            )}
                        </div>

                        {(request.purpose || request.notes) && (
                            <div className="mt-4 p-3 bg-black/20 rounded-lg border border-foreground/5 text-sm text-foreground">
                                <span className="text-foreground/50 font-medium text-xs block mb-1 uppercase tracking-wider">Purpose:</span>
                                {request.purpose || request.notes}
                            </div>
                        )}

                        {request.status === 'rejected' && request.rejectReason && (
                            <div className="mt-2 p-3 bg-red-500/5 rounded-lg border border-red-500/10 text-sm text-red-400">
                                <span className="text-red-500/50 font-medium text-xs block mb-1 uppercase tracking-wider">Rejection Feedback:</span>
                                {request.rejectReason}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
