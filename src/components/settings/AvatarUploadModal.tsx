'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ZoomIn, ZoomOut, RotateCw, Image as ImageIcon } from 'lucide-react';
import getCroppedImg from '@/lib/imageCrop';
import { uploadProfilePicture } from '@/services/profilePicture';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContextProvider';

interface AvatarUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string | null;
    userId: string;
}

export const AvatarUploadModal: React.FC<AvatarUploadModalProps> = ({
    isOpen,
    onClose,
    imageSrc,
    userId
}) => {
    const { refreshUser } = useAuth();
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        setIsUploading(true);
        try {
            const croppedImage = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                rotation
            );

            if (croppedImage) {
                await uploadProfilePicture(userId, croppedImage);
                await refreshUser(); // Trigger UI state update
                toast.success('Avatar updated successfully!');
                onClose();
            }
        } catch (error) {
            console.error('Failed to crop/upload image:', error);
            toast.error('Failed to update avatar');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl bg-[var(--glass-liquid-bg)] border border-foreground/10 text-foreground shadow-2xl p-0 overflow-hidden">
                <div className="p-6 border-b border-foreground/5 bg-slate-900/50">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-lg font-semibold tracking-tight">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <ImageIcon className="w-5 h-5 text-blue-400" />
                            </div>
                            Edit Profile Picture
                        </DialogTitle>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-8">
                    <div className="relative w-full h-80 bg-black/40 rounded-2xl overflow-hidden border border-foreground/5 shadow-inner">
                        {imageSrc && (
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                cropShape="round"
                                showGrid={false}
                                classes={{
                                    containerClassName: "rounded-2xl",
                                }}
                            />
                        )}
                    </div>

                    <div className="space-y-8 px-2">
                        {/* Zoom Control */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-semibold text-slate-300 flex items-center gap-2.5">
                                    <ZoomIn className="w-4 h-4 text-blue-400" />
                                    Scale Image
                                </Label>
                                <span className="text-xs font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                                    {Math.round(zoom * 100)}%
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <ZoomOut className="w-4 h-4 text-slate-500" />
                                <Slider
                                    value={[zoom]}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    onValueChange={([val]) => setZoom(val)}
                                    className="flex-1"
                                />
                                <ZoomIn className="w-4 h-4 text-slate-500" />
                            </div>
                        </div>

                        {/* Rotation Control */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-semibold text-slate-300 flex items-center gap-2.5">
                                    <RotateCw className="w-4 h-4 text-emerald-400" />
                                    Rotate
                                </Label>
                                <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    {rotation}°
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <Slider
                                    value={[rotation]}
                                    min={0}
                                    max={360}
                                    step={1}
                                    onValueChange={([val]) => setRotation(val)}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-900/50 border-t border-foreground/5 flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 border-foreground/5 text-slate-400 hover:text-foreground hover:bg-foreground/5 font-medium transition-all"
                        disabled={isUploading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-foreground font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
                        disabled={isUploading || !imageSrc}
                    >
                        {isUploading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-foreground/30 border-t-white rounded-full animate-spin" />
                                Applying...
                            </div>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
