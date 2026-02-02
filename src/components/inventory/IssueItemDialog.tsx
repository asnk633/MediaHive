"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InventoryItem, InventoryCondition, InventoryRequest } from "@/types/inventory";
import { inventoryIssueService } from "@/services/inventoryIssueService";
import { inventoryRequestService } from "@/services/inventoryRequestService";
import { useAuth } from "@/contexts/AuthContextProvider";
import { toast } from "sonner";
import { Loader2, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface IssueItemDialogProps {
    item: InventoryItem | null; // If issuing directly from Inventory List
    request?: InventoryRequest | null; // If issuing from a Request
    open: boolean;
    onOpenChange: (open: boolean) => void;
    users?: { uid: string, name: string, role: string }[]; // Simplified user list for selection
}

// Temporary user fetch or pass prop? Ideally pass user options.
// For now we might need a simple text input for User ID if fetching users is complex or out of scope for this file. 
// BUT "issuedTo" is required. Let's assume passed prop or simple input.
// Actually, strict requirement say "issuedTo (user)". 
// I'll add a simple user fetch or mock for now if not passed, but let's assume parent passes it or we implement a simple search.
// Given constraints, I'll use a simple Input for User ID/Name if list not available, but 'Select' is better.

export function IssueItemDialog({ item, request, open, onOpenChange, users = [] }: IssueItemDialogProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form State
    const [issuedToId, setIssuedToId] = useState(request?.requestedBy || "");
    const [issuedToRole, setIssuedToRole] = useState<'guest' | 'team'>('guest'); // Default
    const [conditionOut, setConditionOut] = useState<InventoryCondition>(item?.condition || 'good');
    const [expectedReturnAt, setExpectedReturnAt] = useState<Date | undefined>(undefined);
    const [projectNote, setProjectNote] = useState(request?.purpose || "");

    useEffect(() => {
        if (open) {
            setIssuedToId(request?.requestedBy || "");
            setProjectNote(request?.purpose || "");
            setConditionOut(item?.condition || 'good');
            setExpectedReturnAt(undefined);

            if (request) setIssuedToRole('guest'); // Requests are mostly guests
        }
    }, [open, request, item]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!item || !user) return;
        if (!issuedToId) { toast.error("Issued To is required"); return; }
        if (!expectedReturnAt) { toast.error("Expected Return Date is required"); return; }

        try {
            setLoading(true);
            const issueId = await inventoryIssueService.create({
                itemId: item.id,
                itemName: item.name,
                issuedToUserId: issuedToId,
                issuedToRole, // UI input
                issuedBy: user.uid,
                issuedFor: {
                    institutionId: user.defaultInstitution,
                    projectNote: projectNote
                },
                conditionOut,
                expectedReturnAt: expectedReturnAt.toISOString(),
                institutionId: user.defaultInstitution || ''
            });

            // FIX 1: Link Request if exists
            if (request) {
                await inventoryRequestService.markAsIssued(request.id, issueId);
            }

            toast.success("Item issued successfully");
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to issue item");
        } finally {
            setLoading(false);
        }
    };

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-[#ffffff1a] text-slate-200">
                <DialogHeader>
                    <DialogTitle>Issue {item.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Item Info */}
                    <div className="p-3 bg-slate-800/50 rounded-lg border border-white/5 text-sm">
                        <div className="flex justify-between mb-1">
                            <span className="text-slate-400">Current Condition</span>
                            <span className="capitalize text-white">{item.condition}</span>
                        </div>
                        {request && (
                            <div className="mt-2 pt-2 border-t border-white/5">
                                <span className="text-slate-400 block text-xs uppercase mb-1">Request</span>
                                <p className="text-white italic">"{request.purpose}"</p>
                            </div>
                        )}
                    </div>

                    {/* Issued To */}
                    <div className="space-y-2">
                        <Label>Issued To User ID (UID) <span className="text-red-400">*</span></Label>
                        {/* Ideally a Searchable Select. using Input for Phase 6 MVP to avoid complex user fetch logic here */}
                        <Input
                            value={issuedToId}
                            onChange={e => setIssuedToId(e.target.value)}
                            placeholder="User UID"
                            className="bg-slate-950/50 border-white/10"
                            required
                        />
                        <div className="flex gap-4 mt-1">
                            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                                <input type="radio" name="role" checked={issuedToRole === 'guest'} onChange={() => setIssuedToRole('guest')} /> Guest
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                                <input type="radio" name="role" checked={issuedToRole === 'team'} onChange={() => setIssuedToRole('team')} /> Team
                            </label>
                        </div>
                    </div>

                    {/* Expected Return */}
                    <div className="space-y-2">
                        <Label>Expected Return Date <span className="text-red-400">*</span></Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal bg-slate-950/50 border-white/10",
                                        !expectedReturnAt && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {expectedReturnAt ? format(expectedReturnAt, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10" align="start">
                                <Calendar
                                    mode="single"
                                    selected={expectedReturnAt}
                                    onSelect={setExpectedReturnAt}
                                    initialFocus
                                    disabled={(date) => date < new Date()}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Condition Out */}
                    <div className="space-y-2">
                        <Label>Condition Out <span className="text-red-400">*</span></Label>
                        <Select value={conditionOut} onValueChange={(v) => setConditionOut(v as InventoryCondition)}>
                            <SelectTrigger className="bg-slate-950/50 border-white/10">
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

                    {/* Project Note */}
                    <div className="space-y-2">
                        <Label>Project / Purpose</Label>
                        <Input
                            value={projectNote}
                            onChange={e => setProjectNote(e.target.value)}
                            placeholder="Project X"
                            className="bg-slate-950/50 border-white/10"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-500 text-white" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Confirm Issue
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
