"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { nativeNavigate } from "@/lib/utils";
import { DeviceRequest } from "@/types/deviceRequest";
import { deviceRequestService } from "@/services/deviceRequestService";
import { inventoryService } from '@/services/inventory/inventoryService';
import { EquipmentItem } from "@/services/inventory/inventoryContract";
import { useAuth } from "@/contexts/AuthContextProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Loader2, Send, Package } from "lucide-react";
import { toast } from "sonner";
import { UserService, User } from "@/services/userService";
import { DatePicker } from "@/components/ui/date-picker";

const CATEGORIES = [
    "Camera", "Lens", "Audio", "Lights", "Cables", "IT", "Furniture", "Decoration", "Other"
];

export default function DeviceRequestForm() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const itemIdParam = searchParams.get('itemId');

    const [loading, setLoading] = useState(false);

    // Admin: Users List
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");

    // Target Item (from Inventory)
    const [targetItem, setTargetItem] = useState<EquipmentItem | null>(null);

    // Refs for Date Pickers
    const startDateRef = React.useRef<HTMLInputElement>(null);
    const endDateRef = React.useRef<HTMLInputElement>(null);

    // Form
    const [formData, setFormData] = useState({
        itemCategory: "",
        description: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
    });

    React.useEffect(() => {
        if (user?.role === 'admin') {
            loadUsers();
            setSelectedUserId(user.uid); // Default to self
        }
    }, [user]);

    React.useEffect(() => {
        if (itemIdParam) {
            loadTargetItem(itemIdParam);
        }
    }, [itemIdParam]);

    const loadUsers = async () => {
        const list = await UserService.getAllUsers();
        setUsers(list);
    };

    const loadTargetItem = async (id: string) => {
        const item = await inventoryService.getById(id);
        if (item) {
            setTargetItem(item);
            setFormData(prev => ({
                ...prev,
                itemCategory: item.category,
                description: item.name // Pre-fill description with item name
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            setLoading(true);

            // Basic Validation
            if (new Date(formData.endDate) < new Date(formData.startDate)) {
                toast.error("End date cannot be before start date.");
                setLoading(false);
                return;
            }

            // Determine Requester
            let requester = {
                uid: user.uid,
                name: user.name || user.email || "Unknown",
                role: user.role,
            };

            // If Admin selected someone else
            if (user.role === 'admin' && selectedUserId && selectedUserId !== user.uid) {
                const targetUser = users.find(u => u.uid === selectedUserId);
                if (targetUser) {
                    requester = {
                        uid: targetUser.uid,
                        name: targetUser.name || targetUser.email || "Unknown",
                        role: targetUser.role as any, // Cast assuming role is valid
                    };
                }
            }

            await deviceRequestService.createRequest({
                requester,
                itemCategory: formData.itemCategory,
                description: formData.description,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
                assignedItemId: targetItem ? String(targetItem.id) : undefined, // Link specific item if selected
            });

            toast.success("Request submitted successfully!");
            nativeNavigate('/inventory/requests', router, 'DeviceRequest (Success)'); // Redirect to My Requests
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit request.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto p-6 bg-slate-900/50 rounded-2xl border border-[#ffffff1a]">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
                {targetItem ? `Requesting: ${targetItem.name}` : 'Request Equipment'}
            </h2>

            {/* Admin: Request For Selector */}
            {user?.role === 'admin' && (
                <div className="space-y-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <Label className="text-blue-200">Request For</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger className="bg-slate-800 border-[#ffffff1a]">
                            <SelectValue placeholder="Select team member..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={user.uid}>Me ({user.name})</SelectItem>
                            {users.filter(u => u.uid !== user.uid).map(u => (
                                <SelectItem key={u.uid} value={u.uid}>
                                    {u.name} ({u.role})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* If Item Selected, Show ReadOnly Info instead of Category Select */}
            {targetItem ? (
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 flex gap-4 items-center">
                    <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center border border-[#ffffff1a]">
                        <Package className="text-blue-400" />
                    </div>
                    <div>
                        <p className="text-xs text-foreground/60 uppercase tracking-wider font-bold">{targetItem.category}</p>
                        <p className="font-semibold text-foreground text-lg">{targetItem.name}</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <Label htmlFor="category">What do you need?</Label>
                    <Select
                        value={formData.itemCategory}
                        onValueChange={(val) => setFormData({ ...formData, itemCategory: val })}
                    >
                        <SelectTrigger className="bg-background/50 w-full">
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                            {CATEGORIES.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="description">Details / Purpose</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., 'Need a wide lens for the Sunday event' or 'Sony A7S III preferred'"
                    className="bg-background/50 min-h-[100px]"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="startDate">From</Label>
                    <DatePicker
                        date={formData.startDate ? new Date(formData.startDate) : undefined}
                        setDate={(date) => setFormData({
                            ...formData,
                            startDate: date ? date.toISOString() : ''
                        })}
                        placeholder="Start Date"
                        showTime
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="endDate">To</Label>
                    <DatePicker
                        date={formData.endDate ? new Date(formData.endDate) : undefined}
                        setDate={(date) => setFormData({
                            ...formData,
                            endDate: date ? date.toISOString() : ''
                        })}
                        placeholder="End Date"
                        showTime
                    />
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 shadow-glow">
                {loading ? (
                    <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Sending...</span>
                ) : (
                    <span className="flex items-center gap-2"><Send size={18} /> {user?.role === 'admin' && selectedUserId !== user?.uid ? 'Submit on Behalf' : 'Submit Request'}</span>
                )}
            </Button>
        </form>
    );
}
