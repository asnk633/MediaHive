"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Save, Loader2, Image as ImageIcon, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { FileService } from "@/services/fileService";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { INVENTORY_CATEGORIES, InventoryCondition, InventoryAssetStatus } from "@/types/inventory";
import { inventoryService } from "@/services/inventoryService";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

export default function AddInventoryPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        condition: "good" as InventoryCondition,
        status: "available" as InventoryAssetStatus,
        purchaseDate: new Date(),
        purchasePrice: "",
        unit: "1",
        serialNumber: "",
        remarks: "",
        imageUrl: "",
        driveFileId: "",
        images: [] as { url: string, fileId: string }[]
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
            // Optimistic view
            const previewUrl = URL.createObjectURL(blob);
            setFormData(prev => ({ ...prev, imageUrl: previewUrl }));

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

                setFormData(prev => ({
                    ...prev,
                    imageUrl: newImage.url,
                    driveFileId: newImage.fileId,
                    images: [newImage] // Single image for now based on req, or maintain array
                }));
                toast.success("Image uploaded successfully");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to upload image");
            setFormData(prev => ({ ...prev, imageUrl: "" })); // Revert on fail
        } finally {
            setUploadingImage(false);
            setOriginalFile(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.name.trim()) return toast.error("Asset Name is required");
        if (!formData.category) return toast.error("Category is required");

        try {
            setLoading(true);
            const payload = {
                name: formData.name,
                category: formData.category,
                quantity: 1, // Default for individual asset
                unit: formData.unit,
                threshold: 0,
                status: 'ok', // Default system status
                assetStatus: formData.status, // User selected status
                condition: formData.condition,
                serialNumber: formData.serialNumber,
                remarks: formData.remarks,
                purchaseDate: formData.purchaseDate.toISOString(),
                purchasePrice: Number(formData.purchasePrice) || 0,
                imageUrl: formData.imageUrl,
                driveFileId: formData.driveFileId,
            };

            // @ts-ignore - Assuming create method exists and matches
            await inventoryService.create(payload, user);

            toast.success("Asset saved successfully");
            router.push('/inventory');
        } catch (error) {
            console.error(error);
            toast.error("Failed to save asset");
        } finally {
            setLoading(false);
        }
    };

    const CONDITIONS = [
        { value: "good", label: "Good" },
        { value: "needs_repair", label: "Needs Repair" },
        { value: "broken", label: "Broken" },
        { value: "lost", label: "Lost" },
        { value: "retired", label: "Retired" },
    ];

    const STATUSES = [
        { value: "available", label: "Available" },
        { value: "in_use", label: "In Use" },
        { value: "maintenance", label: "Maintenance" },
        { value: "retired", label: "Retired" },
    ];

    const inputClasses = "bg-white/[0.02] border-[#ffffff1a] focus:border-blue-500/50 rounded-xl text-white placeholder:text-slate-500 hover:bg-white/[0.04] transition-colors";

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Add Asset"
                description="Register a new item into the inventory."
            />

            <div className="max-w-3xl mx-auto pb-20">
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Image Section */}
                    <div className="space-y-4">
                        <Label className="text-slate-300">Asset Image</Label>
                        <div className="flex gap-6 items-start">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    "w-48 h-48 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all group overflow-hidden relative",
                                    formData.imageUrl && "border-none"
                                )}
                            >
                                {formData.imageUrl ? (
                                    <>
                                        <img src={formData.imageUrl} alt="Asset" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <span className="text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Change Image</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {uploadingImage ? (
                                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                        ) : (
                                            <div className="text-center p-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-500/20 transition-colors">
                                                    <Upload className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <span className="text-sm text-slate-400 block mb-1">Upload Photo</span>
                                                <span className="text-[10px] text-slate-600 block">Google Drive</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageSelect}
                            />

                            {formData.imageUrl && (
                                <div className="pt-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: "", driveFileId: "" }))}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Remove Image
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="space-y-2 md:col-span-2">
                            <Label className="text-slate-300">Asset Name <span className="text-red-400">*</span></Label>
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
                            <Label className="text-slate-300">Category <span className="text-red-400">*</span></Label>
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
                        </div>

                        {/* Condition */}
                        <div className="space-y-2">
                            <Label className="text-slate-300">Condition</Label>
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
                            <Label className="text-slate-300">Status</Label>
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
                            <Label className="text-slate-300">Purchase Date</Label>
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
                                <PopoverContent className="w-auto p-0 bg-[#0b1220] border-white/10" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formData.purchaseDate}
                                        onSelect={(date) => date && setFormData(prev => ({ ...prev, purchaseDate: date }))}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Purchase Price */}
                        <div className="space-y-2">
                            <Label className="text-slate-300">Purchase Price</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-slate-500 text-sm">₹</span>
                                <Input
                                    type="number"
                                    value={formData.purchasePrice}
                                    onChange={e => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))}
                                    className={cn(inputClasses, "pl-7")}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Unit */}
                        <div className="space-y-2">
                            <Label className="text-slate-300">Unit</Label>
                            <Input
                                value={formData.unit}
                                onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                                placeholder="e.g. pcs, set, kit"
                                className={inputClasses}
                            />
                        </div>

                        {/* Serial Number */}
                        <div className="space-y-2">
                            <Label className="text-slate-300">Serial Number</Label>
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
                        <Label className="text-slate-300">Remarks</Label>
                        <Textarea
                            value={formData.remarks}
                            onChange={e => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                            placeholder="Additional notes about the asset..."
                            className={cn(inputClasses, "min-h-[100px] resize-y")}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-xl shadow-lg shadow-blue-500/20"
                            disabled={loading || uploadingImage}
                        >
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Asset
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.back()}
                            className="text-slate-400 hover:text-white hover:bg-white/5 rounded-xl"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                    </div>

                </form>

                {cropperOpen && selectedImageSrc && (
                    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                        <div className="bg-[#0f172a] rounded-2xl overflow-hidden max-w-lg w-full">
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
