import React, { useState } from 'react';
import { DriveFile } from '@/types/file';
import { ExtendedDriveFile } from '@/types/mediaComment';
import { MediaGalleryGrid } from './MediaGalleryGrid';
import { LazyMediaLightbox } from './LazyMediaLightbox';

interface EventMediaTabProps {
  eventId: string;
  files: DriveFile[];
}

export function EventMediaTab({ eventId, files }: EventMediaTabProps) {
  const [selectedFile, setSelectedFile] = useState<ExtendedDriveFile | null>(null);
  
  const handleFileSelect = (file: DriveFile) => {
    setSelectedFile(file);
  };
  
  const handleCloseLightbox = () => {
    setSelectedFile(null);
  };

  return (
    <div className="pt-4">
      <MediaGalleryGrid
        files={files}
        loading={false}
        onFileSelect={handleFileSelect}
      />
      
      {selectedFile && (
        <LazyMediaLightbox
          file={selectedFile}
          files={files}
          onClose={handleCloseLightbox}
          onNavigate={setSelectedFile}
        />
      )}
    </div>
  );
}