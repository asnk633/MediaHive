"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, AlertCircle, Check, UploadCloud, FileIcon } from "lucide-react";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FileUploadModal({ isOpen, onClose }: FileUploadModalProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState("");
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setCustomName("");
      setError(null);
      setSuccess(false);
      setProgress(0);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setCustomName(file.name);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setCustomName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !user) return;
    if (!customName.trim()) {
      setError("Please specify a name/title for the file.");
      return;
    }

    setSaving(true);
    setError(null);
    setProgress(10); // Start progress indication

    try {
      const sanitizedName = customName.trim();
      const folderPath = user.institution_id || user.tenant_id || "shared";
      const storagePath = `${folderPath}/${Date.now()}_${selectedFile.name}`;

      // Upload to Supabase Storage - 'files' bucket
      setProgress(30);
      const { data: storageData, error: storageError } = await supabase.storage
        .from("files")
        .upload(storagePath, selectedFile, { upsert: false });

      if (storageError) throw storageError;

      setProgress(60);

      // Register in files table
      const { error: dbError } = await supabase.from("files").insert({
        name: sanitizedName,
        file_url: storageData.path,
        file_type: selectedFile.type || "application/octet-stream",
        file_size: selectedFile.size,
        folder: null,
        visibility: "all",
        uploaded_by_id: user.id,
        institution_id: user.institution_id || null,
        tenant_id: user.tenant_id || null,
        storage_path: storageData.path,
      });

      if (dbError) throw dbError;

      setProgress(100);
      setSuccess(true);
      window.dispatchEvent(new CustomEvent("mediahive:dashboard-refresh"));
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to upload file. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="studio-panel border-white/10 max-w-md w-full text-[var(--text-primary)] p-6 shadow-2xl !flex !flex-col !gap-4 max-h-[90vh] overflow-y-auto !h-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-wide text-[var(--text-primary)]">
            Upload Document
          </DialogTitle>
          <DialogDescription className="sr-only">
            Upload a document to the project storage bucket.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
              <Check size={24} strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-[var(--accent)]">File uploaded successfully!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center border border-dashed border-[var(--border)] hover:border-[var(--accent)]/30 hover:bg-[var(--bg-tertiary)]/20 cursor-pointer rounded-2xl p-8 gap-3 transition-all relative overflow-hidden"
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                disabled={saving}
                className="hidden"
              />

              {selectedFile ? (
                <>
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent-wash)] border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)]">
                    <FileIcon size={22} />
                  </div>
                  <div className="flex flex-col items-center text-center max-w-full">
                    <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[200px]">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)]">
                    <UploadCloud size={22} />
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      Drag & drop file, or browse
                    </span>
                    <span className="text-[10px] text-[var(--text-secondary)] mt-1">
                      Max file size: 100MB
                    </span>
                  </div>
                </>
              )}
            </div>

            {selectedFile && (
              <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  File Display Name *
                </label>
                <input
                  required
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter custom file display name"
                  disabled={saving}
                  className="glass-form-input placeholder:text-[var(--text-tertiary)] w-full"
                />
              </div>
            )}

            {saving && (
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span>Uploading file metadata...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !selectedFile || !customName.trim()}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--bg-primary)] text-sm font-semibold py-2.5 rounded-full active:scale-[0.98] transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <span>Upload Document</span>
              )}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

