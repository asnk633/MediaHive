'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ZoomIn, ZoomOut, RotateCw, Image as ImageIcon } from 'lucide-react';
import getCroppedImg from '@/lib/imageCrop';
import { supabase } from '@/lib/supabaseClient';

interface GroupIconUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string | null;
    roomId: string;
    onRoomUpdated?: (updatedRoom: any) => void;
}

export const GroupIconUploadModal: React.FC<GroupIconUploadModalProps> = ({
    isOpen,
    onClose,
    imageSrc,
    roomId,
    onRoomUpdated
}) => {
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
                const formData = new FormData();
                formData.append('file', croppedImage);
                formData.append('roomId', roomId);

                const uploadRes = await fetch('https://thaiba-garden-media-manager.vercel.app/api/chat/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (!uploadRes.ok) throw new Error('Upload failed');
                const uploadData = await uploadRes.json();
                const directUrl = uploadData.url;

                // Update room in DB directly
                const { error } = await supabase
                    .from('chat_rooms')
                    .update({ icon_url: directUrl })
                    .eq('id', roomId);

                if (error) throw error;

                if (onRoomUpdated) {
                    onRoomUpdated({ id: roomId, icon_url: directUrl });
                }
                onClose();
            }
        } catch (error) {
            console.error('Failed to crop/upload image:', error);
            alert('Failed to update group photo');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl bg-zinc-950 border border-white/5 text-zinc-100 p-0 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 bg-zinc-900/50">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-lg font-semibold tracking-tight text-white">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <ImageIcon className="w-5 h-5 text-indigo-400" />
                            </div>
                            Edit Group Icon Photo
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Upload and crop a new image for the group chat icon.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-8">
                    <div className="relative w-full h-80 bg-black/40 rounded-2xl overflow-hidden border border-white/5 shadow-inner">
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
                                cropShape="rect"
                                showGrid={false}
                                classes={{
                                    containerClassName: "rounded-2xl",
                                }}
                            />
                        )}
                    </div>

                    <div className="space-y-8 px-2">
                        {/* Scale Control */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-semibold text-zinc-300 flex items-center gap-2.5">
                                    <ZoomIn className="w-4 h-4 text-indigo-400" />
                                    Scale Image
                                </Label>
                                <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                    {Math.round(zoom * 100)}%
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <ZoomOut className="w-4 h-4 text-zinc-500" />
                                <Slider
                                    value={[zoom]}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    onValueChange={([val]) => setZoom(val)}
                                    className="flex-1"
                                />
                                <ZoomIn className="w-4 h-4 text-zinc-500" />
                            </div>
                        </div>

                        {/* Rotation Control */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-semibold text-zinc-300 flex items-center gap-2.5">
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

                <div className="p-6 bg-zinc-900/50 border-t border-white/5 flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 border-white/5 text-zinc-400 hover:text-white hover:bg-white/5 font-medium transition-all"
                        disabled={isUploading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
                        disabled={isUploading || !imageSrc}
                    >
                        {isUploading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
