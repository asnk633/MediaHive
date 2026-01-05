'use client';

import React, { useState } from 'react';
import { Task } from '@/types/task';
import { BulkOperationsService } from '@/services/bulkOperationsService';
import { Button } from '@/components/ui/button';
import {
  Users,
  Flag,
  ListChecks,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { toast } from 'sonner';

import { UserService } from '@/services/userService';
import { isFeatureEnabled } from '@/app/featureFlags';

interface BulkOperationsToolbarProps {
  selectedTaskIds: string[];
  tasks: Task[];
  onOperationComplete: () => void;
  onClearSelection: () => void;
}

export const BulkOperationsToolbar: React.FC<BulkOperationsToolbarProps> = ({
  selectedTaskIds,
  tasks,
  onOperationComplete,
  onClearSelection
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [operation, setOperation] = useState<'assign' | 'changePriority' | 'changeStatus' | 'delete' | ''>('');
  const [value, setValue] = useState<any>('');
  const [teamMembers, setTeamMembers] = useState<{ uid: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Check if workflow power tools feature is enabled
  const isFeatureEnabledFlag = isFeatureEnabled('workflowPowerTools');

  // If feature is disabled, don't render the toolbar
  if (!isFeatureEnabledFlag) {
    return null;
  }

  const loadTeamMembers = async () => {
    try {
      const members = await UserService.getTeamMembers();
      setTeamMembers(members);
    } catch (error) {
      console.error('Failed to load team members:', error);
      toast.error('Failed to load team members');
    }
  };

  const handleOperationSelect = (op: 'assign' | 'changePriority' | 'changeStatus') => {
    setOperation(op);
    setValue('');

    // Load team members if assigning
    if (op === 'assign') {
      loadTeamMembers();
    }

    setIsOpen(true);
  };

  const handleConfirm = async () => {
    console.log('[BulkOps] Confirm clicked', { operation, value, selectedCount: selectedTaskIds.length });

    if (!operation || !value) {
      console.warn('[BulkOps] Missing operation or value', { operation, value });
      toast.error('Please select an operation and value');
      return;
    }

    // Validate bulk operation for safety limits
    const validation = BulkOperationsService.validateBulkOperation(selectedTaskIds, operation);

    if (!validation.isValid) {
      console.warn('[BulkOps] Validation failed', validation);
      toast.error(validation.message);
      return;
    }

    // Show warning if validation has a warning message
    // Skip for delete, as we show warning in UI
    if (validation.message && operation !== 'delete') {
      // Use a small timeout to ensure UI updates before alert blocks
      await new Promise(resolve => setTimeout(resolve, 100));
      const confirmed = window.confirm(`${validation.message}\n\nDo you want to continue?`);
      if (!confirmed) {
        console.log('[BulkOps] User cancelled via confirm dialog');
        return;
      }
    }

    setIsLoading(true);

    try {
      const result = await BulkOperationsService.performBulkOperation(
        selectedTaskIds,
        operation,
        value
      );

      console.log('[BulkOps] Operation result:', result);

      if (result.success) {
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500" size={18} />
            <span>{result.message}</span>
          </div>,
          { duration: 3000 }
        );
        onOperationComplete();
        handleClose();
      } else {
        toast.error(
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500" size={18} />
            <span>Operation completed with errors: {result.message}</span>
          </div>,
          { duration: 5000 }
        );
        console.error('Bulk operation errors:', result.errors);
      }
    } catch (error) {
      toast.error('Failed to perform bulk operation');
      console.error('Bulk operation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setOperation('');
    setValue('');
    setTeamMembers([]);
  };

  const getOperationSummary = () => {
    if (!operation) return '';
    return BulkOperationsService.getOperationSummary(
      selectedTaskIds,
      operation,
      value,
      tasks
    );
  };

  const selectedTasks = tasks.filter(task => selectedTaskIds.includes(task.id));

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gradient-to-r from-[#141e30] to-[#243b55] border border-white/20 rounded-2xl shadow-2xl p-4 backdrop-blur-xl">
        {!isOpen ? (
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-full text-sm font-medium">
              {selectedTaskIds.length} selected
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOperationSelect('assign')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Users className="w-4 h-4 mr-2" />
                Assign
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOperationSelect('changePriority')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Flag className="w-4 h-4 mr-2" />
                Priority
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOperationSelect('changeStatus')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ListChecks className="w-4 h-4 mr-2" />
                Status
              </Button>

              {/* DELETE BUTTON */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setOperation('delete'); setValue('DELETE'); setIsOpen(true); }}
                className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                {operation === 'assign' && 'Assign Tasks'}
                {operation === 'changePriority' && 'Change Priority'}
                {operation === 'changeStatus' && 'Change Status'}
                {operation === 'delete' && <span className="text-red-500 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Delete Tasks</span>}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">
                {getOperationSummary()}
              </p>
              <div className="text-xs text-gray-500">
                {selectedTaskIds.length} task{selectedTaskIds.length !== 1 ? 's' : ''} selected
              </div>
            </div>

            <div className="mb-6">
              {operation === 'assign' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assign to:
                  </label>
                  <select
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a team member</option>
                    {teamMembers.map(member => (
                      <option key={member.uid} value={member.uid}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {operation === 'changePriority' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priority:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'high'] as const).map(priority => (
                      <button
                        key={priority}
                        onClick={() => setValue(priority)}
                        className={`p-3 rounded-lg border text-center transition-all ${value === priority
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                          : 'bg-black/30 border-white/20 text-gray-300 hover:bg-white/10'
                          }`}
                      >
                        <div className="font-medium capitalize">{priority}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {operation === 'changeStatus' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { id: 'pending', label: 'Pending', icon: AlertTriangle },
                      { id: 'todo', label: 'To Do', icon: ListChecks },
                      { id: 'in_progress', label: 'In Progress', icon: Flag },
                      { id: 'review', label: 'Review', icon: AlertTriangle },
                      { id: 'done', label: 'Done', icon: CheckCircle }
                    ] as const).map(status => {
                      const Icon = status.icon;
                      return (
                        <button
                          key={status.id}
                          onClick={() => setValue(status.id)}
                          className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${value === status.id
                            ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                            : 'bg-black/30 border-white/20 text-gray-300 hover:bg-white/10'
                            }`}
                        >
                          <Icon className="w-4 h-4" />
                          <div className="text-xs font-medium">{status.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {operation === 'delete' && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-200">
                    This action cannot be undone. These tasks will be permanently removed from the system.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                disabled={isLoading || !value}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Applying...
                  </>
                ) : (
                  'Apply Changes'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};