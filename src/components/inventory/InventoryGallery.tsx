import React, { useState } from "react";
import { getDriveImageUrl } from "@/lib/driveUtils";
import { X, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface InventoryGalleryProps {
    images: { url: string; file_id: string }[];
    name: string;
}

export function InventoryGallery({ images, name }: InventoryGalleryProps) {
    if (!images || images.length === 0) return null;

    if (images.length === 1) {
        return (
            <div className="flex justify-center w-full">
                <ImageCard src={images[0].url} alt={`${name} - View 1`} className="w-auto h-auto max-w-full max-h-[500px]" />
            </div>
        );
    }

    if (images.length === 2) {
        return (
            <div className="grid grid-cols-2 gap-4 h-[300px] md:h-[400px]">
                <ImageCard src={images[0].url} alt={`${name} - View 1`} className="h-full" />
                <ImageCard src={images[1].url} alt={`${name} - View 2`} className="h-full" />
            </div>
        );
    }

    // 3 Images: Bento Grid (Main Left, Two Stacked Right)
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[400px] md:h-[500px]">
            {/* Main Hero Image (Col Span 2) */}
            <div className="md:col-span-2 h-full">
                <ImageCard src={images[0].url} alt={`${name} - Main`} className="h-full" priority />
            </div>

            {/* Stacked Side Images */}
            <div className="flex flex-col gap-4 h-full">
                <div className="flex-1 h-1/2">
                    <ImageCard src={images[1].url} alt={`${name} - Side 1`} className="h-full" />
                </div>
                <div className="flex-1 h-1/2">
                    <ImageCard src={images[2].url} alt={`${name} - Side 2`} className="h-full" />
                </div>
            </div>
        </div>
    );
}

function ImageCard({ src, alt, className, priority }: { src: string; alt: string; className?: string; priority?: boolean }) {
    const imageUrl = getDriveImageUrl(src);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className={cn("relative rounded-2xl overflow-hidden border border-slate-700/50 group cursor-zoom-in bg-black/20", className)}>
                    <img
                        src={imageUrl}
                        alt={alt}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100" />
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] md:max-w-[90vw] h-[90vh] bg-transparent border-none shadow-none flex items-center justify-center p-0">
                <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                    <img
                        src={imageUrl}
                        alt={alt}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-auto"
                        referrerPolicy="no-referrer"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
