import React, { useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DeliverableService } from '@/services/deliverableService';
import { X, UploadCloud, File as FileIcon, Loader2, AlertCircle } from 'lucide-react';

interface DeliverableUploadModalProps {
    taskId: string;
    isOpen: boolean;
    onClose: () => void;
    onUploadComplete: () => void;
}

export const DeliverableUploadModal: React.FC<DeliverableUploadModalProps> = ({
    taskId,
    isOpen,
    onClose,
    onUploadComplete
}) => {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [customName, setCustomName] = useState('');

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setCustomName(e.target.files[0].name); // Default to filename
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file || !user) return;

        setUploading(true);
        setError(null);

        try {
            await DeliverableService.uploadDeliverable(taskId, file, {
                uid: user.uid,
                name: user.name || 'Unknown',
                role: user.role,
                avatarUrl: user.avatarUrl
            }, customName); // Pass custom name
            onUploadComplete();
            onClose();
            setFile(null);
            setCustomName('');
        } catch (err: any) {
            console.error('Upload failed', err);
            setError(err.message || 'Failed to upload file. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setCustomName(e.dataTransfer.files[0].name); // Default to filename
            setError(null);
        }
    };

    // ...

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div
                className="bg-[#1a2639] rounded-2xl w-full max-w-md border border-[#ffffff1a] shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <h3 className="text-lg font-bold text-white">Upload New Version</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {!file ? (
                        <div
                            className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); }}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <UploadCloud size={24} />
                            </div>
                            <p className="text-sm font-medium text-white mb-1">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-500">Supports Images, Videos, PDFs, etc.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-white/5 rounded-xl p-4 border border-[#ffffff1a] flex items-center gap-3">
                                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
                                    <FileIcon size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{file.name}</p>
                                    <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button
                                    onClick={() => setFile(null)}
                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Custom Name Input */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                                    File Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    className="w-full bg-white/5 border border-[#ffffff1a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-colors"
                                    placeholder="Enter a custom name for this version..."
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                        disabled={uploading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
                    >
                        {uploading && <Loader2 size={14} className="animate-spin" />}
                        {uploading ? 'Uploading...' : 'Upload File'}
                    </button>
                </div>
            </div>
        </div>
    );
};
