// src/components/TaskActivity.tsx
// Component to display task activity timeline

'use client';

import React, { useState, useEffect } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/contexts/AuthContextProvider';
import { apiClient } from '@/lib/apiClient';
import { supabase } from '@/lib/supabaseClient';

interface Activity {
  id: number;
  taskId: number;
  userId: number;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  metadata: any;
  created_at: string;
}

interface TaskActivityProps {
  taskId: number;
}

export function TaskActivity({ taskId }: TaskActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { can } = usePermission();
  const { user } = useAuth();

  useEffect(() => {
    // Only fetch if user has read permission
    if (!can('read:tasks')) {
      setLoading(false);
      return;
    }

    const fetchActivities = async () => {
      try {
        const { data: taskData, error } = await supabase.from('tasks').select('activity').eq('id', taskId).single();
        if (error) throw error;
        setActivities(taskData?.activity || []);
      } catch (error) {
        console.error('Failed to fetch task activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [taskId, can, user]);

  if (!can('read:tasks')) {
    return null;
  }

  if (loading) {
    return <div>Loading activity timeline...</div>;
  }

  if (activities.length === 0) {
    return <div>No activity found for this task.</div>;
  }

  const formatAction = (activity: Activity) => {
    switch (activity.action) {
      case 'created':
        return 'Task created';
      case 'status_changed':
        return `Status changed from "${activity.oldValue}" to "${activity.newValue}"`;
      case 'review_changed':
        return `Review status changed from "${activity.oldValue}" to "${activity.newValue}"`;
      case 'assigned':
        return `Assigned to user`;
      case 'moved':
        return `Task moved`;
      case 'commented':
        return `Comment added`;
      default:
        return activity.action;
    }
  };

  return (
    <div className="task-activity" data-testid="task-activity">
      <h3>Activity Timeline</h3>
      <div className="activity-list">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="activity-item"
            data-testid={`activity-item-${activity.id}`}
          >
            <div className="activity-header">
              <span className="activity-action">{formatAction(activity)}</span>
              <span className="activity-time">
                {new Date(activity.created_at).toLocaleString()}
              </span>
            </div>
            {activity.metadata && (
              <div className="activity-metadata">
                {JSON.stringify(activity.metadata, null, 2)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
