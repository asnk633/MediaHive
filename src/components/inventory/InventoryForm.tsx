"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InventoryAsset, InventoryAssetStatus, InventoryCondition } from "@/types/inventory";
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
import { AlertTriangle, Save, ArrowLeft, Loader2, Image as ImageIcon, X, Upload, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { FileService } from "@/services/fileService";
import { ImageCropper } from "@/components/ui/ImageCropper";
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

    const inputClasses = "bg-white/5 border-[#ffffff1a] text-white placeholder:text-white/30 focus:border-blue-500/50 focus:ring-0";
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
                await inventoryService.update(initialData.id, basePayload as any, user);
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
        <div className="max-w-2xl mx-auto p-8 text-center bg-slate-900/50 rounded-2xl border border-[#ffffff1a]">
            <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Asset Management Disabled</h2>
            <p className="text-slate-400 mb-6">
                Legacy asset creation is deprecated. Please use the simplified Inventory system for consumables.
            </p>
            <div className="flex justify-center gap-4">
                <Link href="/inventory">
                    <Button variant="default">Go to Inventory</Button>
                </Link>
            </div>
        </div>
    );

}
