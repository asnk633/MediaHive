"use client";

import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Eye, Trash2, File, Image as ImageIcon, Video, Music, Archive, X } from 'lucide-react';
import { useRole } from '@/app/(shell)/RoleContext';
import { formatDate } from '@/lib/dateUtils';
import { uploadFile, subscribeToFiles, deleteFile, type FileMetadata } from '@/services/files';
import { auth } from '@/firebase/client';

export default function FilesPage() {
  const { user } = useRole();
  const isAdmin = user?.role === 'admin';

  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileMetadata | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState('');

  // Subscribe to real-time file updates
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Subscribe to files (admin sees all, users see only theirs)
    const unsubscribe = subscribeToFiles(
      isAdmin ? null : userId,
      (updatedFiles) => {
        setFiles(updatedFiles);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file size (max 50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    // Set pending file and show naming modal
    setPendingFile(selectedFile);
    setCustomName(selectedFile.name.replace(/\.[^/.]+$/, '')); // Remove extension
    setShowNameModal(true);

    // Reset input
    e.target.value = '';
  };

  const handleSaveFile = async () => {
    if (!customName.trim() || !pendingFile) return;

    const userId = auth.currentUser?.uid;
    if (!userId) {
      alert('User not authenticated');
      return;
    }

    setUploading(true);
    setShowNameModal(false);

    try {
      // Upload to Firebase Storage
      await uploadFile(userId, pendingFile, customName.trim());

      // Clear pending state
      setPendingFile(null);
      setCustomName('');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelNaming = () => {
    setShowNameModal(false);
    setPendingFile(null);
    setCustomName('');
  };

  const handleDeleteFile = async (file: FileMetadata) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Check permissions
    if (!isAdmin && file.userId !== userId) {
      alert('You can only delete your own files');
      return;
    }

    if (!confirm(`Delete "${file.name}"?`)) return;

    try {
      await deleteFile(file.id, file.storagePath);
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    if (type.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (type.startsWith('audio/')) return <Music className="w-5 h-5" />;
    if (type.includes('pdf')) return <FileText className="w-5 h-5" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-display font-bold text-[var(--text-primary)] mb-2">Files</h1>
          <p className="text-[var(--text-secondary)]">Manage and download your files</p>
        </header>

        {/* Upload Section (Admin Only) */}
        {isAdmin && (
          <div className="glass-card p-6 mb-8">
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-[var(--glass-border)] rounded-xl p-8 text-center hover:border-[var(--accent)] hover:bg-[var(--panel)] transition-all duration-200">
                <Upload className="w-12 h-12 mx-auto text-[var(--accent)] mb-3" />
                <p className="text-[var(--text)] font-medium mb-1">
                  {uploading ? 'Uploading...' : 'Click to upload file'}
                </p>
                <p className="text-xs text-[var(--muted)]">Max file size: 50MB</p>
              </div>
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>
        )}

        {/* Files Grid */}
        {files.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <File className="w-16 h-16 mx-auto text-[var(--icon-muted)] mb-4" />
            <h3 className="text-lg font-medium text-[var(--text)] mb-2">No files yet</h3>
            <p className="text-sm text-[var(--muted)]">
              {isAdmin ? 'Upload files to get started' : 'Files uploaded by admins will appear here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="glass-card p-4 hover:bg-[var(--panel)] transition-all duration-200 group"
              >
                {/* Preview */}
                <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-[var(--panel-strong)]">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={file.storageUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : file.type.startsWith('video/') ? (
                    <div className="relative w-full h-full">
                      <video
                        src={file.storageUrl}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Video className="w-12 h-12 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {getFileIcon(file.type)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="space-y-1 mb-3">
                  <h3 className="font-medium text-sm text-[var(--text)] truncate" title={file.name}>
                    {file.name}
                  </h3>
                  <p className="text-xs text-[var(--muted)] truncate" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{formatDate(file.uploadedDate.toDate())}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewFile(file)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[var(--panel-strong)] hover:bg-[var(--accent)] text-[var(--text)] rounded-lg transition-all duration-200 text-xs"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <a
                    href={file.storageUrl}
                    download={file.name}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[var(--panel-strong)] hover:bg-[var(--accent)] text-[var(--text)] rounded-lg transition-all duration-200 text-xs"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteFile(file)}
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Name Modal */}
        {showNameModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-[var(--text)] mb-4">Name this file</h3>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter file name"
                className="w-full bg-[var(--panel)] border border-[var(--glass-border)] rounded-lg px-4 py-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)] mb-4"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleSaveFile()}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCancelNaming}
                  className="flex-1 px-4 py-2 bg-[var(--panel)] hover:bg-[var(--panel-strong)] text-[var(--text)] rounded-lg transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFile}
                  className="flex-1 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-white rounded-lg transition-all duration-200"
                  disabled={!customName.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewFile && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="max-w-4xl w-full max-h-[90vh] glass-card p-6 overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[var(--text)]">{previewFile.name}</h3>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 hover:bg-[var(--panel)] rounded-lg transition-all"
                >
                  <X className="w-6 h-6 text-[var(--text)]" />
                </button>
              </div>

              <div className="mb-4">
                {previewFile.type.startsWith('image/') && (
                  <img src={previewFile.storageUrl} alt={previewFile.name} className="w-full rounded-lg" />
                )}
                {previewFile.type.startsWith('video/') && (
                  <video src={previewFile.storageUrl} controls className="w-full rounded-lg" />
                )}
                {previewFile.type.startsWith('audio/') && (
                  <audio src={previewFile.storageUrl} controls className="w-full" />
                )}
                {previewFile.type.includes('pdf') && (
                  <iframe src={previewFile.storageUrl} className="w-full h-[600px] rounded-lg" />
                )}
                {!previewFile.type.startsWith('image/') &&
                  !previewFile.type.startsWith('video/') &&
                  !previewFile.type.startsWith('audio/') &&
                  !previewFile.type.includes('pdf') && (
                    <div className="text-center py-12">
                      <File className="w-16 h-16 mx-auto text-[var(--icon-muted)] mb-4" />
                      <p className="text-[var(--muted)]">Preview not available for this file type</p>
                    </div>
                  )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Original name:</span>
                  <span className="text-[var(--text)]">{previewFile.originalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">File size:</span>
                  <span className="text-[var(--text)]">{formatFileSize(previewFile.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">File type:</span>
                  <span className="text-[var(--text)]">{previewFile.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Uploaded:</span>
                  <span className="text-[var(--text)]">{formatDate(previewFile.uploadedDate.toDate())}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <a
                  href={previewFile.storageUrl}
                  download={previewFile.name}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)]/80 text-white rounded-lg transition-all duration-200"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                {isAdmin && (
                  <button
                    onClick={() => {
                      handleDeleteFile(previewFile);
                      setPreviewFile(null);
                    }}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
