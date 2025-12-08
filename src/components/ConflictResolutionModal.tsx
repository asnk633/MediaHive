"use client";
// src/components/ConflictResolutionModal.tsx
// Conflict resolution modal for handling task edit conflicts

import React, { useState } from 'react';
import { 
  ConflictItem, 
  resolveConflict,
  OfflineTask 
} from '@/lib/offline-db';

interface ConflictResolutionModalProps {
  conflict: ConflictItem;
  onClose: () => void;
  onResolve: () => void;
}

export function ConflictResolutionModal({ 
  conflict, 
  onClose, 
  onResolve 
}: ConflictResolutionModalProps) {
  const [resolution, setResolution] = useState<'local' | 'server' | 'manual'>('manual');
  const [manualTitle, setManualTitle] = useState(conflict.localVersion.title);
  const [manualDescription, setManualDescription] = useState(conflict.localVersion.description || '');
  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = async () => {
    setIsResolving(true);
    
    try {
      let manualResolution: OfflineTask | undefined;
      
      if (resolution === 'manual') {
        manualResolution = {
          ...conflict.localVersion,
          title: manualTitle,
          description: manualDescription
        };
      }
      
      await resolveConflict(conflict.id!, resolution, manualResolution);
      onResolve();
      onClose();
    } catch (error) {
      console.error('Error resolving conflict:', error);
      alert('Failed to resolve conflict. Please try again.');
    } finally {
      setIsResolving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[var(--panel)] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[var(--glass-border)]">
        <h2 className="text-xl font-bold mb-4">Conflict Resolution Required</h2>
        
        <div className="mb-6">
          <p className="text-[var(--text)] mb-2">
            This task has been modified both locally and on the server. Please choose how to resolve the conflict:
          </p>
          
          <div className="bg-[var(--panel-strong)] p-4 rounded mb-4 border border-[var(--glass-border)]">
            <h3 className="font-semibold mb-2">Task: {conflict.localVersion.title}</h3>
            <p className="text-sm text-[var(--muted)]">
              Last modified locally: {formatDate(conflict.localVersion.updatedAt)}
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="resolution"
                value="local"
                checked={resolution === 'local'}
                onChange={() => setResolution('local')}
                className="text-[var(--accent)]"
              />
              <span className="text-[var(--text)]">Use Local Version</span>
            </label>
            <p className="text-sm text-[var(--muted)] ml-6">
              Keep your local changes and discard server changes
            </p>
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="resolution"
                value="server"
                checked={resolution === 'server'}
                onChange={() => setResolution('server')}
                className="text-[var(--accent)]"
              />
              <span className="text-[var(--text)]">Use Server Version</span>
            </label>
            <p className="text-sm text-[var(--muted)] ml-6">
              Keep the server changes and discard your local changes
            </p>
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="resolution"
                value="manual"
                checked={resolution === 'manual'}
                onChange={() => setResolution('manual')}
                className="text-[var(--accent)]"
              />
              <span className="text-[var(--text)]">Manual Merge</span>
            </label>
            <p className="text-sm text-[var(--muted)] ml-6 mb-2">
              Manually merge the changes
            </p>
            
            {resolution === 'manual' && (
              <div className="ml-6 space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--text)]">Title</label>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="w-full bg-[var(--panel)] border border-[var(--glass-border)] rounded px-3 py-2 text-[var(--text)]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--text)]">Description</label>
                  <textarea
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    className="w-full bg-[var(--panel)] border border-[var(--glass-border)] rounded px-3 py-2 text-[var(--text)]"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={isResolving}
            className="px-4 py-2 bg-[var(--panel)] hover:bg-[var(--panel-strong)] rounded disabled:opacity-50 border border-[var(--glass-border)]"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={isResolving}
            className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-2)] rounded disabled:opacity-50"
          >
            {isResolving ? 'Resolving...' : 'Resolve Conflict'}
          </button>
        </div>
      </div>
    </div>
  );
}