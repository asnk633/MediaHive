import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EquipmentItem } from '@/services/inventory/inventoryContract';
import { inventoryRequestService } from '@/services/inventory/inventoryRequestService';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useWorkspace } from '@/system/workspace/WorkspaceProvider';
import { toast } from 'sonner';

interface InventoryRequestDialogProps {
    item: EquipmentItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InventoryRequestDialog({ item, open, onOpenChange }: InventoryRequestDialogProps) {
    const { user } = useAuth();
    const { currentWorkspaceId } = useWorkspace();
    const [purpose, setPurpose] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!item || !user) return null;

    const handleSubmit = async () => {
        if (!purpose) {
            toast.error("Please provide a purpose for the request");
            return;
        }

        setIsSubmitting(true);
        try {
            const isUUID = (str: any) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(str));

            // Priority: 1. Workspace ID (if it's a UUID), 2. User Profile Institution ID
            let institutionId: string | null = null;
            if (currentWorkspaceId && isUUID(currentWorkspaceId)) {
                institutionId = String(currentWorkspaceId);
            } else if (user?.institution_id && isUUID(user.institution_id)) {
                institutionId = String(user.institution_id);
            }

            if (!institutionId) {
                throw new Error("No valid institution context found for this request.");
            }

            await inventoryRequestService.create({
                itemId: item.id,
                itemName: item.name,
                requestedBy: user.uid,
                requestedByRole: (user.role || 'member') as any,
                purpose,
                institution_id: institutionId,
            });

            toast.success("Request submitted successfully");
            onOpenChange(false);
            setPurpose('');
        } catch (error: any) {
            console.error("Failed to submit request:", error);
            toast.error(error.message || "Failed to submit request");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-foreground/10 text-foreground sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Request Item</DialogTitle>
                    <DialogDescription className="text-foreground/60">
                        Requesting {item.name}. Provide a brief reason for your request.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="purpose" className="text-foreground">Purpose / Duration</Label>
                        <Textarea
                            id="purpose"
                            placeholder="e.g. For shooting at the new campus event on Friday."
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            className="bg-black/20 border-foreground/10 text-foreground min-h-[100px]"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="text-foreground hover:text-foreground hover:bg-foreground/5"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-500 text-foreground"
                    >
                        {isSubmitting ? "Submitting..." : "Submit Request"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
