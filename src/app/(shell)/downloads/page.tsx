"use client";

import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Eye, Trash2, File, Image as ImageIcon, Video, Music, Archive, X } from 'lucide-react';
import { useRole } from '@/app/(shell)/RoleContext';
import { formatDate } from '@/lib/dateUtils';

interface FileData {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  uploadedDate: string;
  previewUrl?: string;
  fileUrl: string;
}

export default function FilesPage() {
  const { user } = useRole();
  const isAdmin = user?.role === 'admin';

  const [files, setFiles] = useState<FileData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{ file: File, fileUrl: string, previewUrl?: string }[]>([]);
  const [customName, setCustomName] = useState('');

  // Load files from localStorage on mount
  useEffect(() => {
    const savedFiles = localStorage.getItem('uploadedFiles');
    if (savedFiles) {
      setFiles(JSON.parse(savedFiles));
    }
  }, []);

  // Save files to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('uploadedFiles', JSON.stringify(files));
  }, [files]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);

    const filesData: { file: File, fileUrl: string, previewUrl?: string }[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert(`${file.name}: File size must be less than 50MB`);
        continue;
      }

      // Read file as base64
      const fileUrl = await readFileAsDataURL(file);

      // Generate preview for images
      let previewUrl: string | undefined;
      if (file.type.startsWith('image/')) {
        previewUrl = fileUrl;
      } else if (file.type.startsWith('video/')) {
        previewUrl = fileUrl;
      }

      filesData.push({ file, fileUrl, previewUrl });
    }

    setPendingFiles(filesData);
    setUploading(false);

    // Reset input
    e.target.value = '';

    // Show naming modal for first file
    if (filesData.length > 0) {
      setCustomName(filesData[0].file.name.replace(/\.[^/.]+$/, '')); // Remove extension
      setShowNameModal(true);
    }
  };

  const handleSaveFile = () => {
    if (!customName.trim() || pendingFiles.length === 0) return;

    const currentFile = pendingFiles[0];
    const fileExtension = currentFile.file.name.split('.').pop();
    const fullName = fileExtension ? `${customName.trim()}.${fileExtension}` : customName.trim();

    const fileData: FileData = {
      id: `file-${Date.now()}`,
      name: fullName,
      originalName: currentFile.file.name,
      size: currentFile.file.size,
      type: currentFile.file.type,
      uploadedDate: new Date().toISOString(),
      previewUrl: currentFile.previewUrl,
      fileUrl: currentFile.fileUrl,
    };

    setFiles([fileData, ...files]);

    // Process next file or close modal
    const remainingFiles = pendingFiles.slice(1);
    if (remainingFiles.length > 0) {
      setPendingFiles(remainingFiles);
      setCustomName(remainingFiles[0].file.name.replace(/\.[^/.]+$/, ''));
    } else {
      setShowNameModal(false);
      setPendingFiles([]);
      setCustomName('');
    }
  };

  const handleCancelUpload = () => {
    setShowNameModal(false);
    setPendingFiles([]);
    setCustomName('');
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDownload = (file: FileData) => {
    const link = document.createElement('a');
    link.href = file.fileUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      const updatedFiles = files.filter(f => f.id !== fileId);
      setFiles(updatedFiles);
      localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={20} />;
    if (type.startsWith('video/')) return <Video size={20} />;
    if (type.startsWith('audio/')) return <Music size={20} />;
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return <Archive size={20} />;
    if (type.includes('pdf')) return <FileText size={20} />;
    return <File size={20} />;
  };

  return (
    <div className="flex flex-col min-h-screen app-body-padding px-4 pb-24">
      {/* Header */}
      <header className="mb-8 pt-6">
        <h1 className="text-3xl font-display font-bold text-[var(--text-primary)] mb-2">Files</h1>
        <p className="text-[var(--text-secondary)]">Access shared resources and media.</p>
      </header>

      {/* Upload Section - Admin Only */}
      {isAdmin && (
        <div className="mb-6">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[var(--border-subtle)] rounded-2xl cursor-pointer hover:border-blue-500 transition-all bg-[var(--bg-card)] hover:bg-[var(--bg-panel)]">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className={`w-10 h-10 mb-3 text-[var(--text-secondary)] ${uploading ? 'animate-bounce' : ''}`} />
              <p className="mb-2 text-sm text-[var(--text-primary)] font-semibold">
                {uploading ? 'Processing...' : 'Click to upload files'}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                PDF, Images, Videos, Documents (Max 50MB)
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              accept="*/*"
            />
          </label>
        </div>
      )}

      {/* Files Grid */}
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText size={64} className="text-[var(--text-muted)] mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">No files uploaded yet</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {isAdmin ? 'Upload your first file to get started' : 'Check back later for shared files'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-[var(--bg-card)] rounded-2xl overflow-hidden border border-[var(--border-subtle)] hover:shadow-lg transition-all"
            >
              {/* Preview */}
              {file.previewUrl && file.type.startsWith('image/') ? (
                <div className="h-48 bg-[var(--bg-panel)] overflow-hidden">
                  <img
                    src={file.previewUrl}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : file.previewUrl && file.type.startsWith('video/') ? (
                <div className="h-48 bg-[var(--bg-panel)] overflow-hidden relative">
                  <video
                    src={file.fileUrl}
                    className="w-full h-full object-cover"
                    controls={false}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Video size={48} className="text-white opacity-70" />
                  </div>
                </div>
              ) : (
                <div className="h-48 bg-[var(--bg-panel)] flex items-center justify-center">
                  <div className="text-[var(--text-muted)] opacity-50 scale-150">
                    {getFileIcon(file.type)}
                  </div>
                </div>
              )}

              {/* File Info */}
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-[var(--bg-panel)] text-blue-500">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate mb-1">
                      {file.name}
                    </h4>
                    <div className="flex flex-col gap-0.5 text-xs text-[var(--text-secondary)]">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{formatDate(file.uploadedDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewFile(file)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                  >
                    <Eye size={16} />
                    Preview
                  </button>
                  <button
                    onClick={() => handleDownload(file)}
                    className="flex items-center justify-center p-2 rounded-lg bg-[var(--bg-panel)] hover:bg-green-600 hover:text-white text-[var(--text-primary)] transition-colors"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="flex items-center justify-center p-2 rounded-lg bg-[var(--bg-panel)] hover:bg-red-600 hover:text-white text-[var(--text-primary)] transition-colors"
                      title="Delete (Admin only)"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Name Modal */}
      {showNameModal && pendingFiles.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Name Your File</h3>
              <button
                onClick={handleCancelUpload}
                className="p-2 hover:bg-[var(--bg-panel)] rounded-full transition-colors"
              >
                <X size={20} className="text-[var(--text-secondary)]" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                Original: {pendingFiles[0].file.name}
              </p>
              <p className="text-xs text-[var(--text-muted)] mb-3">
                {pendingFiles.length > 1 && `${pendingFiles.length} files remaining`}
              </p>

              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Custom Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveFile()}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter file name"
                autoFocus
              />
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                Extension will be added automatically
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelUpload}
                className="flex-1 py-2.5 rounded-xl bg-[var(--bg-panel)] hover:bg-[var(--bg-panel)] text-[var(--text-primary)] font-medium text-sm transition-colors border border-[var(--border-subtle)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFile}
                disabled={!customName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pendingFiles.length > 1 ? 'Next' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-[var(--bg-card)] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border-subtle)] p-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-[var(--text-primary)] truncate">{previewFile.name}</h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-2 hover:bg-[var(--bg-panel)] rounded-full transition-colors"
              >
                <X size={20} className="text-[var(--text-secondary)]" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="p-6">
              {previewFile.type.startsWith('image/') ? (
                <img src={previewFile.fileUrl} alt={previewFile.name} className="w-full rounded-lg" />
              ) : previewFile.type.startsWith('video/') ? (
                <video src={previewFile.fileUrl} controls className="w-full rounded-lg" />
              ) : previewFile.type.startsWith('audio/') ? (
                <audio src={previewFile.fileUrl} controls className="w-full" />
              ) : previewFile.type.includes('pdf') ? (
                <iframe src={previewFile.fileUrl} className="w-full h-[70vh] rounded-lg" />
              ) : (
                <div className="text-center py-12">
                  <FileText size={64} className="mx-auto text-[var(--text-muted)] mb-4 opacity-50" />
                  <p className="text-[var(--text-secondary)] mb-4">Preview not available for this file type</p>
                  <button
                    onClick={() => handleDownload(previewFile)}
                    className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                  >
                    Download File
                  </button>
                </div>
              )}

              {/* File Details */}
              <div className="mt-6 p-4 bg-[var(--bg-panel)] rounded-lg">
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">File Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[var(--text-secondary)] mb-1">Display Name</p>
                    <p className="text-[var(--text-primary)] font-medium">{previewFile.name}</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-secondary)] mb-1">Original Name</p>
                    <p className="text-[var(--text-primary)] font-medium">{previewFile.originalName}</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-secondary)] mb-1">File Size</p>
                    <p className="text-[var(--text-primary)] font-medium">{formatFileSize(previewFile.size)}</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-secondary)] mb-1">File Type</p>
                    <p className="text-[var(--text-primary)] font-medium">{previewFile.type || 'Unknown'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[var(--text-secondary)] mb-1">Uploaded</p>
                    <p className="text-[var(--text-primary)] font-medium">{formatDate(previewFile.uploadedDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-[var(--bg-card)] border-t border-[var(--border-subtle)] p-4 flex gap-3">
              <button
                onClick={() => handleDownload(previewFile)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                <Download size={18} />
                Download
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    handleDelete(previewFile.id);
                    setPreviewFile(null);
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
