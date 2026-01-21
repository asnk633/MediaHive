'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FileService } from '@/services/fileService';
import { DriveFile } from '@/types/file';
import { FileCard } from '@/components/files/FileCard';
import { UploadModal } from '@/components/files/UploadModal';
import { Plus, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function FilesClient() {
    const { user } = useAuth();
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const canUpload = user?.role === 'admin' || user?.role === 'team';

    useEffect(() => {
        loadFiles();
    }, [user]);

    const loadFiles = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await FileService.getFiles(user.role, user.defaultDepartment, user.defaultInstitution);
            setFiles(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleteId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setShowDeleteConfirm(false);
        try {
            await FileService.deleteFile(deleteId);
            toast.success('File deleted');
            loadFiles();
        } catch (e) {
            console.error(e);
            toast.error('Failed to delete file');
        }
        setDeleteId(null);
    };



    const filteredFiles = files.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col h-screen app-body-padding">
            <div className="flex items-center justify-between mb-6 pt-6">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">Files</h1>
                    <p className="text-[var(--text-secondary)] mt-1">Manage your documents and files</p>
                </div>

                {canUpload && (
                    <button
                        onClick={() => setUploadOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                    >
                        <Plus size={18} />
                        Upload File
                    </button>
                )}
            </div>

            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-primary"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-20">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-[var(--text-secondary)]">Loading files...</div>
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="text-center py-20 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] border-dashed">
                        <div className="text-5xl mb-4">📁</div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">No files found</h3>
                        <p className="text-[var(--text-secondary)]">
                            {search ? 'Try a different search term' : 'Upload files to get started'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredFiles.map((file) => (
                            <motion.div
                                key={file.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <FileCard
                                    file={file}
                                    canEdit={canUpload}
                                    onDelete={handleDelete}
                                />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {uploadOpen && (
                <UploadModal
                    open={uploadOpen}
                    onClose={() => setUploadOpen(false)}
                    onSuccess={() => loadFiles()}
                />
            )}

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                    <div className="bg-[var(--bg-card)] rounded-2xl p-6 max-w-sm">
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Delete File?</h3>
                        <p className="text-[var(--text-secondary)] mb-6">This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => { setShowDeleteConfirm(false); setDeleteId(null); }}
                                className="flex-1 px-4 py-2 bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-panel)] transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
