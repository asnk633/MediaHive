'use client';

import React, { useEffect, useState } from 'react';
import { Task } from "@/features/tasks/types/task";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Eye,
  TrendingUp
} from 'lucide-react';
import { isFeatureEnabled } from '@/app/featureFlags';
import { SystemHealthPanel } from '@/components/admin/SystemHealthPanel';
import { InviteUserPanel } from '@/components/admin/InviteUserPanel';
import { UserManagementPanel } from '@/components/admin/UserManagementPanel';
import { useAuth } from '@/contexts/AuthContextProvider';
import { DemoDataButton } from '@/components/DemoDataButton';

import { Event } from '@/features/events/types/event';
import { DriveFile as MediaFile } from '@/types/file';
import { User } from '@/types/user';

interface AdminConfidencePanelProps {
  tasks: Task[];
  events?: Event[];
  mediaFiles?: MediaFile[];
  users?: User[];
  institution_id?: string;
  onTaskClick?: (task: Task) => void;
}

const AdminConfidencePanel: React.FC<AdminConfidencePanelProps> = ({ tasks, events, mediaFiles, users, institution_id, onTaskClick }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Local helper for safe date parsing across ISO and legacy formats
  const parseDate = (d: any): Date => {
    if (!d) return new Date(0);
    if (d instanceof Date) return d;
    if (typeof d === 'string') return new Date(d);
    if (d.seconds) return new Date(d.seconds * 1000);
    return new Date(d);
  };

  // Check if workflow power tools feature is enabled
  const isFeatureEnabledFlag = isFeatureEnabled('workflowPowerTools');

  // If feature is disabled or not admin, don't render the panel
  if (!isFeatureEnabledFlag || !isAdmin) {
    return null;
  }

  // Calculate metrics
  const tasksBlockedOnMedia = tasks.filter(t => t.status !== 'done' && !t.media_uploaded).length;
  const tasksReadyForCompletion = tasks.filter(t =>
    t.status !== 'done' &&
    t.media_uploaded &&
    t.media_approved
  ).length;

  const recentlyApprovedMediaCount = tasks.filter(t => {
    const approvedDate = parseDate(t.media_approved_date);
    return t.media_approved && approvedDate > new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
  }).length;

  const staleTasks = tasks.filter(t => {
    // Tasks that have been in progress for more than 7 days without updates
    const createdDate = parseDate(t.created_at);
    const now = new Date();
    const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
    return daysDiff > 7 && t.status !== 'done';
  }).length;

  // Get sample tasks for each category
  const blockedTasks = tasks.filter(t => t.status !== 'done' && !t.media_uploaded).slice(0, 3);
  const readyTasks = tasks.filter(t => t.status !== 'done' && t.media_uploaded && t.media_approved).slice(0, 3);
  const approvedTasks = tasks.filter(t => {
    const approvedDate = parseDate(t.media_approved_date);
    return t.media_approved && approvedDate > new Date(Date.now() - 24 * 60 * 60 * 1000);
  }).slice(0, 3);

  const staleTaskSamples = tasks.filter(t => {
    const createdDate = parseDate(t.created_at);
    const now = new Date();
    const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
    return daysDiff > 7 && t.status !== 'done';
  }).slice(0, 3);

  return (
    <div className="bg-foreground/5 backdrop-blur-md border border-[#ffffff1a] rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-foreground">Admin Confidence Panel</h3>
        </div>
        <DemoDataButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tasks Blocked on Media */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h4 className="font-medium text-foreground">Blocked on Media</h4>
            <Badge className="bg-red-500/20 text-red-300 ml-auto">{tasksBlockedOnMedia}</Badge>
          </div>
          <div className="space-y-2">
            {blockedTasks.length > 0 ? (
              blockedTasks.map(task => (
                <div key={task.id} className="text-sm p-2 bg-black/10 rounded border border-foreground/5">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-left text-blue-300 hover:text-blue-200"
                    onClick={() => onTaskClick?.(task)}
                  >
                    {task.title}
                  </Button>
                  <div className="text-xs text-foreground/60 mt-1">
                    Status: {task.status?.replace('_', ' ') || 'todo'}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <div className="text-2xl mb-1">✅</div>
                <p className="text-sm text-foreground/60">
                  {isFeatureEnabled('onboardingLayer')
                    ? 'No tasks blocked on media. This shows workflow bottlenecks.'
                    : 'No tasks blocked on media'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tasks Ready for Completion */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h4 className="font-medium text-foreground">Ready for Completion</h4>
            <Badge className="bg-green-500/20 text-green-300 ml-auto">{tasksReadyForCompletion}</Badge>
          </div>
          <div className="space-y-2">
            {readyTasks.length > 0 ? (
              readyTasks.map(task => (
                <div key={task.id} className="text-sm p-2 bg-black/10 rounded border border-foreground/5">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-left text-blue-300 hover:text-blue-200"
                    onClick={() => onTaskClick?.(task)}
                  >
                    {task.title}
                  </Button>
                  <div className="text-xs text-foreground/60 mt-1">
                    Media: {task.media_uploaded ? 'Uploaded' : 'Missing'}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <div className="text-2xl mb-1">🎉</div>
                <p className="text-sm text-foreground/60">
                  {isFeatureEnabled('onboardingLayer')
                    ? 'No tasks ready for completion. These are tasks with approved media.'
                    : 'No tasks ready for completion'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recently Approved Media */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-blue-400" />
            <h4 className="font-medium text-foreground">Recently Approved</h4>
            <Badge className="bg-blue-500/20 text-blue-300 ml-auto">{recentlyApprovedMediaCount}</Badge>
          </div>
          <div className="space-y-2">
            {approvedTasks.length > 0 ? (
              approvedTasks.map(task => (
                <div key={task.id} className="text-sm p-2 bg-black/10 rounded border border-foreground/5">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-left text-blue-300 hover:text-blue-200"
                    onClick={() => onTaskClick?.(task)}
                  >
                    {task.title}
                  </Button>
                  <div className="text-xs text-foreground/60 mt-1">
                    Approved: {parseDate(task.media_approved_date).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <div className="text-2xl mb-1">👍</div>
                <p className="text-sm text-foreground/60">
                  {isFeatureEnabled('onboardingLayer')
                    ? 'No recently approved media. These are media files approved in the last 24 hours.'
                    : 'No recently approved media'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Stale Tasks */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-yellow-400" />
            <h4 className="font-medium text-foreground">Stale Tasks</h4>
            <Badge className="bg-yellow-500/20 text-yellow-300 ml-auto">{staleTasks}</Badge>
          </div>
          <div className="space-y-2">
            {staleTaskSamples.length > 0 ? (
              staleTaskSamples.map(task => (
                <div key={task.id} className="text-sm p-2 bg-black/10 rounded border border-foreground/5">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-left text-blue-300 hover:text-blue-200"
                    onClick={() => onTaskClick?.(task)}
                  >
                    {task.title}
                  </Button>
                  <div className="text-xs text-foreground/60 mt-1">
                    Days open: {Math.floor((Date.now() - parseDate(task.created_at).getTime()) / (1000 * 3600 * 24))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <div className="text-2xl mb-1">⏰</div>
                <p className="text-sm text-foreground/60">
                  {isFeatureEnabled('onboardingLayer')
                    ? 'No stale tasks. These are tasks open for more than 7 days.'
                    : 'No stale tasks'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Health Panel - Admin Only */}
      <SystemHealthPanel
        tasks={tasks}
        events={events || []}
        mediaFiles={mediaFiles || []}
        users={users || []}
      />

      {/* Invite User Panel - Admin Only */}
      {institution_id && (
        <InviteUserPanel institution_id={institution_id} />
      )}

      {/* User Management Panel - Admin Only */}
      {institution_id && (
        <UserManagementPanel institution_id={institution_id} />
      )}
    </div>
  );
};

export default AdminConfidencePanel;
