import React, { useState } from 'react';
import { DriveFile } from '@/types/file';
import { ExtendedDriveFile } from '@/types/mediaComment';
import { MediaCard } from './MediaCard';
import { LazyMediaLightbox } from './LazyMediaLightbox';

interface TaskMediaGalleryProps {
  files: DriveFile[];
  onFileSelect: (file: DriveFile) => void;
}

export function TaskMediaGallery({ files, onFileSelect }: TaskMediaGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ExtendedDriveFile | null>(null);
  
  if (files.length === 0) {
    return null;
  }

  const handleFileSelect = (file: DriveFile) => {
    setSelectedFile(file as ExtendedDriveFile);
    setLightboxOpen(true);
    onFileSelect(file);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setTimeout(() => {
      setSelectedFile(null);
    }, 300); // Wait for animation to complete
  };

  const navigateLightbox = (file: DriveFile) => {
    setSelectedFile(file as ExtendedDriveFile);
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Attachments</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {files.map(file => (
          <MediaCard
            key={file.id}
            file={file}
            onClick={() => handleFileSelect(file)}
          />
        ))}
      </div>
      
      {lightboxOpen && selectedFile && (
        <LazyMediaLightbox
          file={selectedFile}
          files={files}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
        />
      )}
    </div>
  );
}