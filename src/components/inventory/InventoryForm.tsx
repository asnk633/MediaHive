"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InventoryAsset, InventoryAssetStatus, InventoryCondition } from "@/types/inventory";
import { inventoryService } from '@/services/inventory/inventoryService';
import { useAuth } from "@/contexts/AuthContextProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateSelector } from "@/components/ui/selectors/DateSelector";
import { DropdownSelector } from "@/components/ui/selectors/DropdownSelector";
import { format } from "date-fns";
import { cn, nativeNavigate } from "@/lib/utils";
import { AlertTriangle, Save, ArrowLeft, Loader2, Image as ImageIcon, X, Upload, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import AppLink from "@/components/AppLink";
import { toast } from "sonner";
import { FileService } from "@/services/fileService";
import { ImageCropper } from "@/components/ui/ImageCropper";
import NextImage from 'next/image';
import { getDriveImageUrl } from "@/lib/driveUtils";

interface InventoryFormProps {
    initialData?: InventoryAsset;
    mode: 'create' | 'edit';
}

const CATEGORIES = [
    "Camera", "Lens", "Audio", "Lights", "Cables", "IT", "Furniture", "decoration", "Other"
];

const CONDITIONS: { value: InventoryCondition; label: string }[] = [
    { value: "good", label: "Good" },
    { value: "needs_repair", label: "Needs Repair" },
    { value: "broken", label: "Broken" },
    { value: "lost", label: "Lost" },
    { value: "retired", label: "Retired" },
];

const STATUSES: { value: InventoryAssetStatus; label: string }[] = [
    { value: "available", label: "Available" },
    { value: "in_use", label: "In Use" },
    { value: "maintenance", label: "Maintenance" },
    { value: "retired", label: "Retired" },
];

export default function InventoryForm({ initialData, mode }: InventoryFormProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [uploadingImage, setUploadingImage] = useState(false);

    const inputClasses = "bg-white/5 border-[#ffffff1a] text-white placeholder:text-white/50 focus:border-blue-500/50 focus:ring-0";
    const labelClasses = "text-white/70 font-medium";

    const [formData, setFormData] = useState({
        name: "",
        category: "",
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: 0,
        condition: "good" as InventoryCondition,
        status: "available" as InventoryAssetStatus,
        serialNumber: "",
        remarks: "",
        imageUrl: "",
        driveFileId: "",
        images: [] as { url: string, file_id: string }[]
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                category: initialData.category,
                purchaseDate: typeof initialData.purchaseDate === 'object' && initialData.purchaseDate !== null && 'toDate' in (initialData.purchaseDate as any)
                    ? (initialData.purchaseDate as any).toDate().toISOString().split('T')[0]
                    : new Date(initialData.purchaseDate as string | number).toISOString().split('T')[0],
                purchasePrice: initialData.purchasePrice,
                condition: initialData.condition,
                status: initialData.status || "available",
                serialNumber: initialData.serialNumber || "",
                remarks: initialData.remarks || "",
                imageUrl: initialData.imageUrl || "",
                driveFileId: initialData.driveFileId || "",
                images: initialData.images || (initialData.imageUrl ? [{ url: initialData.imageUrl, file_id: initialData.driveFileId || '' }] : [])
            });
        }
    }, [initialData]);

    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [activeSlot, setActiveSlot] = useState<number | null>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setOriginalFile(file);
        setActiveSlot(slotIndex);
        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImageSrc(reader.result as string);
            setCropperOpen(true);
        };
        reader.readAsDataURL(file);

        // Reset input
        e.target.value = '';
    };

    const handleCropComplete = async (blob: Blob) => {
        setCropperOpen(false);
        if (!originalFile || activeSlot === null) return;

        const processedFile = new File([blob], originalFile.name, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);

        // Optimistic update
        setFormData(prev => {
            const newImages = [...prev.images];
            // Fill gaps if slot is ahead (though UI prevents this usually, safe to push or replace)
            // Actually, best to just treat it as replacing or adding at index.
            // If activeSlot is >= length, it's an add.

            // For now, simpler logic: 
            // We have a fixed 3 slots UI.
            // slot 0 is cover. slot 1, 2 are extras.
            // However, the array should be dense.
            // Let's rely on array operations.

            // Actually, the slot UI below will map 0, 1, 2.

            return prev; // We wait for upload to real update, or show spinner?
            // Let's do optimistic for the preview image at least.
        });

        try {
            setUploadingImage(true);
            const metadata: any = {
                name: `INV_${Date.now()}_${originalFile.name}`,
                type: 'image',
                uploaded_by: user?.uid,
                uploadedByName: user?.name || user?.email,
                folder: 'Photos',
                subfolder: 'Inventory Photos',
                module: 'inventory',
                visibility: { mode: 'all' }
            };

            const result = await FileService.uploadFile(processedFile, metadata);
            if (result.success) {
                const newImage = {
                    url: result.viewLink,
                    file_id: result.file_id
                };

                setFormData(prev => {
                    const currentImages = [...prev.images];
                    // If replacing an existing image at this slot
                    if (activeSlot < currentImages.length) {
                        currentImages[activeSlot] = newImage;
                    } else {
                        // Adding new
                        currentImages.push(newImage);
                    }

                    // Sync legacy fields if slot 0 changed
                    const isCover = activeSlot === 0;

                    return {
                        ...prev,
                        images: currentImages,
                        imageUrl: isCover ? newImage.url : (currentImages[0]?.url || ""),
                        driveFileId: isCover ? newImage.file_id : (currentImages[0]?.file_id || "")
                    }
                });
                toast.success("Image uploaded successfully");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to upload image");
        } finally {
            setUploadingImage(false);
            setActiveSlot(null);
        }
    };

    const handleRemoveImage = (index: number) => {
        setFormData(prev => {
            const newImages = prev.images.filter((_, i) => i !== index);
            const newCover = newImages[0];
            return {
                ...prev,
                images: newImages,
                imageUrl: newCover ? newCover.url : "",
                driveFileId: newCover ? newCover.file_id : ""
            };
        });
    };

    const handleCancelCrop = () => {
        setCropperOpen(false);
        setSelectedImageSrc(null);
        setOriginalFile(null);
        setActiveSlot(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || user.role !== 'admin') {
            toast.error("Unathorized: You must be an admin to perform this action.");
            return;
        }

        try {
            setLoading(true);

            const basePayload = {
                ...formData,
                purchaseDate: new Date(formData.purchaseDate).toISOString(),
            };

            if (mode === 'create') {
                await inventoryService.create(basePayload as any);
                toast.success("Item added to inventory.");
                nativeNavigate('/inventory', router, 'InventoryForm (Create Success)');
            } else if (mode === 'edit' && initialData) {
                await inventoryService.update(
                    initialData.id, 
                    basePayload as any,
                    initialData.updated_at as any,
                    initialData.version
                );
                toast.success("Item updated successfully.");
                nativeNavigate(`/inventory/${initialData.id}`, router, 'InventoryForm (Edit Success)');
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to save item.");
        } finally {
            setLoading(false);
        }
    };

    // ... (access check render)


    if (user?.role !== 'admin') {
        return (
            <div className="max-w-2xl mx-auto p-8 text-center bg-slate-900/50 rounded-2xl border border-[#ffffff1a]">
                <div className="flex justify-center mb-4">
                    <AlertTriangle className="h-12 w-12 text-yellow-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Unauthorized</h2>
                <p className="text-slate-400 mb-6">
                    You do not have permission to manage inventory assets.
                </p>
                <div className="flex justify-center gap-4">
                    <AppLink href="/inventory">
                        <Button variant="default">Go to Inventory</Button>
                    </AppLink>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="p-2 rounded-full hover:bg-white/5 text-slate-400 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            {mode === 'create' ? 'Add New Item' : 'Edit Item'}
                        </h1>
                        <p className="text-slate-400 text-sm">Fill in the details for your equipment or consumable.</p>
                    </div>
                </div>
                <Button 
                    type="submit" 
                    disabled={loading || uploadingImage} 
                    className="bg-blue-600 hover:bg-blue-500 text-white min-w-[140px]"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    {mode === 'create' ? 'Create Asset' : 'Save Changes'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Core Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-glass border-soft rounded-2xl p-6 space-y-6 backdrop-blur-md">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="name" className={labelClasses}>Item Name</Label>
                                <Input
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Sony A7R IV"
                                    className={inputClasses}
                                />
                            </div>

                            <div className="space-y-0.5">
                                <DropdownSelector 
                                    label="Category"
                                    value={formData.category}
                                    onChange={val => setFormData(prev => ({ ...prev, category: val }))}
                                    options={CATEGORIES.map(cat => ({ id: cat, label: cat }))}
                                    placeholder="Select category"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="serialNumber" className={labelClasses}>Serial Number</Label>
                                <Input
                                    id="serialNumber"
                                    value={formData.serialNumber}
                                    onChange={e => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                                    placeholder="Optional"
                                    className={inputClasses}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-0.5">
                                <DropdownSelector 
                                    label="Condition"
                                    value={formData.condition}
                                    onChange={val => setFormData(prev => ({ ...prev, condition: val as InventoryCondition }))}
                                    options={CONDITIONS.map(c => ({ id: c.value, label: c.label }))}
                                />
                            </div>

                            <div className="space-y-0.5">
                                <DropdownSelector 
                                    label="Status"
                                    value={formData.status}
                                    onChange={val => setFormData(prev => ({ ...prev, status: val as InventoryAssetStatus }))}
                                    options={STATUSES.map(s => ({ id: s.value, label: s.label }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="remarks" className={labelClasses}>Remarks / Notes</Label>
                            <Textarea
                                id="remarks"
                                value={formData.remarks}
                                onChange={e => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                                placeholder="Additional details, usage instructions, etc."
                                className={cn(inputClasses, "min-h-[100px] resize-none")}
                            />
                        </div>
                    </div>

                    {/* Rental Settings Section */}
                    <div className="bg-glass border-soft rounded-2xl p-6 space-y-6 backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-2">
                            <CalendarIcon className="w-4 h-4 text-blue-400" />
                            <h3 className="font-bold text-white uppercase tracking-wider text-xs">Rental & Booking Settings</h3>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                            <div>
                                <Label className="text-slate-200 font-bold block">Available for External Rental</Label>
                                <p className="text-[11px] text-slate-500 mt-0.5">Enable this to list the item as rentable to external entities.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={(formData as any).isRentable || false}
                                        onChange={e => setFormData(prev => ({ ...prev, isRentable: e.target.checked }))}
                                    />
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>

                        {((formData as any).isRentable) && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Label className={labelClasses}>Daily Rental Rate (₹)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">₹</span>
                                    <Input
                                        type="number"
                                        value={(formData as any).rentalRatePerDay || 0}
                                        onChange={e => setFormData(prev => ({ ...prev, rentalRatePerDay: parseFloat(e.target.value) || 0 }))}
                                        className={cn(inputClasses, "pl-7")}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Media & Finance */}
                <div className="space-y-6">
                    <div className="bg-glass border-soft rounded-2xl p-6 space-y-6 backdrop-blur-md">
                        <div className="space-y-4">
                            <Label className={labelClasses}>Item Photos</Label>
                            <div className="grid grid-cols-1 gap-4">
                                {/* Cover Slot */}
                                <div className="space-y-2">
                                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Cover Photo</span>
                                    <div className="aspect-video relative rounded-xl border border-dashed border-white/10 overflow-hidden group">
                                        {formData.images[0] ? (
                                            <>
                                                <NextImage 
                                                    src={getDriveImageUrl(formData.images[0].url, formData.images[0].file_id)} 
                                                    alt="Cover" fill className="object-cover" 
                                                />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveImage(0)} className="text-red-400 hover:text-red-300">
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/[0.02]">
                                                <ImageIcon className="w-8 h-8 text-slate-700" />
                                                <Label className="cursor-pointer">
                                                    <span className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Upload Cover</span>
                                                    <Input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 0)} />
                                                </Label>
                                            </div>
                                        )}
                                        {uploadingImage && activeSlot === 0 && (
                                            <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
                                                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-glass border-soft rounded-2xl p-6 space-y-6 backdrop-blur-md">
                        <div className="space-y-0.5">
                            <DateSelector 
                                label="Purchase Date"
                                date={new Date(formData.purchaseDate)}
                                onChange={(date) => {
                                    if (!date) return;
                                    setFormData(prev => ({ ...prev, purchaseDate: date.toISOString().split('T')[0] }));
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="purchasePrice" className={labelClasses}>Purchase Price (₹)</Label>
                            <Input
                                id="purchasePrice"
                                type="number"
                                value={formData.purchasePrice}
                                onChange={e => setFormData(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) || 0 }))}
                                className={inputClasses}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {cropperOpen && (
                <ImageCropper
                    imageSrc={selectedImageSrc || ""}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCancelCrop}
                />
            )}
        </form>
    );

}
