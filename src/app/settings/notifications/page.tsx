// src/app/settings/notifications/page.tsx
// Notification Settings Page

'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';

interface NotificationSettings {
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  categories: {
    task: boolean;
    event: boolean;
    system: boolean;
    marketing: boolean;
  };
  channels: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  crossDeviceSync: boolean;
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch notification settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await apiClient('/api/notification-settings', {
          method: 'GET'
        });
        setSettings(data.settings);
      } catch (error) {
        console.error('Failed to fetch notification settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Update notification settings
  const updateSettings = async (updates: Partial<NotificationSettings>) => {
    setSaving(true);
    try {
      const data = await apiClient('/api/notification-settings', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      
      setSettings(data.settings);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    } finally {
      setSaving(false);
    }
  };

  // Toggle quiet hours
  const toggleQuietHours = () => {
    if (settings) {
      updateSettings({
        quietHours: {
          ...settings.quietHours,
          enabled: !settings.quietHours.enabled
        }
      });
    }
  };

  // Update quiet hours time
  const updateQuietHoursTime = (field: 'startTime' | 'endTime', value: string) => {
    if (settings) {
      updateSettings({
        quietHours: {
          ...settings.quietHours,
          [field]: value
        }
      });
    }
  };

  // Toggle category
  const toggleCategory = (category: keyof NotificationSettings['categories']) => {
    if (settings) {
      updateSettings({
        categories: {
          ...settings.categories,
          [category]: !settings.categories[category]
        }
      });
    }
  };

  // Toggle channel
  const toggleChannel = (channel: keyof NotificationSettings['channels']) => {
    if (settings) {
      updateSettings({
        channels: {
          ...settings.channels,
          [channel]: !settings.channels[channel]
        }
      });
    }
  };

  // Toggle cross-device sync
  const toggleCrossDeviceSync = () => {
    if (settings) {
      updateSettings({
        crossDeviceSync: !settings.crossDeviceSync
      });
    }
  };

  if (loading) {
    return <div>Loading notification settings...</div>;
  }

  if (!settings) {
    return <div>Failed to load notification settings.</div>;
  }

  return (
    <div className="notification-settings-page p-6">
      <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>
      
      {/* Quiet Hours Section */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6">
        <h2 className="text-xl font-bold mb-4">Quiet Hours</h2>
        
        <div className="flex items-center mb-4">
          <input
            id="quiet-hours-toggle"
            type="checkbox"
            checked={settings.quietHours.enabled}
            onChange={toggleQuietHours}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="quiet-hours-toggle" className="ml-2 block text-sm text-gray-900">
            Enable quiet hours
          </label>
        </div>
        
        {settings.quietHours.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="start-time">
                Start Time
              </label>
              <input
                id="start-time"
                type="time"
                value={settings.quietHours.startTime}
                onChange={(e) => updateQuietHoursTime('startTime', e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="end-time">
                End Time
              </label>
              <input
                id="end-time"
                type="time"
                value={settings.quietHours.endTime}
                onChange={(e) => updateQuietHoursTime('endTime', e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>
        )}
        
        <p className="text-gray-600 text-sm mt-4">
          During quiet hours, you will only receive notifications marked as urgent.
        </p>
      </div>
      
      {/* Notification Categories Section */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6">
        <h2 className="text-xl font-bold mb-4">Notification Categories</h2>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="task-notifications"
              type="checkbox"
              checked={settings.categories.task}
              onChange={() => toggleCategory('task')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="task-notifications" className="ml-2 block text-sm text-gray-900">
              Task notifications
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="event-notifications"
              type="checkbox"
              checked={settings.categories.event}
              onChange={() => toggleCategory('event')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="event-notifications" className="ml-2 block text-sm text-gray-900">
              Event notifications
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="system-notifications"
              type="checkbox"
              checked={settings.categories.system}
              onChange={() => toggleCategory('system')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="system-notifications" className="ml-2 block text-sm text-gray-900">
              System notifications
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="marketing-notifications"
              type="checkbox"
              checked={settings.categories.marketing}
              onChange={() => toggleCategory('marketing')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="marketing-notifications" className="ml-2 block text-sm text-gray-900">
              Marketing notifications
            </label>
          </div>
        </div>
      </div>
      
      {/* Notification Channels Section */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6">
        <h2 className="text-xl font-bold mb-4">Notification Channels</h2>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="email-notifications"
              type="checkbox"
              checked={settings.channels.email}
              onChange={() => toggleChannel('email')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="email-notifications" className="ml-2 block text-sm text-gray-900">
              Email notifications
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="push-notifications"
              type="checkbox"
              checked={settings.channels.push}
              onChange={() => toggleChannel('push')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="push-notifications" className="ml-2 block text-sm text-gray-900">
              Push notifications
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="sms-notifications"
              type="checkbox"
              checked={settings.channels.sms}
              onChange={() => toggleChannel('sms')}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="sms-notifications" className="ml-2 block text-sm text-gray-900">
              SMS notifications
            </label>
          </div>
        </div>
      </div>
      
      {/* Cross-Device Sync Section */}
      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-6">
        <h2 className="text-xl font-bold mb-4">Cross-Device Sync</h2>
        
        <div className="flex items-center">
          <input
            id="cross-device-sync"
            type="checkbox"
            checked={settings.crossDeviceSync}
            onChange={toggleCrossDeviceSync}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="cross-device-sync" className="ml-2 block text-sm text-gray-900">
            Sync notifications across all devices
          </label>
        </div>
        
        <p className="text-gray-600 text-sm mt-2">
          When enabled, read status and other notification actions will be synchronized across all your devices.
        </p>
      </div>
      
      {/* Save Status */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg">
          Saving settings...
        </div>
      )}
    </div>
  );
}