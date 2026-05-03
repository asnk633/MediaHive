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
            <DialogContent className="sm:max-w-xl bg-slate-900 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-blue-400" />
                        Edit Profile Picture
                    </DialogTitle>
                </DialogHeader>

                <div className="relative w-full h-80 bg-black/50 rounded-xl overflow-hidden mt-4 border border-white/5">
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
                        />
                    )}
                </div>

                <div className="space-y-6 mt-6">
                    {/* Zoom Control */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <Label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <ZoomIn className="w-4 h-4" />
                                Zoom
                            </Label>
                            <span className="text-xs text-slate-500">{Math.round(zoom * 100)}%</span>
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
                    <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <Label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                <RotateCw className="w-4 h-4" />
                                Rotation
                            </Label>
                            <span className="text-xs text-slate-500">{rotation}°</span>
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

                <div className="flex gap-3 mt-8">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 border-[#ffffff1a] text-slate-400 hover:text-white"
                        disabled={isUploading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                        disabled={isUploading || !imageSrc}
                    >
                        {isUploading ? 'Applying...' : 'Save Avatar'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
