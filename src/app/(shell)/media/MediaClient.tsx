'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContextProvider';
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
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
    const [sortBy, setSortBy] = useState<'recent' | 'name' | 'type'>('recent');
    const isMountedRef = useRef(true);

    useEffect(() => {
        console.log('[MEDIA] page mounted');
        isMountedRef.current = true;
        
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        loadFiles();
        
        return () => {
            isMountedRef.current = false;
        };
    }, [user]);

    const loadFiles = async () => {
        if (!user) return;
        
        console.log('[MEDIA] starting fetch', user?.uid);
        
        // Reset error state
        setError(null);
        setLoading(true);
        
        // Set timeout fallback
        const timeoutId = setTimeout(() => {
            if (isMountedRef.current) {
                console.log('[MEDIA] fetch timeout - setting error state');
                setError('Request timed out. Please try again.');
                setLoading(false);
            }
        }, 20000); // 20 second timeout
        
        try {
            const data = await FileService.getFiles(user.role, user.defaultDepartment, user.defaultInstitution);
            
            if (isMountedRef.current) {
                console.log('[MEDIA] fetch success', data.length, 'files');
                setFiles(data);
                setFilteredFiles(data);
                setError(null);
            }
        } catch (e: any) {
            console.log('[MEDIA] fetch error', e);
            if (isMountedRef.current) {
                setError(e.message || 'Failed to load media files');
                // Set empty arrays to avoid undefined state
                setFiles([]);
                setFilteredFiles([]);
            }
        } finally {
            if (isMountedRef.current) {
                clearTimeout(timeoutId);
                setLoading(false);
            }
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
                {error ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="text-red-500 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Failed to Load Media</h3>
                        <p className="text-[var(--text-secondary)] mb-6 max-w-md">{error}</p>
                        <button 
                            onClick={loadFiles}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <MediaGalleryGrid
                        files={filteredFiles}
                        loading={loading}
                        onFileSelect={setSelectedFile}
                    />
                )}
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
