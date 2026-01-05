"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InventoryItem, InventoryCondition, InventoryStatus } from "@/types/inventory";
import { inventoryService } from "@/services/inventoryService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AlertTriangle, Save, ArrowLeft, Loader2, Image as ImageIcon, X, Upload, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { FileService } from "@/services/fileService";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { getDriveImageUrl } from "@/lib/driveUtils";

interface InventoryFormProps {
    initialData?: InventoryItem;
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

const STATUSES: { value: InventoryStatus; label: string }[] = [
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

    const inputClasses = "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500/50 focus:ring-0";
    const labelClasses = "text-white/70 font-medium";

    const [formData, setFormData] = useState({
        name: "",
        category: "",
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: 0,
        condition: "good" as InventoryCondition,
        status: "available" as InventoryStatus,
        serialNumber: "",
        remarks: "",
        imageUrl: "",
        driveFileId: "",
        images: [] as { url: string, fileId: string }[]
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
                images: initialData.images || (initialData.imageUrl ? [{ url: initialData.imageUrl, fileId: initialData.driveFileId || '' }] : [])
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
                uploadedBy: user?.uid,
                uploadedByName: user?.name || user?.email,
                folder: 'Photos',
                subfolder: 'Inventory Photos',
                module: 'inventory',
                visibility: { mode: 'all' }
            };

            const result = await FileService.uploadFile(processedFile, metadata);
            if (result.success) {
                const newImage = {
                    url: result.previewLink || result.viewLink,
                    fileId: result.driveFileId
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
                        driveFileId: isCover ? newImage.fileId : (currentImages[0]?.fileId || "")
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
                driveFileId: newCover ? newCover.fileId : ""
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
                await inventoryService.create(basePayload as any, user);
                toast.success("Item added to inventory.");
                router.push('/inventory');
            } else if (mode === 'edit' && initialData) {
                await inventoryService.update(initialData.id, basePayload, user);
                toast.success("Item updated successfully.");
                router.push(`/inventory/${initialData.id}`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to save item.");
        } finally {
            setLoading(false);
        }
    };

    // ... (access check render)

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto p-6 bg-slate-900/50 rounded-2xl border border-white/10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href={mode === 'edit' ? `/inventory/${initialData?.id}` : "/inventory"}>
                    <Button variant="ghost" size="icon" type="button">
                        <ArrowLeft size={20} />
                    </Button>
                </Link>
                <h2 className="text-2xl font-bold">{mode === 'create' ? 'Add New Asset' : 'Edit Asset'}</h2>
            </div>

            {/* Multi-Image Upload Section */}
            <div className="space-y-3">
                <Label className={labelClasses}>Asset Gallery (Max 3)</Label>
                <div className="grid grid-cols-3 gap-4">
                    {[0, 1, 2].map((slotIndex) => {
                        const image = formData.images[slotIndex];
                        const isCover = slotIndex === 0;
                        const isFilled = !!image;
                        const isNextAvailable = !isFilled && (slotIndex === 0 || !!formData.images[slotIndex - 1]);

                        return (
                            <div key={slotIndex} className="relative aspect-square">
                                {isFilled ? (
                                    <div className="w-full h-full rounded-xl overflow-hidden border border-white/10 group relative">
                                        <img
                                            src={getDriveImageUrl(image.url)}
                                            alt={`Slot ${slotIndex}`}
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(slotIndex)}
                                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-all transform scale-90 group-hover:scale-100"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                        {isCover && (
                                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-blue-500/80 backdrop-blur-sm text-[10px] font-bold text-white rounded-full">
                                                COVER
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <label
                                        className={cn(
                                            "w-full h-full rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center transition-all bg-white/5",
                                            isNextAvailable
                                                ? "hover:bg-white/10 hover:border-blue-500/30 cursor-pointer"
                                                : "opacity-30 cursor-not-allowed"
                                        )}
                                    >
                                        {uploadingImage && activeSlot === slotIndex ? (
                                            <Loader2 size={24} className="animate-spin text-blue-400" />
                                        ) : (
                                            <>
                                                <Upload size={24} className="mb-2 text-white/30" />
                                                <span className="text-xs text-white/30 font-medium">
                                                    {isCover ? "Main Photo" : "Add View"}
                                                </span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => isNextAvailable && handleImageSelect(e, slotIndex)}
                                            className="hidden"
                                            disabled={!isNextAvailable || uploadingImage}
                                        />
                                    </label>
                                )}
                            </div>
                        );
                    })}
                </div>
                <p className="text-xs text-slate-400">
                    Upload up to 3 photos. The first image will be the cover photo.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="name" className={labelClasses}>Asset Name</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sony A7S III"
                    required
                    className={inputClasses}
                />
            </div>

            {/* Same fields as before ... */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                <div className="space-y-2">
                    <Label htmlFor="category" className={labelClasses}>Category</Label>
                    <Select
                        value={formData.category}
                        onValueChange={(val) => setFormData({ ...formData, category: val })}
                    >
                        <SelectTrigger className={inputClasses}>
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#141e30] border-white/10 text-white">
                            {CATEGORIES.map(cat => (
                                <SelectItem key={cat} value={cat} className="focus:bg-white/10">{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="condition" className={labelClasses}>Condition</Label>
                    <Select
                        value={formData.condition}
                        onValueChange={(val) => setFormData({ ...formData, condition: val as InventoryCondition })}
                    >
                        <SelectTrigger className={inputClasses}>
                            <SelectValue placeholder="Select Condition" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#141e30] border-white/10 text-white">
                            {CONDITIONS.map(c => (
                                <SelectItem key={c.value} value={c.value} className="focus:bg-white/10">{c.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="status" className={labelClasses}>Status</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(val) => setFormData({ ...formData, status: val as InventoryStatus })}
                    >
                        <SelectTrigger className={inputClasses}>
                            <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#141e30] border-white/10 text-white">
                            {STATUSES.map(s => (
                                <SelectItem key={s.value} value={s.value} className="focus:bg-white/10">{s.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="purchaseDate" className={labelClasses}>Purchase Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    inputClasses,
                                    "text-left font-normal pl-4 justify-start w-full",
                                    !formData.purchaseDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon size={18} className="text-white/40 mr-3" />
                                {formData.purchaseDate ? format(new Date(formData.purchaseDate), "MMM dd, yyyy") : <span className="text-white/30">Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-[#0f172a] border-white/10 text-white" align="start">
                            <Calendar
                                mode="single"
                                selected={formData.purchaseDate ? new Date(formData.purchaseDate) : undefined}
                                onSelect={(date) => setFormData({ ...formData, purchaseDate: date ? format(date, 'yyyy-MM-dd') : '' })}
                                initialFocus
                                className="bg-[#0f172a] text-white"
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="purchasePrice" className={labelClasses}>Purchase Price (INR)</Label>
                    <Input
                        id="purchasePrice"
                        type="number"
                        min="0"
                        value={formData.purchasePrice}
                        onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })}
                        required
                        className={inputClasses}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="serialNumber" className={labelClasses}>Serial Number</Label>
                <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    placeholder="Optional"
                    className={inputClasses}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="remarks" className={labelClasses}>Remarks</Label>
                <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Any additional notes..."
                    className={cn(inputClasses, "min-h-[100px]")}
                />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500">
                {loading ? (
                    <span className="flex items-center gap-2">Saving...</span>
                ) : (
                    <span className="flex items-center gap-2"><Save size={18} /> Save Asset</span>
                )}
            </Button>
            {cropperOpen && selectedImageSrc && (
                <ImageCropper
                    imageSrc={selectedImageSrc}
                    onCropComplete={handleCropComplete}
                    onCancel={handleCancelCrop}
                />
            )}
        </form>
    );
}
