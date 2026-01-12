import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DeliverableService } from '@/services/deliverableService';
import { X, UploadCloud, File as FileIcon, Loader2, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
    const [customName, setCustomName] = useState('');

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles && acceptedFiles[0]) {
            setFile(acceptedFiles[0]);
            setCustomName(acceptedFiles[0].name);
            setError(null);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        onDropRejected: () => {
            toast.error("File type not accepted or too large");
        }
    });

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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                overlayClassName="z-[200]"
                className="z-[200] max-w-md bg-[#1a2639] border-[#ffffff1a] shadow-2xl p-0 overflow-hidden text-white backdrop-blur-3xl rounded-3xl"
            >
                <DialogHeader className="px-6 py-4 border-b border-white/5 bg-white/5">
                    <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                        Upload New Version
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Upload a file for this task.
                    </DialogDescription>
                </DialogHeader>

                {/* Body */}
                <div className="p-6">
                    {!file ? (
                        <div
                            {...getRootProps()}
                            className={`
                                border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group outline-none
                                ${isDragActive
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-white/20 hover:bg-white/5'
                                }
                            `}
                        >
                            <input {...getInputProps()} />
                            <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110
                                ${isDragActive ? 'bg-blue-500 text-white' : 'bg-blue-500/10 text-blue-400'}
                            `}>
                                <UploadCloud size={24} />
                            </div>
                            <p className="text-sm font-medium text-white mb-1">
                                {isDragActive ? "Drop the file here" : "Click to upload or drag and drop"}
                            </p>
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
            </DialogContent>
        </Dialog>
    );
};
