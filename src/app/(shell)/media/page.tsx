'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FileService } from '@/services/fileService';
import { DriveFile } from '@/types/file';
import { MediaGalleryGrid } from '@/components/media/MediaGalleryGrid';
import { MediaLightbox } from '@/components/media/MediaLightbox';
import { Search, Filter } from 'lucide-react';

export default function MediaGalleryPage() {
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

    // Sort files
    result.sort((a, b) => {
      if (sortBy === 'recent') {
        const aTime = a.createdAt?.seconds ? a.createdAt.seconds : 0;
        const bTime = b.createdAt?.seconds ? b.createdAt.seconds : 0;
        return bTime - aTime;
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return a.type.localeCompare(b.type);
      }
    });

    setFilteredFiles(result);
  }, [search, files, sortBy]);

  const handleFileSelect = (file: DriveFile) => {
    setSelectedFile(file);
  };

  const handleCloseLightbox = () => {
    setSelectedFile(null);
  };

  return (
    <div className="flex flex-col min-h-screen app-body-padding px-4 pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8 pt-6">
        <h1 className="text-3xl font-display font-bold text-[var(--text-primary)] mb-2">Media Gallery</h1>
        <p className="text-[var(--text-secondary)]">Browse and preview all media files</p>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
          <input
            type="text"
            placeholder="Search media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:outline-none focus:border-indigo-500 transition-colors text-[var(--text-primary)]"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:outline-none focus:border-indigo-500 transition-colors text-[var(--text-primary)]"
          >
            <option value="recent">Recently Added</option>
            <option value="name">Name</option>
            <option value="type">Type</option>
          </select>
        </div>
      </div>

      {/* Media Gallery Grid */}
      <MediaGalleryGrid
        files={filteredFiles}
        loading={loading}
        onFileSelect={handleFileSelect}
      />

      {/* Lightbox Modal */}
      {selectedFile && (
        <MediaLightbox
          file={selectedFile}
          files={filteredFiles}
          onClose={handleCloseLightbox}
          onNavigate={(file) => setSelectedFile(file)}
        />
      )}
    </div>
  );
}