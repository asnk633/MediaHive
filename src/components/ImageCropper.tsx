"use client";

import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImageCropperProps {
    imageUrl: string;
    onCropComplete: (croppedImage: string) => void;
    onCancel: () => void;
}

export default function ImageCropper({ imageUrl, onCropComplete, onCancel }: ImageCropperProps) {
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (imageRef.current && canvasRef.current) {
            drawImage();
        }
    }, [scale, rotation, position, imageUrl]);

    // Close on Escape (Task 79)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    const drawImage = () => {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        if (!canvas || !img) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = 300; // Canvas size
        canvas.width = size;
        canvas.height = size;

        ctx.clearRect(0, 0, size, size);
        ctx.save();

        // Translate to center
        ctx.translate(size / 2, size / 2);

        // Apply rotation
        ctx.rotate((rotation * Math.PI) / 180);

        // Apply scale and position
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        ctx.drawImage(
            img,
            -scaledWidth / 2 + position.x,
            -scaledHeight / 2 + position.y,
            scaledWidth,
            scaledHeight
        );

        ctx.restore();
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        setIsDragging(true);
        setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        setPosition({
            x: touch.clientX - dragStart.x,
            y: touch.clientY - dragStart.y,
        });
    };

    const handleCrop = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Create cropped circular image
        const croppedCanvas = document.createElement('canvas');
        const size = 300;
        croppedCanvas.width = size;
        croppedCanvas.height = size;
        const ctx = croppedCanvas.getContext('2d');

        if (!ctx) return;

        // Draw circular clip
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw the cropped image
        ctx.drawImage(canvas, 0, 0);

        // Convert to base64
        const croppedImage = croppedCanvas.toDataURL('image/jpeg', 0.9);
        onCropComplete(croppedImage);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] rounded-2xl max-w-md w-full p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Crop Profile Picture</h3>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-[var(--bg-panel)] rounded-full transition-colors"
                    >
                        <X size={20} className="text-[var(--text-secondary)]" />
                    </button>
                </div>

                {/* Hidden image for loading */}
                <img
                    ref={imageRef}
                    src={imageUrl}
                    alt="Crop preview"
                    className="hidden"
                    crossOrigin="anonymous"
                    onLoad={drawImage}
                />

                {/* Crop Area */}
                <div className="relative mb-4">
                    <div
                        ref={containerRef}
                        className="relative mx-auto"
                        style={{ width: 300, height: 300 }}
                    >
                        {/* Circular overlay guide */}
                        <div className="absolute inset-0 rounded-full border-4 border-white border-opacity-50 pointer-events-none z-10" />

                        <canvas
                            ref={canvasRef}
                            className="rounded-full cursor-move select-none"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleMouseUp}
                        />
                    </div>

                    <p className="text-xs text-center text-[var(--text-secondary)] mt-2">
                        Drag to reposition • Pinch or use controls to zoom
                    </p>
                </div>

                {/* Controls */}
                <div className="space-y-4 mb-6">
                    {/* Zoom */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-2">
                            <ZoomIn size={14} />
                            Zoom
                        </label>
                        <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.1"
                            value={scale}
                            onChange={(e) => setScale(parseFloat(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    {/* Rotation */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-2">
                            <RotateCw size={14} />
                            Rotation
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="360"
                            step="1"
                            value={rotation}
                            onChange={(e) => setRotation(parseInt(e.target.value))}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl bg-[var(--bg-panel)] hover:bg-[var(--bg-panel)] text-[var(--text-primary)] font-medium text-sm transition-colors border border-[var(--border-subtle)]"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCrop}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-lg shadow-blue-500/20"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
}
