'use client';

import React, { useState, useEffect } from 'react';
import { isFeatureEnabled } from '@/app/featureFlags';
import { EdgeCaseService } from '@/services/edgeCaseService';
import { Task } from "@/features/tasks/types/task";
import { Event } from '@/features/events/types/event';
import { DriveFile as MediaFile } from '@/types/file';
import { User } from '@/types/user';
import { AlertTriangle, Info, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoDataService } from '@/services/demoDataService';
import { useAuth } from '@/contexts/AuthContextProvider';

interface SystemHealthPanelProps {
  tasks: Task[];
  events: Event[];
  mediaFiles: MediaFile[];
  users: User[];
}

export const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({
  tasks,
  events,
  mediaFiles,
  users
}) => {
  const { user } = useAuth();
  const [isFeatureEnabledFlag, setIsFeatureEnabledFlag] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  useEffect(() => {
    const checkFeature = async () => {
      const enabled = isFeatureEnabled('onboardingLayer'); // Using onboardingLayer as admin-only feature
      setIsFeatureEnabledFlag(enabled);
      if (enabled) {
        analyzeHealth();
      }
    };

    checkFeature();
  }, []);

  const analyzeHealth = async () => {
    setLoading(true);
    try {
      const result = EdgeCaseService.analyze(tasks, events, mediaFiles, users);

      // Also check for demo data
      const demoDataCount = {
        tasks: tasks.filter(t => t.is_demo_data).length,
        events: events.filter(e => e.is_demo_data).length,
        media: mediaFiles.filter(m => m.is_demo_data).length,
        totalDemoItems: tasks.filter(t => t.is_demo_data).length +
          events.filter(e => e.is_demo_data).length +
          mediaFiles.filter(m => m.is_demo_data).length
      };

      setHealthData({
        ...result,
        demoData: demoDataCount,
        summary: {
          totalTasks: tasks.length,
          totalEvents: events.length,
          totalMedia: mediaFiles.length,
          totalUsers: users.length
        }
      });
    } catch (error) {
      console.error('Error analyzing system health:', error);
    } finally {
      setLoading(false);
    }
  };

  // If feature is disabled, don't render the panel
  if (!isFeatureEnabledFlag) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
        <div className="text-center text-gray-400 py-8">
          No health data available
        </div>
      </div>
    );
  }

  const { orphanedTasks, orphanedMedia, deletedUsers, invalidReferences, demoData, summary } = healthData;

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-400" />
          System Health Overview
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSensitiveData(!showSensitiveData)}
          className="bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50"
        >
          {showSensitiveData ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showSensitiveData ? 'Hide IDs' : 'Show IDs'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <div className="text-2xl font-bold text-blue-400">{summary.totalTasks}</div>
          <div className="text-sm text-gray-400">Total Tasks</div>
        </div>
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <div className="text-2xl font-bold text-green-400">{summary.totalEvents}</div>
          <div className="text-sm text-gray-400">Total Events</div>
        </div>
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <div className="text-2xl font-bold text-purple-400">{summary.totalMedia}</div>
          <div className="text-sm text-gray-400">Total Media</div>
        </div>
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <div className="text-2xl font-bold text-yellow-400">{summary.totalUsers}</div>
          <div className="text-sm text-gray-400">Total Users</div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Demo Data Section */}
        <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-yellow-400" />
            Demo Data
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-yellow-900/20 p-3 rounded border border-yellow-800">
              <div className="text-lg font-bold text-yellow-400">{demoData.tasks}</div>
              <div className="text-sm text-yellow-300">Demo Tasks</div>
            </div>
            <div className="bg-yellow-900/20 p-3 rounded border border-yellow-800">
              <div className="text-lg font-bold text-yellow-400">{demoData.events}</div>
              <div className="text-sm text-yellow-300">Demo Events</div>
            </div>
            <div className="bg-yellow-900/20 p-3 rounded border border-yellow-800">
              <div className="text-lg font-bold text-yellow-400">{demoData.media}</div>
              <div className="text-sm text-yellow-300">Demo Media</div>
            </div>
            <div className="bg-yellow-900/20 p-3 rounded border border-yellow-800">
              <div className="text-lg font-bold text-yellow-400">{demoData.totalDemoItems}</div>
              <div className="text-sm text-yellow-300">Total Demo</div>
            </div>
          </div>
          {demoData.totalDemoItems > 0 && (
            <div className="mt-3 text-sm text-yellow-300">
              <p className="mb-2">Demo data is present in the system. Consider cleaning it before production use.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (window.confirm('Are you sure you want to delete all demo data? This action cannot be undone.')) {
                    try {
                      const institution_id = (user as any)?.institution_id;
                      await DemoDataService.deleteDemoData(institution_id);
                      alert('Demo data deleted successfully. Please refresh the page.');
                    } catch (error) {
                      console.error('Error deleting demo data:', error);
                      alert('Failed to delete demo data. Check console for details.');
                    }
                  }
                }}
                className="bg-red-900/30 border-red-800 text-red-300 hover:bg-red-800/30"
              >
                Delete All Demo Data
              </Button>
            </div>
          )}
        </div>

        {/* Orphaned Tasks */}
        <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            Orphaned Tasks
            <span className="ml-2 bg-orange-900/30 text-orange-300 px-2 py-1 rounded-full text-sm">
              {orphanedTasks.length}
            </span>
          </h3>
          {orphanedTasks.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {orphanedTasks.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between bg-gray-800/50 p-2 rounded border border-gray-700">
                  <div>
                    <div className="text-sm font-medium text-orange-300">
                      {showSensitiveData ? task.id : `Task ${task.id.substring(0, 8)}...`}
                    </div>
                    <div className="text-xs text-gray-400">{task.title}</div>
                  </div>
                  <div className="text-xs bg-orange-900/30 text-orange-300 px-2 py-1 rounded">
                    Missing Event
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center text-green-400 text-sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              No orphaned tasks detected
            </div>
          )}
        </div>

        {/* Orphaned Media */}
        <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            Orphaned Media
            <span className="ml-2 bg-orange-900/30 text-orange-300 px-2 py-1 rounded-full text-sm">
              {orphanedMedia.length}
            </span>
          </h3>
          {orphanedMedia.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {orphanedMedia.map((media: any) => (
                <div key={media.id} className="flex items-center justify-between bg-gray-800/50 p-2 rounded border border-gray-700">
                  <div>
                    <div className="text-sm font-medium text-orange-300">
                      {showSensitiveData ? media.id : `Media ${media.id.substring(0, 8)}...`}
                    </div>
                    <div className="text-xs text-gray-400">{media.originalName}</div>
                  </div>
                  <div className="text-xs bg-orange-900/30 text-orange-300 px-2 py-1 rounded">
                    No Task/Event
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center text-green-400 text-sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              No orphaned media detected
            </div>
          )}
        </div>

        {/* Deleted User References */}
        <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            Deleted User References
            <span className="ml-2 bg-orange-900/30 text-orange-300 px-2 py-1 rounded-full text-sm">
              {deletedUsers.length}
            </span>
          </h3>
          {deletedUsers.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {deletedUsers.map((userId: any) => (
                <div key={userId} className="flex items-center justify-between bg-gray-800/50 p-2 rounded border border-gray-700">
                  <div className="text-sm font-medium text-orange-300">
                    {showSensitiveData ? userId : `User ${userId.substring(0, 8)}...`}
                  </div>
                  <div className="text-xs bg-orange-900/30 text-orange-300 px-2 py-1 rounded">
                    Deleted User
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center text-green-400 text-sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              No deleted user references detected
            </div>
          )}
        </div>

        {/* Invalid References */}
        <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Invalid References
            <span className="ml-2 bg-red-900/30 text-red-300 px-2 py-1 rounded-full text-sm">
              {invalidReferences.length}
            </span>
          </h3>
          {invalidReferences.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {invalidReferences.map((ref: any, index: number) => (
                <div key={index} className="flex items-center justify-between bg-gray-800/50 p-2 rounded border border-gray-700">
                  <div>
                    <div className="text-sm font-medium text-red-300">
                      {showSensitiveData ? ref.id : `${ref.type} ${ref.id.substring(0, 8)}...`}
                    </div>
                    <div className="text-xs text-gray-400">{ref.issue}</div>
                  </div>
                  <div className="text-xs bg-red-900/30 text-red-300 px-2 py-1 rounded capitalize">
                    {ref.type}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center text-green-400 text-sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              No invalid references detected
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
