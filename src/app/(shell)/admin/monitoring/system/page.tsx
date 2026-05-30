'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { DropdownSelector } from '@/components/ui/selectors/DropdownSelector';

interface SystemStats {
  uptime: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  activeUsers: number;
  totalRequests: number;
  errorRate: number;
  responseTime: number;
}

interface AuditStats {
  actionCounts: { action: string; count: number }[];
  resourceTypeCounts: { resourceType: string; count: number }[];
  dailyCounts: { date: string; count: number }[];
  topUsers: { userId: number; count: number; user: any }[];
}

export default function SystemMonitoringPage() {
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedTenant, setSelectedTenant] = useState('all');

  // Fetch system stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch system stats
        const systemData = await apiClient('/api/monitoring/system/stats', {
          method: 'GET'
        });
        setSystemStats(systemData);

        // Fetch audit stats
        const auditData = await apiClient(`/api/audit-log/stats?period=${selectedPeriod}&tenant=${selectedTenant}`, {
          method: 'GET'
        });
        setAuditStats(auditData);
      } catch (error) {
        console.error('Failed to fetch monitoring data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [selectedPeriod, selectedTenant]);

  if (loading) {
    return <div>Loading monitoring data...</div>;
  }

  if (!systemStats || !auditStats) {
    return <div>Failed to load monitoring data</div>;
  }

  return (
    <div className="system-monitoring-page p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">System Monitoring</h1>
        <div className="flex space-x-4">
          <div className="space-y-0.5">
            <DropdownSelector 
              label="Campus"
              value={selectedTenant}
              onChange={setSelectedTenant}
              options={[
                { id: 'all', label: 'All Campuses' },
                { id: '1', label: 'TG Antla' },
                { id: '2', label: 'TG Bangkok' },
                { id: '3', label: 'TG Chiang Mai' },
              ]}
            />
          </div>
          <div className="space-y-0.5">
            <DropdownSelector 
              label="Period"
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              options={[
                { id: 'day', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold mb-3">Uptime</h2>
          <div className="text-3xl font-bold text-green-600">{systemStats.uptime}</div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold mb-3">CPU Usage</h2>
          <div className="flex items-center">
            <div className="text-3xl font-bold">{systemStats.cpuUsage}%</div>
            <div className="ml-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${systemStats.cpuUsage > 80 ? 'bg-red-500' :
                  systemStats.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                style={{ width: `${systemStats.cpuUsage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold mb-3">Memory Usage</h2>
          <div className="flex items-center">
            <div className="text-3xl font-bold">{systemStats.memoryUsage}%</div>
            <div className="ml-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${systemStats.memoryUsage > 80 ? 'bg-red-500' :
                  systemStats.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                style={{ width: `${systemStats.memoryUsage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold mb-3">Active Users</h2>
          <div className="text-3xl font-bold text-blue-600">{systemStats.activeUsers}</div>
        </div>
      </div>

      {/* Request Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold mb-3">Total Requests</h2>
          <div className="text-3xl font-bold">{systemStats.totalRequests.toLocaleString()}</div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold mb-3">Error Rate</h2>
          <div className="flex items-center">
            <div className="text-3xl font-bold">{systemStats.errorRate}%</div>
            <div className="ml-4 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${systemStats.errorRate > 5 ? 'bg-red-500' :
                  systemStats.errorRate > 2 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                style={{ width: `${Math.min(100, systemStats.errorRate * 10)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold mb-3">Avg Response Time</h2>
          <div className="text-3xl font-bold">{systemStats.responseTime}ms</div>
        </div>
      </div>

      {/* Audit Log Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
        {/* Top Actions */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold mb-3">Top Actions</h2>
          <div className="space-y-2">
            {auditStats.actionCounts.map((action, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{action.action}</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  {action.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Resource Types */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold mb-3">Top Resource Types</h2>
          <div className="space-y-2">
            {auditStats.resourceTypeCounts.map((resource, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{resource.resourceType}</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                  {resource.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Activity */}
      <div className="bg-white shadow rounded p-4 mb-6">
        <h2 className="text-lg font-bold mb-3">Daily Activity</h2>
        <div className="h-64 flex items-end space-x-2">
          {auditStats.dailyCounts.map((day, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div
                className="w-full bg-blue-500 rounded-t"
                style={{ height: `${(day.count / Math.max(...auditStats.dailyCounts.map(d => d.count))) * 100}%` }}
              ></div>
              <div className="text-xs text-foreground/50 mt-1">
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Users */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-bold mb-3">Top Active Users</h2>
        <div className="space-y-3">
          {auditStats.topUsers.map((user, index) => (
            <div key={index} className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-foreground flex items-center justify-center text-sm font-bold mr-3">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium">{user.user.fullName}</div>
                <div className="text-sm text-foreground/50">{user.user.email}</div>
              </div>
              <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                {user.count} actions
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
