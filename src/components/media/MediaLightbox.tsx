import React, { useState, useEffect, useCallback } from 'react';
import { DriveFile } from '@/types/file';
import { ExtendedDriveFile } from '@/types/mediaComment';
import { X, Download, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, Video, Send, Check, AlertCircle, Upload, ChevronDown, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContextProvider';
import { toast } from 'sonner';
import { formatDate, getRelativeTime } from '@/lib/utils';
import { MediaCommentService } from '@/services/mediaCommentService';
import { MediaProofingService } from '@/services/mediaProofingService';
import { ProofingNotificationService } from '@/services/proofingNotificationService';
import { ProofingAuditService } from '@/services/proofingAuditService';
import { MediaVersioningService } from '@/services/mediaVersioningService';
import { VersioningAuditService } from '@/services/versioningAuditService';
import { isFeatureEnabled } from '@/app/featureFlags';
import { getDriveImageUrl } from '@/lib/driveUtils';
import Image from 'next/image';

interface MediaLightboxProps {
  file: ExtendedDriveFile;
  files: DriveFile[];
  loading?: boolean;
  onClose: () => void;
  onNavigate: (file: DriveFile) => void;
}

export function MediaLightbox({ file, files, loading = false, onClose, onNavigate }: MediaLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [versions, setVersions] = useState<ExtendedDriveFile[]>([]);
  const [showVersionsDropdown, setShowVersionsDropdown] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const { user } = useAuth();

  // Find current file index
  useEffect(() => {
    const index = files.findIndex(f => f.id === file.id);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [file, files]);

  // Load comments for the current file
  useEffect(() => {
    if (!file.id) return;

    const unsubscribe = MediaCommentService.subscribeToComments(file.id, (updatedComments) => {
      setComments(updatedComments);
    });

    return () => {
      //unsubscribe();
    };
  }, [file.id]);

  // Load versions for the current file
  useEffect(() => {
    if (!file.versionGroupId && !file.id) return;

    const loadVersions = async () => {
      const versionGroupId = file.versionGroupId || file.id;
      const fetchedVersions = await MediaVersioningService.getVersions(versionGroupId);
      setVersions(fetchedVersions);
    };

    if (isFeatureEnabled('mediaVersioning')) {
      loadVersions();
    }
  }, [file.id, file.versionGroupId]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft') {
      navigateToPrevious();
    } else if (e.key === 'ArrowRight') {
      navigateToNext();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const navigateToPrevious = () => {
    if (currentIndex > 0) {
      onNavigate(files[currentIndex - 1]);
    }
  };

  const navigateToNext = () => {
    if (currentIndex < files.length - 1) {
      onNavigate(files[currentIndex + 1]);
    }
  };

  const getFileIcon = (mimeType: string = '') => {
    if (mimeType?.startsWith('image/')) {
      return ImageIcon;
    } else if (mimeType?.startsWith('video/')) {
      return Video;
    } else {
      return FileText;
    }
  };

  const isImage = file.mimeType?.startsWith('image/') || false;
  const isVideo = file.mimeType?.startsWith('video/') || false;



  const FileIcon = getFileIcon(file.mimeType);

  // Handle adding a new comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await MediaCommentService.addComment(
        file.id,
        user.uid,
        user.name || 'Anonymous',
        user.role,
        newComment.trim()
      );

      // Log audit trail
      await ProofingAuditService.logProofingAction(
        user.uid,
        file.id,
        'comment_added',
        { content: newComment.trim() },
        '1' // Default institution ID for now
      );

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle uploading a new version
  const handleUploadNewVersion = async (newFile: File) => {
    if (!user || user.role === 'guest') return;

    setIsUploading(true);
    try {
      // In a real implementation, we would upload the file to the server
      // For now, we'll simulate the process

      // Create a new version using the MediaVersioningService
      const newVersion = await MediaVersioningService.uploadNewVersion(
        {
          name: newFile.name,
          mimeType: newFile.type,
          // Add other file properties as needed
        },
        file,
        user.uid,
        user.name || 'Anonymous',
        user.role
      );

      if (newVersion) {
        // Log audit trail
        await VersioningAuditService.logVersioningAction(
          user.uid,
          'version_uploaded',
          {
            oldVersionNumber: file.versionNumber || 1,
            newVersionNumber: newVersion.versionNumber,
            mediaId: newVersion.id,
            versionGroupId: newVersion.versionGroupId
          },
          '1' // Default institution ID for now
        );

        // Refresh versions list
        const updatedVersions = await MediaVersioningService.getVersions(newVersion.versionGroupId || newVersion.id);
        setVersions(updatedVersions);

        // Navigate to the new version
        onNavigate(newVersion);
      }
    } catch (error) {
      console.error('Error uploading new version:', error);
    } finally {
      setIsUploading(false);
      setNewVersionFile(null);
    }
  };

  // Handle proofing actions
  const handleProofingAction = async (action: 'approve' | 'request_changes') => {
    if (!user || isActionLoading) return;

    setIsActionLoading(true);
    const newStatus = action === 'approve' ? 'approved' : 'changes_requested';
    const success = await MediaProofingService.updateProofingStatus(
      file.id,
      newStatus,
      user.uid,
      user.name || 'Anonymous'
    );

    if (success) {
      // Notify relevant parties
      await ProofingNotificationService.notifyProofingStatusChange(
        file.id,
        file.name,
        file.uploaded_by,
        newStatus,
        user.uid,
        user.name || 'Anonymous'
      );

      // Log audit trail
      await ProofingAuditService.logProofingAction(
        user.uid,
        file.id,
        action === 'approve' ? 'status_approved' : 'status_changes_requested',
        { status: newStatus },
        '1' // Default institution ID for now
      );

      // Add system comment
      try {
        const actionText = action === 'approve'
          ? `Approved by ${user.name || 'Anonymous'}`
          : `Changes requested by ${user.name || 'Anonymous'}`;

        await MediaCommentService.addComment(
          file.id,
          user.uid,
          'System',
          'system',
          actionText
        );
      } catch (error) {
        console.error('Error adding system comment:', error);
      }

      // Provide visual feedback
      if (action === 'approve') {
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500" size={18} />
            <span>Media approved successfully!</span>
          </div>,
          { duration: 3000 }
        );
      } else {
        toast.success(
          <div className="flex items-center gap-2">
            <AlertCircle className="text-yellow-500" size={18} />
            <span>Changes requested successfully!</span>
          </div>,
          { duration: 3000 }
        );
      }
    } else {
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="text-red-500" size={18} />
          <span>Failed to update proofing status. Please try again.</span>
        </div>,
        { duration: 5000 }
      );
    }
    setIsActionLoading(false);
  };

  // Check if user can perform proofing actions
  const canPerformProofingActions = user && (user.role === 'admin' || user.role === 'manager' || user.role === 'member') && isFeatureEnabled('proofingLite');

  // Check if proofing features should be shown
  const showProofingFeatures = isFeatureEnabled('proofingLite');

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
        aria-label="Close"
      >
        <X size={24} />
      </button>

      <div className="flex flex-col md:flex-row w-full max-w-6xl max-h-[90vh] bg-[var(--bg-panel)] rounded-2xl overflow-hidden shadow-2xl">
        {/* Media Preview Area */}
        <div className="flex-1 flex items-center justify-center relative bg-black">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-full max-h-[70vh] flex items-center justify-center animate-pulse">
                <div className="text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4"></div>
                </div>
              </div>
            </div>
          ) : isImage ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <div className="relative w-full h-full max-h-[70vh] aspect-video">
                <Image
                  src={getDriveImageUrl(file.viewLink)}
                  alt={file.name}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          ) : isVideo ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <div className="relative w-full max-h-[70vh] aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                <video
                  src={file.viewLink?.replace('/view', '/preview')}
                  controls
                  className="w-full h-full"
                  poster={getDriveImageUrl(file.viewLink)}
                />
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="p-6 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-6">
                <FileIcon size={64} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{file.name}</h3>
              <p className="text-gray-400 mb-6">Preview not available for this file type</p>
              <Button
                onClick={() => window.open(file.downloadLink, '_blank')}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500"
              >
                <Download size={18} />
                Download File
              </Button>
            </div>
          )}

          {/* Navigation Arrows */}
          {files.length > 1 && !loading && (
            <>
              <button
                onClick={navigateToPrevious}
                disabled={currentIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/50 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={navigateToNext}
                disabled={currentIndex === files.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/50 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] flex flex-col">
          <div className="p-6 flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>

                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>

                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>

                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-[var(--text-primary)] truncate mb-1">
                    {file.name}
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                    <FileIcon size={16} />
                    {file.mimeType}
                  </p>

                  {/* Proofing Status Badge */}
                  {showProofingFeatures && file.proofingStatus && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${file.proofingStatus === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : file.proofingStatus === 'changes_requested'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}>
                        {file.proofingStatus === 'approved' && <Check className="mr-1.5 h-3 w-3" />}
                        {file.proofingStatus === 'changes_requested' && <AlertCircle className="mr-1.5 h-3 w-3" />}
                        {file.proofingStatus === 'pending' ? 'Pending Review' :
                          file.proofingStatus === 'approved' ? 'Approved' : 'Changes Requested'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Details</h3>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Uploaded by</span>
                        <span className="text-[var(--text-primary)]">
                          {file.uploadedByName || file.uploaded_by}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Uploaded</span>
                        <span className="text-[var(--text-primary)]" title={formatDate(file.created_at)}>
                          {getRelativeTime(file.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Version Information */}
                  {isFeatureEnabled('mediaVersioning') && versions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Versions</h3>
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[var(--text-secondary)]">
                            Version {file.versionNumber || 1} of {versions.length}
                          </span>
                          {file.isActiveVersion === false && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          )}
                        </div>

                        {/* Version dropdown */}
                        <div className="relative">
                          <button
                            onClick={() => setShowVersionsDropdown(!showVersionsDropdown)}
                            className="w-full flex items-center justify-between px-3 py-2 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] text-sm hover:bg-[var(--bg-panel)]/80 transition-colors"
                          >
                            <span>Switch to another version</span>
                            <ChevronDown size={16} className="text-[var(--text-secondary)]" />
                          </button>

                          {showVersionsDropdown && (
                            <div className="absolute z-10 mt-1 w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg shadow-lg overflow-hidden">
                              {versions
                                .slice() // Create a copy to avoid mutating original array
                                .sort((a, b) => (b.versionNumber || 0) - (a.versionNumber || 0)) // Sort by version number descending
                                .map((version) => (
                                  <button
                                    key={version.id}
                                    onClick={() => {
                                      onNavigate(version);
                                      setShowVersionsDropdown(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-panel)] transition-colors flex justify-between items-center ${version.id === file.id ? 'bg-[var(--bg-panel)]' : ''
                                      }`}
                                  >
                                    <span>
                                      Version {version.versionNumber}
                                      {version.id === file.id && ' (Current)'}
                                    </span>
                                    {!version.isActiveVersion && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        Inactive
                                      </span>
                                    )}
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Upload New Version */}
                  {isFeatureEnabled('mediaVersioning') && user && (user.role === 'admin' || user.role === 'manager' || user.role === 'member') && (
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Version Management</h3>
                      <Button
                        onClick={() => document.getElementById('new-version-upload')?.click()}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500"
                        disabled={isUploading}
                      >
                        <Upload size={16} />
                        {isUploading ? 'Uploading...' : 'Upload New Version'}
                      </Button>
                      <input
                        id="new-version-upload"
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUploadNewVersion(file);
                            // Reset the input so the same file can be selected again
                            e.target.value = '';
                          }
                        }}
                        disabled={isUploading}
                      />
                    </div>
                  )}

                  {/* Proofing Actions */}
                  {showProofingFeatures && canPerformProofingActions && (
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Proofing Actions</h3>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleProofingAction('approve')}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500"
                          disabled={file.proofingStatus === 'approved' || isActionLoading}
                        >
                          {isActionLoading && file.proofingStatus !== 'approved' ? (
                            <>
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white" />
                              <span>Approving...</span>
                            </>
                          ) : (
                            <>
                              <Check size={16} />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleProofingAction('request_changes')}
                          variant="outline"
                          className="flex-1 flex items-center justify-center gap-2 border-red-600 text-red-600 hover:bg-red-50"
                          disabled={file.proofingStatus === 'changes_requested' || isActionLoading}
                        >
                          {isActionLoading && file.proofingStatus !== 'changes_requested' ? (
                            <>
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-red-500/30 border-t-red-500" />
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle size={16} />
                              Request Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Context</h3>
                    <div className="space-y-2">
                      <button className="w-full text-left p-3 rounded-xl bg-[var(--bg-panel)] hover:bg-[var(--bg-panel)]/80 border border-[var(--border-subtle)] transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[var(--text-primary)]">Attached to Task</span>
                          <ChevronRight size={16} className="text-[var(--text-secondary)]" />
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">Task Title Goes Here</p>
                      </button>

                      <button className="w-full text-left p-3 rounded-xl bg-[var(--bg-panel)] hover:bg-[var(--bg-panel)]/80 border border-[var(--border-subtle)] transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[var(--text-primary)]">From Event</span>
                          <ChevronRight size={16} className="text-[var(--text-secondary)]" />
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">Event Title Goes Here</p>
                      </button>
                    </div>
                  </div>
                  {/* Comments Section */}
                  {showProofingFeatures && (
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Comments</h3>
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {comments.length > 0 ? (
                          comments.map((comment) => (
                            <div key={comment.id} className="bg-[var(--bg-panel)] rounded-lg p-3">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-[var(--text-primary)] text-sm">
                                  {comment.authorName}
                                </span>
                                <span className="text-xs text-[var(--text-secondary)]" title={formatDate(comment.created_at)}>
                                  {getRelativeTime(comment.created_at)}
                                </span>
                              </div>
                              <p className="text-[var(--text-primary)] text-sm">
                                {comment.content}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {comment.authorRole === 'system' && (
                                  <span className="inline-block text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                                    System
                                  </span>
                                )}
                                <span className="text-xs text-[var(--text-secondary)]">
                                  {getRelativeTime(comment.created_at)}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-[var(--text-secondary)] text-sm italic">No comments yet</p>
                        )}
                      </div>

                      {/* Add Comment Form */}
                      {user && (user.role === 'admin' || user.role === 'manager' || user.role === 'member') && (
                        <form onSubmit={handleAddComment} className="mt-3 flex gap-2">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 px-3 py-2 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            disabled={isSubmitting}
                          />
                          <Button
                            type="submit"
                            size="sm"
                            className="flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-500"
                            disabled={!newComment.trim() || isSubmitting}
                          >
                            <Send size={16} />
                          </Button>
                        </form>
                      )}

                      {user && user.role === 'guest' && (
                        <p className="text-[var(--text-secondary)] text-sm mt-2 italic">
                          Guests can view comments but cannot add new ones.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="p-6 border-t border-[var(--border-subtle)]">
            <Button
              onClick={() => window.open(file.downloadLink, '_blank')}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500"
            >
              <Download size={18} />
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MediaLightbox;
