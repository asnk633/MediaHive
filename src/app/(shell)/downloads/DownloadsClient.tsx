'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { FileService } from '@/services/fileService';
import { DriveFile } from '@/types/file';
import { FileCard } from '@/components/files/FileCard';
import { MediaGalleryGrid } from '@/components/media/MediaGalleryGrid';
import { MediaLightbox } from '@/components/media/MediaLightbox';
import { UploadModal } from '@/components/files/UploadModal';
import { DriveQueueView } from '@/components/admin/DriveQueueView';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import {
    Plus,
    Search,
    HardDrive,
    Download,
    FileText,
    ImageIcon,
    Video,
    LayoutGrid,
    List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNative } from '@/hooks/useNative';

type Category = 'all' | 'documents' | 'photos' | 'videos';

export default function DownloadsClient() {
    const { user } = useAuth();
    const { isNative } = useNative();
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
    const [viewMode, setViewMode] = useState<'files' | 'queue'>('files');
    const [category, setCategory] = useState<Category>('all');
    const [layout, setLayout] = useState<'grid' | 'gallery'>('gallery');

    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        setIsChecking(false);
    }, []);

    const loadFiles = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch all library files
            const data = await FileService.getFiles(user.role, user.department_id, user.institution_id, 'downloads');
            setFiles(data);
        } catch (e) {
            console.error(e);
            toast.error('Failed to load files');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isChecking && viewMode === 'files') {
            loadFiles();
        }
    }, [user, isChecking, viewMode]);

    const filteredFiles = useMemo(() => {
        let result = files.filter(f =>
            f.name.toLowerCase().includes(search.toLowerCase())
        );

        // Filter out inventory asset images to match mobile app behavior
        result = result.filter(f => 
            f.uploadContext !== 'inventory_asset' && 
            !f.name.startsWith('INV_')
        );

        if (category === 'photos') {
            result = result.filter(f => f.mimeType?.startsWith('image/'));
        } else if (category === 'videos') {
            result = result.filter(f => f.mimeType?.startsWith('video/'));
        } else if (category === 'documents') {
            result = result.filter(f => !f.mimeType?.startsWith('image/') && !f.mimeType?.startsWith('video/'));
        }

        return result;
    }, [files, search, category]);

    const canUpload = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'member' || user?.role === 'team';
    const isAdmin = user?.role === 'admin' || user?.role === 'manager';

    if (isChecking) return <div className="h-screen bg-[var(--bg-card)]" />;

    return (
        <PageLayout mode="plain">
            <PageHeader
                title="Downloads"
                description="Your unified library for documents, photography, and video assets."
                actions={
                    <div className="flex items-center gap-3">
                        {/* Admin Queue Toggle */}
                        {isAdmin && (
                            <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-subtle)] mr-2">
                                <button
                                    onClick={() => setViewMode('files')}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                        viewMode === 'files'
                                            ? "bg-indigo-500/10 text-indigo-500"
                                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-foreground/5"
                                    )}
                                >
                                    <Download size={16} />
                                    Library
                                </button>
                                <button
                                    onClick={() => setViewMode('queue')}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                                        viewMode === 'queue'
                                            ? "bg-emerald-500/10 text-emerald-500"
                                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-foreground/5"
                                    )}
                                >
                                    <HardDrive size={16} />
                                    Detected
                                </button>
                            </div>
                        )}

                        {canUpload && viewMode === 'files' && (
                            <button
                                onClick={() => setUploadOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                            >
                                <Plus size={18} />
                                Upload
                            </button>
                        )}
                    </div>
                }
            />

            {viewMode === 'queue' ? (
                <div className="mt-6">
                    <DriveQueueView />
                </div>
            ) : (
                <div className="flex flex-col h-full mt-2">
                    {/* Toolbar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        {/* Category Filters */}
                        <div className="flex items-center gap-1 bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-subtle)] overflow-x-auto no-scrollbar">
                            {[
                                { id: 'all', label: 'All Assets', icon: LayoutGrid },
                                { id: 'documents', label: 'Docs', icon: FileText },
                                { id: 'photos', label: 'Photos', icon: ImageIcon },
                                { id: 'videos', label: 'Videos', icon: Video },
                            ].map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategory(cat.id as Category)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                                        category === cat.id
                                            ? "bg-foreground/10 text-foreground"
                                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-foreground/5"
                                    )}
                                >
                                    <cat.icon size={14} />
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search library..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:outline-none focus:border-primary transition-colors text-sm text-[var(--text-primary)]"
                                />
                            </div>

                            <div className="h-8 w-px bg-[var(--border-subtle)] mx-1" />

                            <div className="flex bg-[var(--bg-surface)] p-1 rounded-lg border border-[var(--border-subtle)]">
                                <button
                                    onClick={() => setLayout('gallery')}
                                    className={cn(
                                        "p-1.5 rounded-md transition-all",
                                        layout === 'gallery' ? "bg-foreground/10 text-foreground" : "text-[var(--text-secondary)] hover:text-foreground"
                                    )}
                                    title="Gallery View"
                                >
                                    <LayoutGrid size={16} />
                                </button>
                                <button
                                    onClick={() => setLayout('grid')}
                                    className={cn(
                                        "p-1.5 rounded-md transition-all",
                                        layout === 'grid' ? "bg-foreground/10 text-foreground" : "text-[var(--text-secondary)] hover:text-foreground"
                                    )}
                                    title="List View"
                                >
                                    <List size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto pb-20">
                        {loading ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                    <div key={i} className="aspect-square rounded-2xl bg-[var(--bg-panel)] animate-pulse" />
                                ))}
                            </div>
                        ) : filteredFiles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-[var(--border-subtle)] rounded-3xl bg-[var(--bg-surface)]/50">
                                <div className="w-20 h-20 bg-[var(--bg-panel)] rounded-full flex items-center justify-center mb-6">
                                    <Download className="text-[var(--text-secondary)] opacity-30" size={40} />
                                </div>
                                <h3 className="text-2xl font-bold text-[var(--text-primary)]">No assets found</h3>
                                <p className="text-[var(--text-secondary)] mt-2 max-w-md mx-auto">
                                    {search
                                        ? `We couldn't find anything matching "${search}" in the ${category} category.`
                                        : `Start by uploading your first asset to the ${category} library.`}
                                </p>
                                {search && (
                                    <button
                                        onClick={() => { setSearch(''); setCategory('all'); }}
                                        className="mt-6 text-primary hover:underline font-medium text-sm"
                                    >
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        ) : layout === 'gallery' ? (
                            <MediaGalleryGrid
                                files={filteredFiles}
                                loading={false}
                                onFileSelect={setSelectedFile}
                            />
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
                                            onDelete={async (id) => {
                                                try {
                                                    await FileService.deleteFile(id);
                                                    toast.success('Asset archived');
                                                    loadFiles();
                                                } catch (e) {
                                                    toast.error('Failed to archive asset');
                                                }
                                            }}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {uploadOpen && (
                <UploadModal
                    open={uploadOpen}
                    onClose={() => setUploadOpen(false)}
                    onSuccess={() => loadFiles()}
                />
            )}

            {selectedFile && (
                <MediaLightbox
                    file={selectedFile}
                    files={filteredFiles}
                    onClose={() => setSelectedFile(null)}
                    onNavigate={(newFile) => setSelectedFile(newFile)}
                />
            )}
        </PageLayout>
    );
}
