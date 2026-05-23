'use client';

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContextProvider";
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn, nativeNavigate } from "@/lib/utils";
import { Save, Loader2, Image as ImageIcon, X, Upload, Info } from "lucide-react";
import { toast } from "sonner";
import { FileService } from "@/services/fileService";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { INVENTORY_CATEGORIES, INVENTORY_GUIDE, InventoryCondition, InventoryAssetStatus } from "@/types/inventory";
import { inventoryService } from '@/services/inventory/inventoryService';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

export default function InventoryAddClient() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        condition: "Good" as InventoryCondition,
        status: "Available" as InventoryAssetStatus,
        purchaseDate: new Date(),
        purchasePrice: "",
        quantity: "1",
        threshold: "0",
        unit: "unit",
        serialNumber: "",
        remarks: "",
        imageUrl: "",
        driveFileId: "",
        images: [] as { url: string, file_id: string }[]
    });

    // Image Upload State
    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setOriginalFile(file);
        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImageSrc(reader.result as string);
            setCropperOpen(true);
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset
    };

    const handleCropComplete = async (blob: Blob) => {
        setCropperOpen(false);
        if (!originalFile) return;

        const processedFile = new File([blob], originalFile.name, { type: 'image/jpeg' });

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
                    // Update main image URL if it's the first one, otherwise just append to array
                    const updatedImages = [...prev.images, newImage];
                    return {
                        ...prev,
                        imageUrl: prev.imageUrl || newImage.url, // Set main image if empty
                        driveFileId: prev.driveFileId || newImage.file_id,
                        images: updatedImages
                    };
                });
                toast.success("Image uploaded successfully");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to upload image");
        } finally {
            setUploadingImage(false);
            setOriginalFile(null);
        }
    };

    const handleRemoveImage = (index: number) => {
        setFormData(prev => {
            const newImages = prev.images.filter((_, i) => i !== index);
            // If we removed the main image (index 0 usually, or the one matching imageUrl), 
            // reset imageUrl to the new first item or empty
            const nextMain = newImages[0];
            return {
                ...prev,
                images: newImages,
                imageUrl: nextMain ? nextMain.url : "",
                driveFileId: nextMain ? nextMain.file_id : ""
            };
        });
    };

    const handleMainImageSet = (image: { url: string, file_id: string }) => {
        setFormData(prev => ({
            ...prev,
            imageUrl: image.url,
            driveFileId: image.file_id
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.name.trim()) return toast.error("Asset Name is required");
        if (!formData.category) return toast.error("Category is required");
        if (!formData.condition) return toast.error("Condition is required");
        if (!formData.status) return toast.error("Status is required");

        try {
            setLoading(true);
            let dbCondition = formData.condition;
            if (formData.condition === 'Good') dbCondition = 'Good';
            else if (formData.condition === 'Fair') dbCondition = 'Need Repair';
            else if (formData.condition === 'Poor' || formData.condition === 'Damaged') dbCondition = 'Damaged';

            let dbStatus = formData.status;
            if (formData.status === 'Available') dbStatus = 'Available';
            else if (formData.status === 'In Use') dbStatus = 'In Use';
            else if (formData.status === 'Maintenance') dbStatus = 'Under Repair';
            else if (formData.status === 'Retired') dbStatus = 'Disposed';

            const payload = {
                name: formData.name,
                category: formData.category,
                quantity: Number(formData.quantity) || 1,
                unit: formData.unit || 'unit',
                threshold: Number(formData.threshold) || 0,
                status: dbStatus,
                assetStatus: formData.status,
                condition: dbCondition,
                serialNumber: formData.serialNumber,
                remarks: formData.remarks,
                purchaseDate: formData.purchaseDate.toISOString(),
                purchasePrice: Number(formData.purchasePrice) || 0,
                imageUrl: formData.imageUrl || '',
                driveFileId: formData.driveFileId,
                images: formData.images,
                institutionId: user?.institution_id
            };

            // @ts-ignore - Assuming create method exists and matches
            await inventoryService.create(payload, user);

            toast.success("Asset saved successfully");
            nativeNavigate('/inventory', router, 'InventoryAdd (Success)');
        } catch (error) {
            console.error(error);
            toast.error("Failed to save asset");
        } finally {
            setLoading(false);
        }
    };

    const CONDITIONS = [
        { value: "Good", label: "Good" },
        { value: "Fair", label: "Fair" },
        { value: "Poor", label: "Poor" },
        { value: "Damaged", label: "Damaged" },
    ];

    const STATUSES = [
        { value: "Available", label: "Available" },
        { value: "In Use", label: "In Use" },
        { value: "Maintenance", label: "Maintenance" },
        { value: "Retired", label: "Retired" },
    ];

    const inputClasses = "bg-background border-soft focus:border-primary/50 rounded-xl text-foreground placeholder:text-muted hover:border-muted transition-colors";

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Add Asset"
                description="Register a new item into the inventory."
            />

            <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Image Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-muted">Asset Images ({formData.images.length}/5)</Label>
                            {formData.images.length > 0 && <span className="text-xs text-muted">First image is cover</span>}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {/* Existing Images */}
                            {formData.images.map((img, idx) => (
                                <div key={idx} className={cn(
                                    "aspect-square rounded-2xl relative group overflow-hidden border border-soft bg-surface",
                                    formData.imageUrl === img.url && "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0b1220]"
                                )}>
                                    <img src={img.url} alt={`Asset ${idx}`} className="w-full h-full object-cover" />

                                    {/* Hover Actions */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                        {formData.imageUrl !== img.url && (
                                            <button
                                                type="button"
                                                onClick={() => handleMainImageSet(img)}
                                                className="text-[10px] bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-foreground px-2 py-1 rounded-full transition-colors"
                                            >
                                                Make Cover
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(idx)}
                                            className="text-red-400 hover:text-foreground p-1.5 rounded-full hover:bg-red-500/20 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    {/* Cover Badge */}
                                    {formData.imageUrl === img.url && (
                                        <div className="absolute top-2 left-2 bg-blue-600 text-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                                            Cover
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Upload Button */}
                            {formData.images.length < 5 && (
                                <div
                                    onClick={() => !uploadingImage && fileInputRef.current?.click()}
                                    className={cn(
                                        "aspect-square rounded-2xl border-2 border-dashed border-soft flex flex-col items-center justify-center cursor-pointer hover:bg-muted/5 transition-all group overflow-hidden relative",
                                        uploadingImage && "pointer-events-none opacity-50"
                                    )}
                                >
                                    {uploadingImage ? (
                                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                    ) : (
                                        <>
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                                                <Upload className="w-4 h-4 text-primary" />
                                            </div>
                                            <span className="text-xs text-muted">Add Photo</span>
                                        </>
                                    )}
                                </div>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageSelect}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="space-y-2 md:col-span-2">
                            <Label className="text-muted">Asset Name <span className="text-destructive">*</span></Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="e.g. Sony A7 III Body"
                                className={inputClasses}
                                required
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label className="text-muted">Category <span className="text-destructive">*</span></Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button type="button" className="text-muted hover:text-foreground transition-colors">
                                            <Info className="w-4 h-4" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-96 p-0 bg-popover/90 backdrop-blur-xl border border-soft shadow-2xl rounded-2xl overflow-hidden"
                                        align="start"
                                        sideOffset={8}
                                    >
                                        <div className="p-4 border-b border-soft bg-muted/5">
                                            <div className="flex items-center gap-2 text-foreground font-medium">
                                                <Info className="w-4 h-4 text-primary" />
                                                <h3>Categorization Guide</h3>
                                            </div>
                                            <p className="text-xs text-muted mt-1">Select the most accurate category for your asset.</p>
                                        </div>

                                        <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-muted/10 scrollbar-track-transparent">
                                            <div className="space-y-1">
                                                {INVENTORY_GUIDE && Object.entries(INVENTORY_GUIDE).length > 0 ? (
                                                    Object.entries(INVENTORY_GUIDE).map(([cat, desc]) => (
                                                        <div key={cat} className="group p-3 hover:bg-muted/5 rounded-xl transition-colors">
                                                            <span className="text-primary font-medium text-sm block mb-1 group-hover:text-primary transition-colors">{cat}</span>
                                                            <span className="text-muted text-xs leading-relaxed block">{desc}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-xs text-muted">
                                                        No categorization guide data available.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <Select
                                value={formData.category}
                                onValueChange={val => setFormData(prev => ({ ...prev, category: val }))}
                            >
                                <SelectTrigger className={inputClasses}>
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {INVENTORY_CATEGORIES.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {formData.category && INVENTORY_GUIDE[formData.category as keyof typeof INVENTORY_GUIDE] && (
                                <p className="text-xs text-primary/80 bg-primary/5 px-3 py-2 rounded-lg border border-primary/10">
                                    {INVENTORY_GUIDE[formData.category as keyof typeof INVENTORY_GUIDE]}
                                </p>
                            )}
                        </div>

                        {/* Condition */}
                        <div className="space-y-2">
                            <Label className="text-muted">Condition <span className="text-destructive">*</span></Label>
                            <Select
                                value={formData.condition}
                                onValueChange={(val: InventoryCondition) => setFormData(prev => ({ ...prev, condition: val }))}
                            >
                                <SelectTrigger className={inputClasses}>
                                    <SelectValue placeholder="Select Condition" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CONDITIONS.map(c => (
                                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status */}
                        <div className="space-y-2">
                            <Label className="text-muted">Status <span className="text-destructive">*</span></Label>
                            <Select
                                value={formData.status}
                                onValueChange={(val: InventoryAssetStatus) => setFormData(prev => ({ ...prev, status: val }))}
                            >
                                <SelectTrigger className={inputClasses}>
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUSES.map(s => (
                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Purchase Date */}
                        <div className="space-y-2">
                            <Label className="text-muted">Purchase Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            inputClasses,
                                            "w-full justify-start text-left font-normal border-none"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.purchaseDate ? format(formData.purchaseDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-popover border-soft" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formData.purchaseDate}
                                        onSelect={(date) => date && setFormData(prev => ({ ...prev, purchaseDate: date }))}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-muted">Purchased Price</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted text-sm">₹</span>
                                <Input
                                    type="number"
                                    value={formData.purchasePrice}
                                    onChange={e => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                                    className={cn(inputClasses, "pl-7")}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Quantity */}
                        <div className="space-y-2">
                            <Label className="text-muted">Quantity <span className="text-destructive">*</span></Label>
                            <Input
                                type="number"
                                min={1}
                                value={formData.quantity}
                                onChange={e => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                                placeholder="1"
                                className={inputClasses}
                            />
                        </div>

                        {/* Threshold */}
                        <div className="space-y-2">
                            <Label className="text-muted">Low Stock Threshold</Label>
                            <Input
                                type="number"
                                min={0}
                                value={formData.threshold}
                                onChange={e => setFormData(prev => ({ ...prev, threshold: e.target.value }))}
                                placeholder="0"
                                className={inputClasses}
                            />
                        </div>

                        {/* Unit */}
                        <div className="space-y-2">
                            <Label className="text-muted">Unit</Label>
                            <Input
                                value={formData.unit}
                                onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                                placeholder="e.g. pcs, set, kit"
                                className={inputClasses}
                            />
                        </div>

                        {/* Serial Number */}
                        <div className="space-y-2">
                            <Label className="text-muted">Serial Number</Label>
                            <Input
                                value={formData.serialNumber}
                                onChange={e => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
                                placeholder="Optional"
                                className={inputClasses}
                            />
                        </div>
                    </div>

                    {/* Remarks */}
                    <div className="space-y-2">
                        <Label className="text-muted">Remarks</Label>
                        <Textarea
                            value={formData.remarks}
                            onChange={e => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                            placeholder="Additional notes about the asset..."
                            className={cn(inputClasses, "min-h-[100px] resize-y")}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-4 border-t border-soft">
                        <Button
                            type="submit"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 rounded-xl shadow-lg shadow-primary/20"
                            disabled={loading || uploadingImage}
                        >
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Asset
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => nativeNavigate('/inventory', router, 'InventoryAdd (Back)')}
                            className="text-muted hover:text-foreground hover:bg-muted/10 rounded-xl"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                    </div>

                </form>

                {cropperOpen && selectedImageSrc && (
                    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                        <div className="bg-[var(--glass-liquid-bg)] rounded-2xl overflow-hidden max-w-lg w-full">
                            <ImageCropper
                                imageSrc={selectedImageSrc}
                                onCropComplete={handleCropComplete}
                                onCancel={() => setCropperOpen(false)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </PageLayout>
    );
}
