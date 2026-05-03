/**
 * Phase 8B: Conflict Resolution Center
 * 
 * Dedicated page for viewing and resolving persistent conflicts
 * with non-blocking, user-controlled resolution.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Clock, 
  User, 
  Calendar,
  X,
  Check,
  Eye,
  EyeOff,
  Filter,
  ArrowLeft,
  Server,
  HardDrive,
  Hash,
  Tag,
  Shield,
  Zap,
  Archive,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { usePersistentConflicts } from '@/hooks/usePersistentConflicts';
import { ConflictStatus, ConflictResolution } from '@/lib/conflictStore';
import type { ConflictCategory } from '@/domain/conflicts/types';
import { usePolicyGuidance } from '@/hooks/usePolicyGuidance';
import { formatDate } from '@/lib/dateUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { PolicyGuidanceDisplay } from '@/components/conflicts/PolicyGuidanceDisplay';
import { DropdownSelector } from '@/components/ui/selectors/DropdownSelector';

interface ConflictResolutionCenterProps {
  onBack?: () => void;
}

export const ConflictResolutionCenter: React.FC<ConflictResolutionCenterProps> = ({ onBack }) => {
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [filterCategory, setFilterCategory] = useState<ConflictCategory | 'all'>('all');
  
  const { 
    conflicts, 
    loading, 
    error, 
    resolveConflict, 
    updateConflictStatus,
    getUnresolvedCount
  } = usePersistentConflicts({
    status: showResolved ? undefined : [ConflictStatus.DETECTED, ConflictStatus.SURFACED]
  });

  const unresolvedCount = conflicts.filter(c => 
    c.status === ConflictStatus.DETECTED || c.status === ConflictStatus.SURFACED
  ).length;

  const filteredConflicts = conflicts.filter(conflict => {
    if (filterCategory !== 'all' && conflict.category !== filterCategory) {
      return false;
    }
    return true;
  });

  const selectedConflict = conflicts.find(c => c.id === selectedConflictId);

  // Phase 10: Policy guidance for selected conflict
  const policyGuidance = usePolicyGuidance({
    conflict: selectedConflict || {
      taskId: '',
      field: '',
      category: 'content' as ConflictCategory,
      localValue: '',
      serverValue: '',
      remoteActor: '',
      timestamp: Date.now()
    } as any,
    userRole: 'team', // Placeholder - would come from actual user context
    remoteUserRole: selectedConflict?.remoteActorRole || 'team',
    isOnline: true, // Placeholder - would come from actual connectivity context
    isReplaying: false, // Placeholder - would come from actual replay state
    isPaused: false, // Placeholder - would come from actual pause state
    hasPatch: false, // Simplified check - would come from actual patch state
    isBootComplete: true // Placeholder - would come from actual boot state
  });

  const getStatusBadge = (status: ConflictStatus) => {
    switch (status) {
      case ConflictStatus.DETECTED:
        return <Badge variant="warning">Detected</Badge>;
      case ConflictStatus.SURFACED:
        return <Badge variant="info">Surfaced</Badge>;
      case ConflictStatus.RESOLVED:
        return <Badge variant="success">Resolved</Badge>;
      case ConflictStatus.DISMISSED:
        return <Badge variant="neutral">Dismissed</Badge>;
    }
  };

  const getCategoryBadge = (category: ConflictCategory) => {
    switch (category) {
      case 'benign':
        return <Badge variant="success">Benign</Badge>;
      case 'content':
        return <Badge variant="warning">Content</Badge>;
      case 'structural':
        return <Badge variant="danger">Structural</Badge>;
    }
  };

  const handleResolve = async (id: string, resolution: ConflictResolution) => {
    const success = await resolveConflict(id, resolution, 'user');
    if (success && selectedConflictId === id) {
      setSelectedConflictId(null);
    }
  };

  const handleDismiss = async (id: string) => {
    await updateConflictStatus(id, ConflictStatus.DISMISSED, 'user', 'User dismissed conflict');
    if (selectedConflictId === id) {
      setSelectedConflictId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/60">Loading conflicts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-2">Failed to load conflicts</p>
          <p className="text-white/60 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="text-white/60 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold">Conflict Resolution Center</h1>
              <p className="text-white/60 mt-1">
                {unresolvedCount} unresolved conflicts requiring attention
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResolved(!showResolved)}
              className="flex items-center gap-2"
            >
              {showResolved ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showResolved ? 'Hide Resolved' : 'Show All'}
            </Button>
            
            <div className="px-2">
              <DropdownSelector 
                label="Category Filter"
                value={filterCategory}
                onChange={val => setFilterCategory(val as any)}
                options={[
                  { id: 'all', label: 'All Categories' },
                  { id: 'benign', label: 'Benign', icon: <Check size={14} className="text-green-400" /> },
                  { id: 'content', label: 'Content', icon: <AlertTriangle size={14} className="text-orange-400" /> },
                  { id: 'structural', label: 'Structural', icon: <Zap size={14} className="text-red-400" /> },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conflict List */}
        <div className="w-1/2 border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Conflicts ({filteredConflicts.length})
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence>
              {filteredConflicts.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-center p-8">
                  <div>
                    <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-white/60">No conflicts found</p>
                    {filterCategory !== 'all' && (
                      <p className="text-sm text-white/40 mt-2">
                        Try changing your filter settings
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {filteredConflicts.map((conflict) => (
                    <motion.div
                      key={conflict.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`p-4 hover:bg-gray-800/50 cursor-pointer transition-colors ${
                        selectedConflictId === conflict.id ? 'bg-gray-800' : ''
                      }`}
                      onClick={() => setSelectedConflictId(conflict.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-sm text-blue-400">
                              <Hash className="h-3 w-3 inline mr-1" />
                              {conflict.taskId.substring(0, 8)}
                            </span>
                            {getCategoryBadge(conflict.category)}
                            {getStatusBadge(conflict.status)}
                          </div>
                          
                          <h3 className="font-medium truncate mb-1">
                            Field: {conflict.field}
                          </h3>
                          
                          <div className="flex items-center gap-4 text-sm text-white/60">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {conflict.remoteActor}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(new Date(conflict.timestamp))}
                            </div>
                          </div>
                          
                          <div className="mt-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-green-400">Local:</span>
                              <span className="font-mono text-xs bg-green-900/20 px-2 py-1 rounded">
                                {String(conflict.localValue).substring(0, 30)}
                                {String(conflict.localValue).length > 30 ? '...' : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-amber-400">Remote:</span>
                              <span className="font-mono text-xs bg-amber-900/20 px-2 py-1 rounded">
                                {String(conflict.serverValue).substring(0, 30)}
                                {String(conflict.serverValue).length > 30 ? '...' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <ChevronRight className="h-5 w-5 text-white/40 ml-2" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Conflict Detail */}
        <div className="w-1/2 flex flex-col">
          {selectedConflict ? (
            <>
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Conflict Details</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    {showDetails ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </div>
                
                {showDetails && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white/60 mb-2">Task Information</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-white/40">Task ID:</span>
                          <div className="font-mono text-blue-400">{selectedConflict.taskId}</div>
                        </div>
                        <div>
                          <span className="text-white/40">Field:</span>
                          <div className="font-medium">{selectedConflict.field}</div>
                        </div>
                        <div>
                          <span className="text-white/40">Category:</span>
                          <div>{getCategoryBadge(selectedConflict.category)}</div>
                        </div>
                        <div>
                          <span className="text-white/40">Status:</span>
                          <div>{getStatusBadge(selectedConflict.status)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold text-white/60 mb-2">Conflict Values</h3>
                      <div className="space-y-3">
                        <div className="bg-green-900/10 border border-green-800 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="font-semibold text-green-400">Your Value (Local)</span>
                          </div>
                          <pre className="font-mono text-sm bg-black/20 p-2 rounded">
                            {JSON.stringify(selectedConflict.localValue, null, 2)}
                          </pre>
                        </div>
                        
                        <div className="bg-amber-900/10 border border-amber-800 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span className="font-semibold text-amber-400">Remote Value</span>
                            <span className="text-xs text-amber-400/60">
                              by {selectedConflict.remoteActor}
                            </span>
                          </div>
                          <pre className="font-mono text-sm bg-black/20 p-2 rounded">
                            {JSON.stringify(selectedConflict.serverValue, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-white/60">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4" />
                        <span>Detected: {formatDate(new Date(selectedConflict.created_at))}</span>
                      </div>
                      {selectedConflict.resolvedAt && (
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Resolved: {formatDate(new Date(selectedConflict.resolvedAt))}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Phase 10: Policy Guidance Display */}
                    {policyGuidance && policyGuidance.explanations.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <PolicyGuidanceDisplay explanations={policyGuidance.explanations} />
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex-1 p-6">
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    Resolution Options
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Button
                        variant="default"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleResolve(selectedConflict.id, ConflictResolution.LOCAL)}
                        disabled={selectedConflict.status === ConflictStatus.RESOLVED}
                      >
                        <HardDrive className="h-4 w-4 mr-2" />
                        Keep My Changes
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="flex-1 border-amber-600 text-amber-400 hover:bg-amber-900/20"
                        onClick={() => handleResolve(selectedConflict.id, ConflictResolution.SERVER)}
                        disabled={selectedConflict.status === ConflictStatus.RESOLVED}
                      >
                        <Server className="h-4 w-4 mr-2" />
                        Accept Remote Changes
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      className="w-full text-white/60 hover:text-white hover:bg-gray-700"
                      onClick={() => handleDismiss(selectedConflict.id)}
                      disabled={selectedConflict.status === ConflictStatus.RESOLVED}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Dismiss Conflict
                    </Button>
                  </div>
                  
                  {selectedConflict.status === ConflictStatus.RESOLVED && (
                    <div className="mt-4 p-3 bg-green-900/20 border border-green-800 rounded-lg text-center">
                      <Check className="h-5 w-5 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-green-400">
                        This conflict has been resolved
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center p-8">
              <div>
                <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <p className="text-white/60">Select a conflict to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
