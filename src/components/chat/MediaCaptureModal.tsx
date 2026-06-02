'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface MediaCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
}

export const MediaCaptureModal: React.FC<MediaCaptureModalProps> = ({
    isOpen,
    onClose,
    onCapture
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen]);

    const startCamera = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const constraints = {
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
            };
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err: any) {
            if (err.name === 'NotFoundError' || err.message?.toLowerCase().includes('device not found') || err.message?.toLowerCase().includes('requested device not found')) {
                console.warn('Camera hardware not detected:', err.message || err);
                setError('No camera found on this device. Please connect a webcam.');
                toast.error('Camera device not found');
            } else {
                console.error('Error accessing camera:', err);
                setError('Could not access your camera. Please ensure permissions are granted.');
                toast.error('Camera access denied');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleCapture = () => {
        if (!videoRef.current) return;

        try {
            const video = videoRef.current;
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;

            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');

            // Draw current video frame onto canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to Blob and then File
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    onCapture(file);
                    stopCamera();
                    onClose();
                }
            }, 'image/jpeg', 0.9);
        } catch (err) {
            console.error('Failed to capture snapshot:', err);
            toast.error('Failed to capture photo');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl bg-[#090d1f]/95 border border-white/[0.08] text-white shadow-2xl p-0 overflow-hidden backdrop-blur-xl">
                <div className="p-5 border-b border-white/[0.05] bg-black/20 flex items-center justify-between">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-sm font-semibold tracking-wider uppercase typo-label">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Camera className="w-4 h-4 text-emerald-400" />
                            </div>
                            Take Picture
                        </DialogTitle>
                    </DialogHeader>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={onClose} 
                        className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/[0.05] rounded-lg"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-6 flex flex-col items-center justify-center space-y-6">
                    <div className="relative w-full aspect-video bg-black/40 rounded-2xl overflow-hidden border border-white/[0.06] shadow-inner flex items-center justify-center">
                        {error ? (
                          <div className="p-6 text-center text-rose-400 flex flex-col items-center gap-3">
                              <AlertCircle className="w-8 h-8 text-rose-500 animate-bounce" />
                              <p className="text-xs max-w-sm font-light leading-relaxed">{error}</p>
                              <Button 
                                  onClick={startCamera} 
                                  variant="outline" 
                                  size="sm"
                                  className="mt-2 border-white/10 hover:bg-white/5 hover:text-white rounded-xl text-[10px]"
                              >
                                  <RefreshCw className="w-3 h-3 mr-2" />
                                  Retry Camera
                              </Button>
                          </div>
                        ) : isLoading ? (
                          <div className="flex flex-col items-center gap-3">
                              <div className="w-6 h-6 border-2 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
                              <p className="text-[10px] text-white/30 tracking-widest uppercase typo-mono">Starting Lens...</p>
                          </div>
                        ) : (
                          <video 
                              ref={videoRef} 
                              autoPlay 
                              playsInline 
                              muted 
                              className="w-full h-full object-cover transform -scale-x-100" 
                          />
                        )}
                    </div>

                    {!error && !isLoading && stream && (
                        <div className="w-full flex gap-3">
                            <Button 
                                variant="ghost" 
                                onClick={onClose}
                                className="flex-1 border-white/5 text-white/60 hover:text-white hover:bg-white/5 font-medium rounded-xl h-10 transition-all text-xs"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleCapture}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 rounded-xl h-10 transition-all active:scale-[0.98] text-xs flex items-center justify-center gap-2"
                            >
                                <Camera className="w-4 h-4" />
                                Snap Photo
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
