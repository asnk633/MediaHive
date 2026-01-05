import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, Check, X, Move, Square, RectangleHorizontal, RectangleVertical, Monitor, Smartphone } from 'lucide-react';
import { cn } from "@/lib/utils";

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (blob: Blob) => void;
    onCancel: () => void;
}

const ASPECT_RATIOS = [
    { label: "Square", value: 1, icon: Square },
    { label: "Landscape", value: 1.91, icon: RectangleHorizontal },
    { label: "Portrait", value: 0.8, icon: RectangleVertical }, // 4:5
    { label: "Wide", value: 1.77, icon: Monitor }, // 16:9
    { label: "Story", value: 0.56, icon: Smartphone }, // 9:16
];

export function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
    const [zoom, setZoom] = useState(1);
    const [aspectRatio, setAspectRatio] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);

    // Calculate dynamic canvas size based on aspect ratio
    const MAX_SIZE = 400;
    let canvasWidth = MAX_SIZE;
    let canvasHeight = MAX_SIZE;

    if (aspectRatio > 1) {
        // Wide
        canvasWidth = MAX_SIZE;
        canvasHeight = MAX_SIZE / aspectRatio;
    } else {
        // Tall or Square
        canvasHeight = MAX_SIZE;
        canvasWidth = MAX_SIZE * aspectRatio;
    }

    // Load image
    useEffect(() => {
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            imageRef.current = img;
            draw();
        };
    }, [imageSrc]);

    // Draw canvas
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        if (!canvas || !img) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas with black background (for zoom out)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate aspect ratios
        const canvasAspect = canvas.width / canvas.height;
        const imgAspect = img.width / img.height;

        let drawWidth, drawHeight;

        // Fit image to canvas (cover) logic
        // If image is wider than canvas (relative to aspect), fit height
        if (imgAspect > canvasAspect) {
            drawHeight = canvas.height;
            drawWidth = canvas.height * imgAspect;
        } else {
            drawWidth = canvas.width;
            drawHeight = canvas.width / imgAspect;
        }

        // Apply Zoom
        const zoomedWidth = drawWidth * zoom;
        const zoomedHeight = drawHeight * zoom;

        // Center position with offset
        const centerX = (canvas.width - zoomedWidth) / 2 + offset.x;
        const centerY = (canvas.height - zoomedHeight) / 2 + offset.y;

        ctx.drawImage(img, centerX, centerY, zoomedWidth, zoomedHeight);
    }, [zoom, offset, canvasWidth, canvasHeight]); // Re-draw when dimensions change

    useEffect(() => {
        draw();
    }, [draw, zoom, offset, aspectRatio]);

    // Reset Zoom/Offset when ratio changes
    const handleRatioChange = (ratio: number) => {
        setAspectRatio(ratio);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
    };

    // Pinch Zoom State
    const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
    const prevPinchDist = useRef<number | null>(null);

    // Pan Handling
    const handlePointerDown = (e: React.PointerEvent) => {
        // Track pointer
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);

        // Check for Pinch
        if (pointers.current.size === 2) {
            // Start Pinch
            const points = Array.from(pointers.current.values());
            const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
            prevPinchDist.current = dist;
            setIsDragging(false); // Disable pan while pinching
        } else if (pointers.current.size === 1) {
            // Start Pan
            setIsDragging(true);
            setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        // Update pointer position
        if (pointers.current.has(e.pointerId)) {
            pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }

        // Pinch Logic
        if (pointers.current.size === 2) {
            const points = Array.from(pointers.current.values());
            const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);

            if (prevPinchDist.current !== null) {
                const delta = dist - prevPinchDist.current;
                // Sensible zoom speed factor
                const zoomFactor = delta * 0.005;

                setZoom(prev => {
                    const newZoom = Math.min(Math.max(prev + zoomFactor, 0.5), 3);
                    return newZoom;
                });
            }
            prevPinchDist.current = dist;
            return;
        }

        // Pan Logic
        if (!isDragging || pointers.current.size !== 1) return;
        setOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        pointers.current.delete(e.pointerId);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);

        if (pointers.current.size < 2) {
            prevPinchDist.current = null;
        }

        if (pointers.current.size === 0) {
            setIsDragging(false);
        } else if (pointers.current.size === 1) {
            // If one finger remains, switch to panning (avoid jump by resetting dragStart)
            const p = pointers.current.values().next().value;
            if (p) {
                setDragStart({ x: p.x - offset.x, y: p.y - offset.y });
                setIsDragging(true);
            }
        }
    };

    const handleSave = () => {
        if (!canvasRef.current) return;
        canvasRef.current.toBlob((blob) => {
            if (blob) onCropComplete(blob);
        }, 'image/jpeg', 0.95);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Adjust Image</h3>
                    <Button type="button" variant="ghost" size="icon" onClick={onCancel} className="bg-white/5 hover:bg-white/10 text-white rounded-full h-8 w-8">
                        <X size={16} />
                    </Button>
                </div>

                {/* Aspect Ratio Toolbar */}
                <div className="flex gap-2 justify-center pb-2 overflow-x-auto">
                    {ASPECT_RATIOS.map((ratio) => (
                        <button
                            key={ratio.label}
                            type="button"
                            onClick={() => handleRatioChange(ratio.value)}
                            className={cn(
                                "flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all min-w-[60px]",
                                aspectRatio === ratio.value
                                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/50"
                                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-transparent"
                            )}
                        >
                            <ratio.icon size={20} />
                            <span className="text-[10px] font-medium">{ratio.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-center bg-black/50 rounded-xl border border-white/10 p-4 min-h-[300px]">
                    <div
                        ref={containerRef}
                        className="relative overflow-hidden cursor-move touch-none shadow-2xl"
                        style={{ width: canvasWidth, height: canvasHeight }}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                    >
                        <canvas
                            ref={canvasRef}
                            width={canvasWidth}
                            height={canvasHeight}
                            className="w-full h-full object-contain pointer-events-none"
                        />
                        {/* Grid Overlay */}
                        <div className="absolute inset-0 pointer-events-none border border-white/30">
                            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
                            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
                            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
                            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
                        </div>
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-700">
                            <Move className="text-white/50 drop-shadow-md" size={32} />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-4 px-2">
                        <ZoomOut size={16} className="text-white/50" />
                        <Slider
                            value={[zoom]}
                            min={0.5}
                            max={3}
                            step={0.1}
                            onValueChange={(val) => setZoom(val[0])}
                            className="flex-1"
                        />
                        <ZoomIn size={16} className="text-white/50" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            className="bg-blue-600 hover:bg-blue-500 text-white"
                        >
                            <Check size={18} className="mr-2" />
                            Use Photo
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
