"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InventoryIssue, InventoryCondition } from "@/types/inventory";
import { inventoryIssueService } from "@/services/inventoryIssueService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ReturnItemDialogProps {
    issue: InventoryIssue | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onReturnComplete?: () => void;
}

export function ReturnItemDialog({ issue, open, onOpenChange, onReturnComplete }: ReturnItemDialogProps) {
    const [loading, setLoading] = useState(false);
    const [conditionIn, setConditionIn] = useState<InventoryCondition>("good");
    const [remarks, setRemarks] = useState("");

    const isCriticalCondition = ['broken', 'lost', 'needs_repair'].includes(conditionIn);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!issue) return;

        // Validation
        if (isCriticalCondition && !remarks.trim()) {
            toast.error("Remarks are required for this condition.");
            return;
        }

        try {
            setLoading(true);
            const returnedAt = new Date();
            await inventoryIssueService.returnItem(issue.id, conditionIn, returnedAt, remarks);
            toast.success("Item returned successfully");
            onOpenChange(false);
            if (onReturnComplete) onReturnComplete();
        } catch (error) {
            console.error(error);
            toast.error("Failed to return item");
        } finally {
            setLoading(false);
        }
    };

    if (!issue) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-[#ffffff1a] text-slate-200">
                <DialogHeader>
                    <DialogTitle>Return Item: {issue.itemName}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">

                    <div className="p-3 bg-slate-800/50 rounded-lg border border-white/5 space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Issued To</span>
                            <span className="text-white font-mono">{issue.issuedToUserId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Condition Out</span>
                            <span className="capitalize text-white">{issue.conditionOut}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Condition In <span className="text-red-400">*</span></Label>
                        <Select value={conditionIn} onValueChange={(v) => setConditionIn(v as InventoryCondition)}>
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

                    {isCriticalCondition && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                            <Label>Remarks <span className="text-red-400">*</span></Label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-white/10 bg-slate-950/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Please explain the damage or loss..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Confirm Return
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
