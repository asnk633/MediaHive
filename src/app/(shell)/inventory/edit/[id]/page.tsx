"use client";

import React, { useState, useRef, useEffect } from "react";
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
import { Save, Loader2, Image as ImageIcon, X, Upload, Info } from "lucide-react";
import { toast } from "sonner";
import { FileService } from "@/services/fileService";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { INVENTORY_CATEGORIES, INVENTORY_GUIDE, InventoryCondition, InventoryAssetStatus } from "@/types/inventory";
import { inventoryService } from "@/services/inventoryService";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

export default function EditInventoryPage({ params }: { params: Promise<{ id: string }> }) {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [uploadingImage, setUploadingImage] = useState(false);
    const { id } = React.use(params);

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

    // Fetch Data
    useEffect(() => {
        if (!id) return;
        const fetchItem = async () => {
            try {
                // @ts-ignore
                const item = await inventoryService.getById(id);
                if (!item) {
                    toast.error("Item not found");
                    router.push('/inventory');
                    return;
                }

                setFormData({
                    name: item.name,
                    category: item.category,
                    condition: (item.condition || "good") as InventoryCondition,
                    status: (item.assetStatus || item.status || "available") as InventoryAssetStatus,
                    purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : new Date(),
                    purchasePrice: item.purchasePrice?.toString() || "",
                    unit: item.unit || "1",
                    serialNumber: item.serialNumber || "",
                    remarks: item.remarks || "",
                    imageUrl: item.imageUrl || "",
                    driveFileId: item.driveFileId || "",
                    images: item.images || (item.imageUrl ? [{ url: item.imageUrl, fileId: item.driveFileId || "" }] : [])
                });
            } catch (error) {
                console.error("Failed to fetch item:", error);
                toast.error("Failed to load asset details");
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
    }, [id, router]);

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
                    const updatedImages = [...prev.images, newImage];
                    return {
                        ...prev,
                        imageUrl: prev.imageUrl || newImage.url,
                        driveFileId: prev.driveFileId || newImage.fileId,
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
            const nextMain = newImages[0];
            return {
                ...prev,
                images: newImages,
                imageUrl: nextMain ? nextMain.url : "",
                driveFileId: nextMain ? nextMain.fileId : ""
            };
        });
    };

    const handleMainImageSet = (image: { url: string, fileId: string }) => {
        setFormData(prev => ({
            ...prev,
            imageUrl: image.url,
            driveFileId: image.fileId
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) return toast.error("Asset Name is required");
        if (!formData.category) return toast.error("Category is required");
        if (!formData.condition) return toast.error("Condition is required");
        if (!formData.status) return toast.error("Status is required");

        try {
            setLoading(true);
            const payload = {
                name: formData.name,
                category: formData.category,
                quantity: Number(formData.unit) || 1, // Fallback to 1 if unit is just text, though this field is tricky. Keeping logic simple.
                // Wait, unit is a string (pcs), quantity is a number. 
                // In Add page: quantity: 1 was hardcoded. 
                // Let's use 1 as default but if we want to support bulk later we should.
                // For now, keeping logic consistent with Add Page.
                unit: formData.unit,
                assetStatus: formData.status,
                condition: formData.condition,
                serialNumber: formData.serialNumber,
                remarks: formData.remarks,
                purchaseDate: formData.purchaseDate.toISOString(),
                purchasePrice: Number(formData.purchasePrice) || 0,
                imageUrl: formData.imageUrl,
                driveFileId: formData.driveFileId,
                images: formData.images,
            };

            // @ts-ignore
            await inventoryService.update(id, payload, user);

            toast.success("Asset updated successfully");
            router.push('/inventory');
        } catch (error) {
            console.error(error);
            toast.error("Failed to update asset");
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

    if (loading) {
        return (
            <PageLayout mode="plain">
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Edit Asset"
                description={`Updating details for ${formData.name || 'asset'}`}
            />

            <div className="max-w-3xl mx-auto pb-20">
                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Image Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-slate-300">Asset Images ({formData.images.length}/5)</Label>
                            {formData.images.length > 0 && <span className="text-xs text-slate-500">First image is cover</span>}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {formData.images.map((img, idx) => (
                                <div key={idx} className={cn(
                                    "aspect-square rounded-2xl relative group overflow-hidden border border-white/10 bg-black/20",
                                    formData.imageUrl === img.url && "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0b1220]"
                                )}>
                                    <img src={img.url} alt={`Asset ${idx}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                        {formData.imageUrl !== img.url && (
                                            <button
                                                type="button"
                                                onClick={() => handleMainImageSet(img)}
                                                className="text-[10px] bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-2 py-1 rounded-full transition-colors"
                                            >
                                                Make Cover
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(idx)}
                                            className="text-red-400 hover:text-white p-1.5 rounded-full hover:bg-red-500/20 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    {formData.imageUrl === img.url && (
                                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                                            Cover
                                        </div>
                                    )}
                                </div>
                            ))}

                            {formData.images.length < 5 && (
                                <div
                                    onClick={() => !uploadingImage && fileInputRef.current?.click()}
                                    className={cn(
                                        "aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all group overflow-hidden relative",
                                        uploadingImage && "pointer-events-none opacity-50"
                                    )}
                                >
                                    {uploadingImage ? (
                                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                    ) : (
                                        <>
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mb-2 group-hover:bg-blue-500/20 transition-colors">
                                                <Upload className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <span className="text-xs text-slate-400">Add Photo</span>
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
                            <div className="flex items-center gap-2">
                                <Label className="text-slate-300">Category <span className="text-red-400">*</span></Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button type="button" className="text-slate-500 hover:text-white transition-colors">
                                            <Info className="w-4 h-4" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-96 p-0 bg-slate-950/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden"
                                        align="start"
                                        sideOffset={8}
                                    >
                                        <div className="p-4 border-b border-white/5 bg-white/5">
                                            <div className="flex items-center gap-2 text-white font-medium">
                                                <Info className="w-4 h-4 text-blue-400" />
                                                <h3>Categorization Guide</h3>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">Select the most accurate category for your asset.</p>
                                        </div>

                                        <div className="max-h-[400px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                            <div className="space-y-1">
                                                {Object.entries(INVENTORY_GUIDE).map(([cat, desc]) => (
                                                    <div key={cat} className="group p-3 hover:bg-white/5 rounded-xl transition-colors">
                                                        <span className="text-blue-400 font-medium text-sm block mb-1 group-hover:text-blue-300 transition-colors">{cat}</span>
                                                        <span className="text-slate-400 text-xs leading-relaxed block">{desc}</span>
                                                    </div>
                                                ))}
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
                        </div>

                        {/* Condition */}
                        <div className="space-y-2">
                            <Label className="text-slate-300">Condition <span className="text-red-400">*</span></Label>
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
                            <Label className="text-slate-300">Status <span className="text-red-400">*</span></Label>
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

                        <div className="space-y-2">
                            <Label className="text-slate-300">Purchased Price</Label>
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
                            Update Asset
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
