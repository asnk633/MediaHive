// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Task } from '@/features/tasks/types/task';
import { BulkOperationsService } from '@/services/bulkOperationsService';
import { Button } from '@/components/ui/button';
import {
  Users,
  Flag,
  ListChecks,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  X,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

import { UserService } from '@/services/userService';
import { DropdownSelector } from '@/components/ui/selectors/DropdownSelector';
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
  const [operation, setOperation] = useState<'assign' | 'changePriority' | 'changeStatus' | 'delete' | 'extendDeadline' | 'flagBlocked' | ''>('');
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
    const validation = BulkOperationsService.validateBulkOperation(selectedTaskIds, operation as any);

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
      operation as string,
      value,
      tasks
    );
  };

  const selectedTasks = tasks.filter(task => selectedTaskIds.includes(task.id));

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#0B0E14]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 transition-all duration-300">
        {!isOpen ? (
          <div className="flex items-center gap-2 pr-1">
            <div className="bg-blue-500/10 text-blue-400 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-blue-500/20 mr-2 ml-1">
              {selectedTaskIds.length} Selected
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => handleOperationSelect('assign')}
                className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] hover:bg-white/10 text-white/40 hover:text-white rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest border border-white/5"
              >
                <Users className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                Assign
              </button>

              <button
                onClick={() => handleOperationSelect('changePriority')}
                className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] hover:bg-white/10 text-white/40 hover:text-white rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest border border-white/5"
              >
                <Flag className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                Priority
              </button>

              <button
                onClick={() => handleOperationSelect('changeStatus')}
                className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] hover:bg-white/10 text-white/40 hover:text-white rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest border border-white/5"
              >
                <ListChecks className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                Status
              </button>

              <div className="w-px h-4 bg-white/5 mx-1" />

              <button
                onClick={() => { setOperation('extendDeadline'); setValue(''); setIsOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] hover:bg-white/10 text-white/40 hover:text-white rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest border border-white/5"
              >
                <Calendar className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                Extend
              </button>

              <button
                onClick={() => { setOperation('flagBlocked'); setValue('flag'); setIsOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/5 hover:bg-amber-500/10 text-amber-500/60 hover:text-amber-400 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest border border-amber-500/10"
              >
                <AlertTriangle className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                Block
              </button>

              <button
                onClick={() => { setOperation('delete'); setValue('DELETE'); setIsOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/5 hover:bg-red-500/20 text-red-500/40 hover:text-red-400 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest border border-red-500/10 ml-2"
              >
                <AlertCircle className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                Discard
              </button>
            </div>

            <div className="w-px h-6 bg-white/5 mx-2" />

            <button
              onClick={onClearSelection}
              className="p-2 text-white/20 hover:text-white/60 hover:bg-white/5 rounded-lg transition-all"
              title="Clear Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-80 p-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">
                {operation === 'assign' && 'Institutional Assignment'}
                {operation === 'changePriority' && 'Priority Calibration'}
                {operation === 'changeStatus' && 'Status Override'}
                {operation === 'extendDeadline' && 'Deadline Extension'}
                {operation === 'flagBlocked' && <span className="text-amber-500">Flag as Blocked / Review</span>}
                {operation === 'delete' && <span className="text-red-500/80 underline decoration-red-500/20">Discard Institutional Tasks</span>}
              </h3>
              <button
                onClick={handleClose}
                className="text-white/20 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-6 space-y-1">
              <p className="text-[10px] font-bold text-white uppercase tracking-widest">
                {getOperationSummary()}
              </p>
              <div className="text-[9px] font-bold text-white/20 uppercase tracking-[0.15em]">
                Targeting {selectedTaskIds.length} unit{selectedTaskIds.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="mb-8">
              {operation === 'assign' && (
                <div className="space-y-0.5">
                  <DropdownSelector 
                    label="Assign to Member"
                    value={value}
                    onChange={(val) => setValue(val)}
                    placeholder="Select Team Member"
                    options={teamMembers.map(member => ({
                      id: member.uid,
                      label: member.name,
                      icon: <Users size={14} />
                    }))}
                  />
                </div>
              )}

              {operation === 'changePriority' && (
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setValue(p)}
                      className={cn(
                        "p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                        value === p
                          ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                          : 'bg-white/[0.03] border-white/5 text-white/50 hover:bg-white/10'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              {operation === 'changeStatus' && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'todo', label: 'To Do', icon: ListChecks },
                    { id: 'in_progress', label: 'Working', icon: Flag },
                    { id: 'review', label: 'On Hold', icon: AlertTriangle },
                    { id: 'done', label: 'Sync Complete', icon: CheckCircle }
                  ].map(status => {
                    const Icon = status.icon;
                    return (
                      <button
                        key={status.id}
                        onClick={() => setValue(status.id)}
                        className={cn(
                          "p-3 rounded-xl border flex flex-col items-center gap-2 transition-all",
                          value === status.id
                            ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                            : 'bg-white/[0.03] border-white/5 text-white/50 hover:bg-white/10'
                        )}
                      >
                        <Icon size={14} className="opacity-40" />
                        <div className="text-[9px] font-bold uppercase tracking-widest">{status.label}</div>
                      </button>
                    );
                  })}
                </div>
              )}

              {operation === 'extendDeadline' && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setValue('1day')} className={cn("p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all", value === '1day' ? "bg-blue-500/10 border-blue-500 text-blue-400" : "bg-white/5 border-white/10 opacity-60 hover:opacity-100")}>+1 Day</button>
                  <button onClick={() => setValue('1week')} className={cn("p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all", value === '1week' ? "bg-blue-500/10 border-blue-500 text-blue-400" : "bg-white/5 border-white/10 opacity-60 hover:opacity-100")}>+1 Week</button>
                </div>
              )}

              {operation === 'flagBlocked' && (
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                  <p className="text-[10px] text-amber-500/80 font-bold uppercase tracking-widest leading-relaxed text-center">
                    This will mark selected tasks as 'On Hold' and 'High Priority'.
                  </p>
                </div>
              )}

              {operation === 'delete' && (
                <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                  <p className="text-[10px] text-red-500/60 font-bold uppercase tracking-widest leading-relaxed text-center">
                    Destructive Action. Verification Required for Permanent Removal.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-white/[0.03] border border-white/5 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-[10px] font-bold uppercase tracking-widest text-white rounded-xl shadow-[0_10px_20px_rgba(37,99,235,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                disabled={isLoading || !value}
              >
                {isLoading ? 'Processing...' : 'Verify & Apply'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
