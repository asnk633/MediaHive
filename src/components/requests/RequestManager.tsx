"use client";

import React, { useState, useEffect } from "react";
import { DeviceRequest } from "@/types/deviceRequest";
import { deviceRequestService } from "@/services/deviceRequestService";
import { inventoryService } from "@/services/inventoryService";
import { InventoryItem, InventoryCondition } from "@/types/inventory";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { Check, X, Package, ArrowRight, CornerDownLeft, AlertTriangle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function RequestManager() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<DeviceRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // If admin, load all. If team/guest, load own.
            // Currently service has separate methods, but let's just use getAll for admin.
            // Wait, standard users shouldn't see ALL.
            let data: DeviceRequest[] = [];
            if (user.role === 'admin') {
                data = await deviceRequestService.getAllRequests();
            } else {
                data = await deviceRequestService.getUserRequests(user.uid);
            }
            setRequests(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load requests.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading requests...</div>;

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const activeRequests = requests.filter(r => ['approved', 'issued', 'waiting_inspection'].includes(r.status));
    const historyRequests = requests.filter(r => ['returned', 'rejected', 'cancelled'].includes(r.status));

    return (
        <div className="space-y-8">
            <section>
                <h3 className="text-lg font-semibold text-white mb-4 border-b border-white/10 pb-2">Active & Pending</h3>
                <div className="space-y-4">
                    {pendingRequests.length === 0 && activeRequests.length === 0 && (
                        <div className="text-slate-500 italic">No active requests.</div>
                    )}

                    {/* Pending */}
                    {pendingRequests.map(req => (
                        <RequestCard key={req.id} request={req} isAdmin={user?.role === 'admin'} onRefresh={loadData} />
                    ))}

                    {/* Active */}
                    {activeRequests.map(req => (
                        <RequestCard key={req.id} request={req} isAdmin={user?.role === 'admin'} onRefresh={loadData} />
                    ))}
                </div>
            </section>

            <section>
                <h3 className="text-lg font-semibold text-white mb-4 border-b border-white/10 pb-2">History</h3>
                <div className="space-y-4 opacity-75">
                    {historyRequests.length === 0 && (
                        <div className="text-slate-500 italic">No history.</div>
                    )}
                    {historyRequests.map(req => (
                        <RequestCard key={req.id} request={req} isAdmin={user?.role === 'admin'} onRefresh={loadData} />
                    ))}
                </div>
            </section>
        </div>
    );
}

function RequestCard({ request, isAdmin, onRefresh }: { request: DeviceRequest, isAdmin: boolean, onRefresh: () => void }) {
    const { user } = useAuth();

    // Status Colors
    const statusColors: Record<string, string> = {
        pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
        approved: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        issued: "bg-green-500/20 text-green-300 border-green-500/30",
        returned: "bg-slate-700/50 text-slate-400 border-slate-600/50",
        rejected: "bg-red-500/20 text-red-300 border-red-500/30",
        cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
        waiting_inspection: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    };

    const handleAction = async (action: 'approve' | 'reject' | 'issue' | 'return' | 'mark_returned', payload?: any) => {
        try {
            if (action === 'approve') {
                await deviceRequestService.updateRequest(request.id, { status: 'approved' });
                toast.success("Request approved.");
            } else if (action === 'reject') {
                await deviceRequestService.updateRequest(request.id, { status: 'rejected' });
                toast.success("Request rejected.");
            } else if (action === 'issue') {
                // Payload should contain itemId and condition
                if (!payload?.itemId) { toast.error("Select an item to issue."); return; }
                await deviceRequestService.issueItem(request.id, payload.itemId, user!.uid, 'good'); // Assuming good condition on issue for now, or add selector
                toast.success("Item issued successfully.");
            } else if (action === 'return') {
                // Payload: condition, notes, logId
                if (!payload?.condition) { toast.error("Select return condition."); return; }

                // We need active Log ID.
                const logId = await deviceRequestService.getActiveLogId(request.id);
                if (!logId) { toast.error("Active log not found for this request."); return; }

                await deviceRequestService.returnItemWithLogId(request.id, logId, user!.uid, payload.condition, payload.notes);
                toast.success("Item returned.");
            } else if (action === 'mark_returned') {
                await deviceRequestService.updateRequest(request.id, { status: 'waiting_inspection' });
                toast.success("Marked as returned. Admin notified.");
            }
            onRefresh();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Action failed.");
        }
    };

    const [showIssueDialog, setShowIssueDialog] = useState(false);

    const handleIssueClick = () => {
        setShowIssueDialog(true);
    };

    const getSafeDate = (dateVal: any) => {
        if (!dateVal) return new Date();
        if (dateVal.toDate) return dateVal.toDate(); // Firestore Timestamp
        if (typeof dateVal === 'object' && 'seconds' in dateVal) return new Date(dateVal.seconds * 1000); // Serialized Timestamp
        return new Date(dateVal); // String or Number
    };

    const start = getSafeDate(request.startDate);
    const end = getSafeDate(request.endDate);

    return (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${statusColors[request.status] || 'bg-slate-800'}`}>
                        {request.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">
                        {format(start, 'MMM d, h:mm a')} - {format(end, 'MMM d, h:mm a')}
                    </span>
                </div>
                <h4 className="font-semibold text-white text-lg">{request.description}</h4>
                <div className="flex gap-2 items-center mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
                        {request.itemCategory}
                    </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                    <span className="font-medium text-slate-300">{request.requester.name}</span>
                    {request.assignedItemName && (
                        <>
                            <ArrowRight size={12} />
                            <span className="text-blue-300 font-mono">{request.assignedItemName}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                {isAdmin ? (
                    <>
                        {(request.status === 'pending' || request.status === 'approved') && (
                            <>
                                {request.status === 'pending' && (
                                    <>
                                        <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10 hover:text-red-300" onClick={() => handleAction('reject')}>Reject</Button>
                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white" onClick={() => handleAction('approve')}>Approve</Button>
                                        <div className="h-4 w-px bg-white/10 mx-1" />
                                    </>
                                )}
                                <Button size="sm" className="bg-green-600 hover:bg-green-500 text-white gap-2" onClick={handleIssueClick}>
                                    <Package size={16} /> Issue Now
                                </Button>

                                <IssueDialog
                                    open={showIssueDialog}
                                    onOpenChange={setShowIssueDialog}
                                    request={request}
                                    onIssue={(itemId) => {
                                        handleAction('issue', { itemId });
                                        setShowIssueDialog(false);
                                    }}
                                />
                            </>
                        )}

                        {(request.status === 'issued' || request.status === 'waiting_inspection') && (
                            <ReturnDialog request={request} onReturn={(condition, notes) => handleAction('return', { condition, notes })} />
                        )}
                    </>
                ) : (
                    // Guest / Standard User Actions
                    <>
                        {request.status === 'issued' && (
                            <Button size="sm" variant="outline" className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10" onClick={() => handleAction('mark_returned')}>
                                <CornerDownLeft size={16} className="mr-2" />
                                Mark Returned
                            </Button>
                        )}
                        {request.status === 'waiting_inspection' && (
                            <div className="text-xs text-purple-300/80 italic px-2">Waiting Inspection</div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// Dialogs

function IssueDialog({ request, onIssue, open, onOpenChange }: { request: DeviceRequest, onIssue: (itemId: string) => void, open: boolean, onOpenChange: (open: boolean) => void }) {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [selectedId, setSelectedId] = useState("");

    // Derived state
    const isDirectIssue = !!request.assignedItemId;

    useEffect(() => {
        if (!open) return;

        if (isDirectIssue) {
            setSelectedId(request.assignedItemId!);
            return;
        }

        // Load available items
        const load = async () => {
            try {
                const all = await inventoryService.getAll();
                const avail = all.filter(i => i.status === 'available' || !i.status);
                setItems(avail);

                // Auto-fallback: Try to match by name exactly
                if (request.description) {
                    const match = avail.find(i => i.name.toLowerCase() === request.description?.toLowerCase());
                    if (match) setSelectedId(match.id);
                }
            } catch (e) {
                console.error(e);
            }
        };
        load();
    }, [request, open, isDirectIssue]);

    const filteredItems = items.filter(i =>
        i.category.toLowerCase().includes(request.itemCategory.toLowerCase()) ||
        request.itemCategory.toLowerCase().includes(i.category.toLowerCase()) ||
        request.itemCategory === "Other"
    );
    // Fallback to all if no match
    const displayItems = filteredItems.length > 0 ? filteredItems : items;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-white/10">
                <DialogHeader>
                    <DialogTitle>Issue Equipment</DialogTitle>
                </DialogHeader>

                {isDirectIssue ? (
                    <div className="space-y-4 my-4">
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                            <Package className="mx-auto text-green-400 mb-2" size={32} />
                            <h3 className="text-white font-semibold text-lg">Ready to Issue</h3>
                            <p className="text-slate-300 mt-1">
                                Confirm handing over <span className="font-bold text-white">{request.description}</span>?
                            </p>
                            <div className="text-xs text-slate-500 mt-2">Asset Link Pre-Verified ({request.assignedItemName || 'Linked'})</div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 my-4">
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-200">
                            Requesting: <span className="font-bold text-white">{request.description}</span>
                            <div className="text-xs text-blue-300/70 mt-1">Category: {request.itemCategory}</div>
                        </div>
                        <div className="space-y-2">
                            <Label>Select Asset to Link</Label>
                            <Select onValueChange={setSelectedId} value={selectedId}>
                                <SelectTrigger className="bg-slate-800 border-white/10">
                                    <SelectValue placeholder="Select available item..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {displayItems.map(item => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {item.name} ({item.serialNumber || 'No Serial'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button onClick={() => { onIssue(selectedId); }} disabled={!selectedId} className="w-full sm:w-auto bg-green-600 hover:bg-green-500">
                        {isDirectIssue ? 'Confirm & Issue' : 'Confirm Issue'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ReturnDialog({ request, onReturn }: { request: DeviceRequest, onReturn: (condition: InventoryCondition, notes: string) => void }) {
    const [condition, setCondition] = useState<InventoryCondition>("good");
    const [notes, setNotes] = useState("");
    const [itemName, setItemName] = useState(request.assignedItemName || "");
    const isInspection = request.status === 'waiting_inspection';

    useEffect(() => {
        if (!itemName && request.assignedItemId) {
            inventoryService.getById(request.assignedItemId)
                .then(item => setItemName(item?.name || "Unknown Item"))
                .catch(() => setItemName("Unknown Item"));
        }
    }, [request.assignedItemId, itemName]);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" variant={isInspection ? "default" : "outline"} className={isInspection ? "bg-purple-600 hover:bg-purple-500 text-white gap-2 border-none animate-pulse shadow-lg shadow-purple-500/20" : "border-white/10 bg-slate-800 text-slate-300 gap-2"}>
                    {isInspection ? <AlertTriangle size={16} /> : <CornerDownLeft size={16} />}
                    {isInspection ? "Inspect & Restock" : "Restock Device"}
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10">
                <DialogHeader>
                    <DialogTitle>{isInspection ? "Inspect Returned Item" : "Process Device Restock"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 my-4">
                    {isInspection && (
                        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-start gap-3">
                            <AlertTriangle className="text-purple-400 shrink-0 mt-0.5" size={16} />
                            <div className="text-sm text-purple-200">
                                <strong>User marked as returned.</strong> Verify the item's condition before restocking.
                            </div>
                        </div>
                    )}

                    <div className="p-3 bg-slate-800 rounded-lg flex justify-between">
                        <span className="text-slate-400">Item:</span>
                        <span className="font-bold text-white">{itemName || 'Loading...'}</span>
                    </div>
                    <div className="space-y-2">
                        <Label>Condition on Return</Label>
                        <Select onValueChange={(v) => setCondition(v as InventoryCondition)} defaultValue="good">
                            <SelectTrigger className="bg-slate-800 border-white/10">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="good">Good</SelectItem>
                                <SelectItem value="needs_repair">Needs Repair</SelectItem>
                                <SelectItem value="broken">Broken</SelectItem>
                                <SelectItem value="lost">Lost</SelectItem>
                                <SelectItem value="retired">Retired</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Notes / Damage Report</Label>
                        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional remarks..." className="bg-slate-800 border-white/10" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => onReturn(condition, notes)} className="bg-green-600 hover:bg-green-500 text-white w-full sm:w-auto">
                        {isInspection ? "Confirm & Restock" : "Complete Return"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
