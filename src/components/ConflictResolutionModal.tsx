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
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Conflict Resolution Required</h2>
        
        <div className="mb-6">
          <p className="text-gray-300 mb-2">
            This task has been modified both locally and on the server. Please choose how to resolve the conflict:
          </p>
          
          <div className="bg-gray-700 p-4 rounded mb-4">
            <h3 className="font-semibold mb-2">Task: {conflict.localVersion.title}</h3>
            <p className="text-sm text-gray-400">
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
                className="text-blue-500"
              />
              <span>Use Local Version</span>
            </label>
            <p className="text-sm text-gray-400 ml-6">
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
                className="text-blue-500"
              />
              <span>Use Server Version</span>
            </label>
            <p className="text-sm text-gray-400 ml-6">
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
                className="text-blue-500"
              />
              <span>Manual Merge</span>
            </label>
            <p className="text-sm text-gray-400 ml-6 mb-2">
              Manually merge the changes
            </p>
            
            {resolution === 'manual' && (
              <div className="ml-6 space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
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
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={isResolving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded disabled:opacity-50"
          >
            {isResolving ? 'Resolving...' : 'Resolve Conflict'}
          </button>
        </div>
      </div>
    </div>
  );
}