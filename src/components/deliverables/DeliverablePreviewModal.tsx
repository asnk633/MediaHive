import React, { useEffect } from 'react';
import { Deliverable } from '@/types/deliverable';
import { X, ChevronLeft, ChevronRight, Download, ExternalLink, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface DeliverablePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    deliverable: Deliverable | null;
    versionIndex: number;
    totalVersions: number;
    onNavigate: (direction: 'prev' | 'next') => void;
    canOpenDrive: boolean;
}

export const DeliverablePreviewModal: React.FC<DeliverablePreviewModalProps> = ({
    isOpen,
    onClose,
    deliverable,
    versionIndex,
    totalVersions,
    onNavigate,
    canOpenDrive
}) => {
    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') onNavigate('next'); // Newer/Older direction might be flipped visually, let's assume 'next' means older in list (down) but usually left is older version... wait. 
            // Deliverables list is sorted desc (newest first). 
            // Index 0 = Newest.
            // Next Index = Older version.
            // Prev Index = Newer version.
            // UI: Left Arrow (Older?) | Right Arrow (Newer?)
            // Let's stick to simple Prev/Next props and let parent handle index math.
            if (e.key === 'ArrowLeft') onNavigate('prev');
            if (e.key === 'ArrowRight') onNavigate('next');
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, onNavigate]);

    if (!isOpen || !deliverable) return null;

    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(deliverable.fileName);
    const isVideo = /\.(mp4|mov|webm)$/i.test(deliverable.fileName);
    // Drive preview link works for mostly everything including PDFs and Videos
    const previewUrl = `https://drive.google.com/file/d/${deliverable.driveFileId}/preview`;
    const viewUrl = `https://drive.google.com/file/d/${deliverable.driveFileId}/view`;

    // Determine if we can navigate
    // List is usually ordered Newest (0) -> Oldest (Last).
    // If we are at 0, we can't go 'Newer' (which I'll map to Right for now, or just Up).
    // Let's rely on parent to pass "hasNext/hasPrev" or just handle index checks safely.
    // Actually props say versionIndex/total. 
    // 0 is latest. total-1 is oldest.

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-6xl h-full max-h-[90vh] bg-[#0F172A] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#1e293b]/50">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                    <FileText size={20} />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-semibold text-white truncate pr-4">
                                        {deliverable.fileName}
                                    </h3>
                                    <p className="text-xs text-blue-300 font-medium">
                                        Version {deliverable.version}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-black/50 relative flex items-center justify-center overflow-hidden">
                            {/* Navigation Buttons (Overlay) */}
                            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-10">
                                <button
                                    onClick={() => onNavigate('prev')}
                                    disabled={versionIndex >= totalVersions - 1} // Can't go older if at end
                                    className="pointer-events-auto p-3 rounded-full bg-black/50 border border-white/10 text-white hover:bg-black/80 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none transition-all"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button
                                    onClick={() => onNavigate('next')}
                                    disabled={versionIndex <= 0} // Can't go newer if at 0
                                    className="pointer-events-auto p-3 rounded-full bg-black/50 border border-white/10 text-white hover:bg-black/80 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none transition-all"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </div>

                            {/* Iframe Preview */}
                            <iframe
                                src={previewUrl}
                                className="w-full h-full border-0"
                                allow="autoplay"
                                title="Deliverable Preview"
                            />
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-white/5 bg-[#1e293b]/50 flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                                        {deliverable.uploadedBy.name?.charAt(0) || 'U'}
                                    </span>
                                    <span>Uploaded by <span className="text-white">{deliverable.uploadedBy.name}</span></span>
                                </div>
                                <span className="w-1 h-1 rounded-full bg-white/20" />
                                <span>
                                    {deliverable.createdAt ? format(new Date((typeof deliverable.createdAt === 'object' && 'seconds' in deliverable.createdAt) ? (deliverable.createdAt as any).seconds * 1000 : deliverable.createdAt), 'MMM d, yyyy h:mm a') : ''}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                {canOpenDrive && (
                                    <a
                                        href={viewUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm font-medium"
                                    >
                                        <ExternalLink size={16} />
                                        Open in Drive
                                    </a>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
