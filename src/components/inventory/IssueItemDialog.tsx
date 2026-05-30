"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EquipmentItem, InventoryIssueClean, InventoryRequestClean } from "@/services/inventory/inventoryContract";
import { InventoryCondition } from "@/types/inventory";
import { inventoryIssueService } from '@/services/inventory/inventoryIssueService';
import { inventoryRequestService } from '@/services/inventory/inventoryRequestService';
import { UserService } from '@/services/userService';
import { StructureService } from '@/services/structureService';
import { useAuth } from "@/contexts/AuthContextProvider";
import { useWorkspace } from "@/system/workspace/WorkspaceProvider";
import { toast } from "sonner";
import { Loader2, CalendarIcon, Check, ChevronsUpDown, User, Building } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface IssueItemDialogProps {
    item: EquipmentItem | null; 
    request?: InventoryRequestClean | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function IssueItemDialog({ item, request, open, onOpenChange }: IssueItemDialogProps) {
    const { user } = useAuth();
    const { currentWorkspaceId } = useWorkspace();
    const [loading, setLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(false);

    // Lists
    const [userOptions, setUserOptions] = useState<{ id: string, name: string, role: string }[]>([]);
    const [deptOptions, setDeptOptions] = useState<{ id: string, name: string }[]>([]);

    // Form State
    const [issuedToId, setIssuedToId] = useState(request?.requestedBy || "");
    const [issuedToDeptId, setIssuedToDeptId] = useState("");
    const [issuedToRole, setIssuedToRole] = useState<'member' | 'manager' | 'member' | 'team'>('member');
    const [conditionOut, setConditionOut] = useState<InventoryCondition>((item?.condition as InventoryCondition) || 'good');
    const [expectedReturnAt, setExpectedReturnAt] = useState<Date | undefined>(undefined);
    const [projectNote, setProjectNote] = useState(request?.purpose || "");

    // Selection States
    const [userSearchOpen, setUserSearchOpen] = useState(false);
    const [deptSearchOpen, setDeptSearchOpen] = useState(false);

    useEffect(() => {
        if (open) {
            setIssuedToId(request?.requestedBy || "");
            setIssuedToDeptId("");
            setProjectNote(request?.purpose || "");
            setConditionOut((item?.condition as InventoryCondition) || 'good');
            setExpectedReturnAt(undefined);
            if (request) setIssuedToRole('member');

            fetchSelectionData();
        }
    }, [open, request, item]);

    const fetchSelectionData = async () => {
        setIsDataLoading(true);
        try {
            const [users, { departments }] = await Promise.all([
                UserService.getTeamMembers(),
                StructureService.getDepartments()
            ]);
            setUserOptions(users.map(u => ({ id: u.uid, name: u.name, role: 'member' })));
            setDeptOptions(departments.map(d => ({ id: String(d.id), name: d.name })));
        } catch (error) {
            console.error("Failed to fetch selection data", error);
        } finally {
            setIsDataLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!item || !user) return;
        if (!issuedToId) { toast.error("User selection is required"); return; }
        if (!expectedReturnAt) { toast.error("Expected Return Date is required"); return; }

        try {
            setLoading(true);
            
            const isUUID = (str: any) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(str));

            // Priority: 1. Workspace ID (if it's a UUID), 2. User Profile Institution ID
            let resolvedInstitutionId: string | null = null;
            if (currentWorkspaceId && isUUID(currentWorkspaceId)) {
                resolvedInstitutionId = String(currentWorkspaceId);
            } else if (user?.institution_id && isUUID(user.institution_id)) {
                resolvedInstitutionId = String(user.institution_id);
            }

            if (!resolvedInstitutionId) {
                throw new Error("No valid institution context found for this operation.");
            }
            
            const issueId = await inventoryIssueService.create({
                itemId: item.id,
                itemName: item.name,
                issuedToUserId: issuedToId,
                issuedToDeptId: issuedToDeptId || undefined,
                issuedToRole,
                issuedBy: user.uid,
                institutionId: resolvedInstitutionId,
                conditionOut,
                expectedReturnAt: expectedReturnAt.toISOString(),
            });

            if (request) {
                await inventoryRequestService.markAsIssued(request.id, issueId);
            }

            toast.success("Item issued successfully");
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to issue item");
        } finally {
            setLoading(false);
        }
    };

    if (!item) return null;

    const selectedUser = userOptions.find(u => u.id === issuedToId);
    const selectedDept = deptOptions.find(d => d.id === issuedToDeptId);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[var(--glass-liquid-bg)] border-foreground/10 text-foreground max-w-md backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        Issue {item.name}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-5 pt-2">

                    {/* Item Context */}
                    <div className="p-3.5 bg-foreground/[0.03] rounded-xl border border-foreground/5 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-foreground/50 font-medium">Current Condition</span>
                            <Badge variant="info" className="capitalize bg-blue-500/10 text-blue-400 border-blue-500/20">{item.condition}</Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {/* Issued To User */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-foreground/50">Issued To User <span className="text-red-400">*</span></Label>
                            <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        role="combobox"
                                        aria-expanded={userSearchOpen}
                                        className="w-full justify-between bg-foreground/[0.03] border border-foreground/10 h-11 px-4 rounded-xl hover:bg-foreground/[0.05] text-foreground"
                                    >
                                        {selectedUser ? (
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-blue-400" />
                                                {selectedUser.name}
                                            </div>
                                        ) : "Select User..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0 bg-[var(--glass-liquid-bg)] border-foreground/10" align="start">
                                    <Command className="bg-transparent">
                                        <CommandInput placeholder="Search users..." className="h-11 border-none focus:ring-0" />
                                        <CommandList>
                                            <CommandEmpty>No user found.</CommandEmpty>
                                            <CommandGroup>
                                                {userOptions.map((u) => (
                                                    <CommandItem
                                                        key={u.id}
                                                        value={u.name}
                                                        onSelect={() => {
                                                            setIssuedToId(u.id);
                                                            setUserSearchOpen(false);
                                                        }}
                                                        className="cursor-pointer hover:bg-foreground/5"
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", issuedToId === u.id ? "opacity-100 text-blue-400" : "opacity-0")} />
                                                        {u.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Issued To Dept */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-foreground/50">Issued to Dept / Institution</Label>
                            <Popover open={deptSearchOpen} onOpenChange={setDeptSearchOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        role="combobox"
                                        aria-expanded={deptSearchOpen}
                                        className="w-full justify-between bg-foreground/[0.03] border border-foreground/10 h-11 px-4 rounded-xl hover:bg-foreground/[0.05] text-foreground"
                                    >
                                        {selectedDept ? (
                                            <div className="flex items-center gap-2">
                                                <Building size={14} className="text-emerald-400" />
                                                {selectedDept.name}
                                            </div>
                                        ) : "Select Department..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0 bg-[var(--glass-liquid-bg)] border-foreground/10" align="start">
                                    <Command className="bg-transparent">
                                        <CommandInput placeholder="Search departments..." className="h-11 border-none focus:ring-0" />
                                        <CommandList>
                                            <CommandEmpty>No department found.</CommandEmpty>
                                            <CommandGroup>
                                                {deptOptions.map((d) => (
                                                    <CommandItem
                                                        key={d.id}
                                                        value={d.name}
                                                        onSelect={() => {
                                                            setIssuedToDeptId(d.id);
                                                            setDeptSearchOpen(false);
                                                        }}
                                                        className="cursor-pointer hover:bg-foreground/5"
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", issuedToDeptId === d.id ? "opacity-100 text-emerald-400" : "opacity-0")} />
                                                        {d.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         {/* Expected Return */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-foreground/50">Expected Return <span className="text-red-400">*</span></Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"ghost"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-foreground/[0.03] border border-foreground/10 h-11 px-4 rounded-xl",
                                            !expectedReturnAt && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                                        {expectedReturnAt ? format(expectedReturnAt, "MMM d, yyyy") : <span>Pick date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-[var(--glass-liquid-bg)] border-foreground/10" align="start">
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
                            <Label className="text-xs font-bold uppercase tracking-widest text-foreground/50">Condition Out <span className="text-red-400">*</span></Label>
                            <Select value={conditionOut} onValueChange={(v) => setConditionOut(v as InventoryCondition)}>
                                <SelectTrigger className="bg-foreground/[0.03] border-foreground/10 h-11 rounded-xl focus:ring-0 focus:border-blue-500/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[var(--glass-liquid-bg)] border-foreground/10 text-foreground">
                                    <SelectItem value="good">Good</SelectItem>
                                    <SelectItem value="needs_repair">Needs Repair</SelectItem>
                                    <SelectItem value="broken">Broken</SelectItem>
                                    <SelectItem value="lost">Lost</SelectItem>
                                    <SelectItem value="retired">Retired</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Project Note */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-foreground/50">Project / Purpose</Label>
                        <Input
                            value={projectNote}
                            onChange={e => setProjectNote(e.target.value)}
                            placeholder="e.g. Media Production for Studio A"
                            className="bg-foreground/[0.03] border-foreground/10 h-11 rounded-xl focus:ring-blue-500/20"
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-foreground/60 hover:text-foreground hover:bg-foreground/5 rounded-xl px-6">
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-foreground rounded-xl px-8 shadow-lg shadow-blue-900/20 transition-all font-bold" disabled={loading || isDataLoading}>
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Confirm Issue"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
