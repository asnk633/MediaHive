"use client";

import React, { useState, useEffect } from 'react';
import { User } from '@/services/userService';
import { Institution, Department } from '@/types/structure';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User | null; // null = create mode
    onSave: (data: Partial<User>) => Promise<void>;
    institutions: Institution[];
    departments: Department[]; // User can be affiliated directly to a department OR institution
}

export function UserDialog({ open, onOpenChange, user, onSave, institutions, departments }: UserDialogProps) {
    const [loading, setLoading] = useState(false);

    // Form State
    const [role, setRole] = useState('guest');
    const [isActive, setIsActive] = useState(true);

    // Affiliation State
    // XOR: affiliationType = 'institution' | 'department'
    const [affiliationType, setAffiliationType] = useState<'institution' | 'department'>('institution');
    const [selectedInstitution, setSelectedInstitution] = useState<string>('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');

    useEffect(() => {
        if (open) {
            if (user) {
                setRole(user.role);
                // Determine affiliation
                if (user.institution_id) {
                    setAffiliationType('institution');
                    setSelectedInstitution(user.institution_id);
                    setSelectedDepartment('');
                } else if (user.department_id) {
                    setAffiliationType('department');
                    setSelectedDepartment(user.department_id);
                    setSelectedInstitution('');
                } else {
                    // Default fallback or floating user
                    setAffiliationType('institution');
                    setSelectedInstitution('');
                    setSelectedDepartment('');
                }
            } else {
                // Reset for create
                setRole('guest');
                setIsActive(true);
                setAffiliationType('institution');
                setSelectedInstitution('');
                setSelectedDepartment('');
            }
        }
    }, [open, user]);

    const handleSave = async () => {
        setLoading(true);
        try {
            // Payload initialized strictly below
            const payload: any = { role, isActive };

            // Logic for Name
            const nameInput = document.getElementById('user-name') as HTMLInputElement;
            const nameValue = nameInput?.value?.trim() || null;

            if (!nameValue) {
                toast.error('Full Name is required');
                setLoading(false);
                return;
            }

            if (user) {
                // For existing users, update 'official_name' to override others
                // Also update 'name' as fallback
                payload.official_name = nameValue;
                payload.name = nameValue;
            } else {
                // For invites, pass 'name'
                payload.name = nameValue;
            }

            // Logic for Email
            if (!user) {
                const emailInput = document.getElementById('user-email') as HTMLInputElement;

                if (!nameValue) {
                    toast.error('Full Name is required');
                    setLoading(false);
                    return;
                }

                if (!emailInput || !emailInput.value) {
                    toast.error("Please enter an email address");
                    setLoading(false);
                    return;
                }

                // Validate email format
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {
                    toast.error('Valid email is required');
                    setLoading(false);
                    return;
                }
                payload.email = emailInput.value;
            }

            if (affiliationType === 'institution') {
                if (!selectedInstitution) {
                    toast.error("Please select an institution");
                    setLoading(false);
                    return;
                }
                payload.institution_id = selectedInstitution;
                payload.department_id = null; // Clear other
            } else {
                if (!selectedDepartment) {
                    toast.error("Please select an office / unit");
                    setLoading(false);
                    return;
                }
                payload.department_id = selectedDepartment;
                payload.institution_id = null; // Clear other
            }

            await onSave(payload);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-950/90 backdrop-blur-xl border-white/10 sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-white">
                        {user ? `Edit User: ${user.name || 'User'}` : 'Invite User'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {user ? 'Update user roles and affiliations.' : 'Invite a new member to the organization.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Name Input (Optional for Invite, Editable for User) */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-white/70">Full Name <span className="text-red-400">*</span></Label>
                        <Input
                            placeholder="John Doe"
                            className="bg-slate-800 border-white/10 text-white"
                            id="user-name"
                            defaultValue={user?.official_name || user?.name || ''}
                        />
                    </div>

                    {/* Email Input (Create Mode Only) */}
                    {!user && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-white/70">Email Address <span className="text-red-400">*</span></Label>
                            <Input
                                placeholder="colleague@thaiba.com"
                                className="bg-slate-800 border-white/10 text-white"
                                id="user-email"
                            />
                        </div>
                    )}

                    {/* Role Selection */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-white/70">Role</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-white/10">
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="team">Team Member</SelectItem>
                                <SelectItem value="guest">Guest</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Affiliation Switch */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-white/70">Affiliation</Label>
                        <Tabs
                            value={affiliationType}
                            onValueChange={(v) => setAffiliationType(v as any)}
                            className="w-full"
                        >
                            <TabsList className="bg-slate-800 border border-white/5 w-full">
                                <TabsTrigger value="institution" className="flex-1">Institution</TabsTrigger>
                                <TabsTrigger value="department" className="flex-1">Office / Unit</TabsTrigger>
                            </TabsList>

                            <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-white/5">
                                <TabsContent value="institution" className="mt-0">
                                    <Label className="text-xs text-white/50 mb-2 block">Select Institution</Label>
                                    <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                            <SelectValue placeholder="Choose Institution..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-950/90 backdrop-blur-xl border-white/10">
                                            {institutions.map(inst => (
                                                <SelectItem key={inst.id} value={inst.id}>
                                                    {inst.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TabsContent>

                                <TabsContent value="department" className="mt-0">
                                    <Label className="text-xs text-white/50 mb-2 block">Select Global Office / Unit</Label>
                                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                            <SelectValue placeholder="Choose Office / Unit..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-950/90 backdrop-blur-xl border-white/10">
                                            {departments.map(dept => (
                                                <SelectItem key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>

                    {/* Active Status Switch */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-white/5">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-medium text-white/70">Account Status</Label>
                            <div className="text-xs text-slate-400">
                                {isActive ? 'User can access the system' : 'User access is suspended'}
                            </div>
                        </div>
                        <Switch
                            checked={isActive}
                            onCheckedChange={setIsActive}
                            className="data-[state=checked]:bg-green-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} className="text-slate-400">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-500 text-white"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
