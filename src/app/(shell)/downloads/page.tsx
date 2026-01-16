"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FileService } from '@/services/fileService';
import { DriveFile } from '@/types/file';
import { FileCard } from '@/components/files/FileCard';
import { UploadModal } from '@/components/files/UploadModal';
import { Plus, FolderOpen, Search, Filter, HardDrive, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { PageLayout } from "@/components/ui/layout/PageLayout";
import { PageHeader } from "@/components/ui/layout/PageHeader";
import { DriveQueueView } from '@/components/admin/DriveQueueView';
import { cn } from '@/lib/utils';

export default function FilesPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // View State: 'files' | 'queue'
  const [viewMode, setViewMode] = useState<'files' | 'queue'>('files');

  const canUpload = user?.role === 'admin' || user?.role === 'team';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (viewMode === 'files') {
      loadFiles();
    }
  }, [user, viewMode]);

  const loadFiles = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // STRICT SCOPE: Only show authoritative downloads
      const data = await FileService.getFiles(user.role, user.defaultDepartment, user.defaultInstitution, 'downloads');
      setFiles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setShowDeleteConfirm(false);

    try {
      await FileService.deleteFile(deleteId);
      toast.success('File archived successfully');
      await loadFiles();
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast.error(error.message || 'Failed to archive file');
    } finally {
      setDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteId(null);
  };

  return (
    <PageLayout mode="plain">
      <PageHeader
        title="Downloads"
        description="Manage your downloaded files."
        actions={
          <div className="flex items-center gap-3">
            {/* Admin View Toggle */}
            {isAdmin && (
              <div className="flex bg-[var(--bg-surface)] p-1 rounded-xl border border-[var(--border-subtle)] mr-2">
                <button
                  onClick={() => setViewMode('files')}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    viewMode === 'files'
                      ? "bg-indigo-500/10 text-indigo-500"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
                  )}
                >
                  <Download size={16} />
                  Published
                </button>
                <button
                  onClick={() => setViewMode('queue')}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    viewMode === 'queue'
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
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
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all"
              >
                <Plus size={20} />
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
        <>
          {/* Toolbar */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
              <input
                type="text"
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:outline-none focus:border-indigo-500 transition-colors text-[var(--text-primary)]"
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-40 rounded-xl bg-[var(--bg-panel)] animate-pulse" />
              ))}
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-soft rounded-xl bg-glass">
              <div className="w-16 h-16 bg-glass rounded-full flex items-center justify-center mb-4">
                <FolderOpen className="text-muted" size={32} />
              </div>
              <h3 className="text-xl font-medium text-white/40 mb-2">No files found</h3>
              <p className="text-white/20 max-w-sm mx-auto">
                {search ? "Try adjusting your search." : "Upload a file to get started."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredFiles.map(file => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <FileCard
                    file={file}
                    canEdit={user?.role === 'admin'}
                    onDelete={handleDelete}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={loadFiles}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--bg-surface)] border-2 border-[var(--border-default)] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              Archive File?
            </h3>
            <p className="text-[var(--text-primary)] opacity-80 mb-6 leading-relaxed">
              This will move the file to the Archives folder in Google Drive. The file will no longer appear in the active files list.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2.5 bg-[var(--bg-panel)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl font-medium transition-all hover:scale-[1.02]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all hover:scale-[1.02] shadow-lg shadow-red-600/20"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );

}