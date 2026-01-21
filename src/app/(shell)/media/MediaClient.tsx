'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FileService } from '@/services/fileService';
import { DriveFile } from '@/types/file';
import { MediaGalleryGrid } from '@/components/media/MediaGalleryGrid';
import { MediaLightbox } from '@/components/media/MediaLightbox';
import { Search } from 'lucide-react';

export default function MediaClient() {
    const { user } = useAuth();
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [filteredFiles, setFilteredFiles] = useState<DriveFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
    const [sortBy, setSortBy] = useState<'recent' | 'name' | 'type'>('recent');

    useEffect(() => {
        loadFiles();
    }, [user]);

    const loadFiles = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await FileService.getFiles(user.role, user.defaultDepartment, user.defaultInstitution);
            setFiles(data);
            setFilteredFiles(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let result = files.filter(f =>
            f.name.toLowerCase().includes(search.toLowerCase())
        );

        result.sort((a, b) => {
            if (sortBy === 'recent') {
                const aTime = a.createdAt?.seconds ? a.createdAt.seconds : 0;
                const bTime = b.createdAt?.seconds ? b.createdAt.seconds : 0;
                return bTime - aTime;
            }
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'type') return (a.mimeType || '').localeCompare(b.mimeType || '');
            return 0;
        });

        setFilteredFiles(result);
    }, [search, files, sortBy]);

    return (
        <div className="flex flex-col h-screen app-body-padding">
            <div className="flex items-center justify-between mb-6 pt-6">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">Media Gallery</h1>
                    <p className="text-[var(--text-secondary)] mt-1">Browse your photos and media files</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
                        <input
                            type="text"
                            placeholder="Search files..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-primary"
                        />
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'recent' | 'name' | 'type')}
                        className="px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-primary"
                    >
                        <option value="recent">Most Recent</option>
                        <option value="name">Name</option>
                        <option value="type">Type</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-20">
                <MediaGalleryGrid
                    files={filteredFiles}
                    loading={loading}
                    onFileSelect={setSelectedFile}
                />
            </div>

            {selectedFile && (
                <MediaLightbox
                    file={selectedFile}
                    files={filteredFiles}
                    onClose={() => setSelectedFile(null)}
                    onNavigate={(newFile) => setSelectedFile(newFile)}
                />
            )}
        </div>
    );
}
