"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InventoryItem } from "@/types/inventory";
import { inventoryRequestService } from "@/services/inventoryRequestService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface InventoryRequestDialogProps {
    item: InventoryItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InventoryRequestDialog({ item, open, onOpenChange }: InventoryRequestDialogProps) {
    const { user } = useAuth();
    const [purpose, setPurpose] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!item || !user) return;
        if (!purpose.trim()) {
            toast.error("Purpose is required");
            return;
        }

        try {
            setLoading(true);
            await inventoryRequestService.create({
                itemId: item.id,
                itemName: item.name,
                requestedBy: user.uid,
                requestedByRole: 'guest',
                purpose,
                institutionId: user.defaultInstitution || '', // Fallback or strict? Rules check this.
            });
            toast.success("Request submitted successfully");
            onOpenChange(false);
            setPurpose("");
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit request");
        } finally {
            setLoading(false);
        }
    };

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-[#ffffff1a] text-slate-200">
                <DialogHeader>
                    <DialogTitle>Request {item.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-white/5 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Category</span>
                            <span className="text-white">{item.category}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Condition</span>
                            <span className="capitalize text-white">{item.condition}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Purpose of use <span className="text-red-400">*</span></Label>
                        <Textarea
                            value={purpose}
                            onChange={e => setPurpose(e.target.value)}
                            placeholder="Describe why you need this item..."
                            className="bg-slate-950/50 border-white/10"
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Submit Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
