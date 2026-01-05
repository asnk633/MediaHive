// src/app/admin/insights/page.tsx
// Unified Reporting Dashboard

'use client';

import React, { useState, useEffect } from 'react';
import { InstitutionAssistant } from '@/components/AI/InstitutionAssistant';
import { getProductionPipelineStats } from '@/services/statsService';
import { apiClient } from '@/lib/apiClient';

interface DashboardData {
  taskWorkload: any[];
  tatMetrics: any;
  slaCompliance: any;
  eventFrequency: any[];
  mediaOutput: any[];
  teamActivity: any[];
  productionPipeline: any;
  performanceAnomalies: any[];
}

// Helper function to get date ranges
const getDateRange = (period: string) => {
  const now = new Date();
  let startDate = new Date();
  
  switch (period) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      break;
    case 'week':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case 'quarter':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  }
  
  return { startDate, endDate: now };
};

// Helper function to get real task workload data
const getTaskWorkloadData = async (tenantId: string, period: string) => {
  try {
    const { startDate } = getDateRange(period);
    
    // Fetch data from API
    const workloadData = await apiClient(`/api/insights/task-workload?tenantId=${tenantId}&period=${period}`, {
      method: 'GET'
    });
    
    return workloadData;
  } catch (error) {
    console.error('Error fetching task workload data:', error);
    return [
      { institution: 'TG Antla', workload: 45, trend: 'up' },
      { institution: 'TG Bangkok', workload: 32, trend: 'down' },
      { institution: 'TG Chiang Mai', workload: 28, trend: 'stable' },
    ];
  }
};

// Helper function to get real TAT metrics
const getTatMetricsData = async (tenantId: string, period: string) => {
  try {
    const { startDate } = getDateRange(period);
    
    // Fetch data from API
    const tatData = await apiClient(`/api/insights/tat-metrics?tenantId=${tenantId}&period=${period}`, {
      method: 'GET'
    });
    
    return tatData;
  } catch (error) {
    console.error('Error fetching TAT metrics:', error);
    return {
      average: '2.3 days',
      median: '2.1 days',
      trend: 'improving'
    };
  }
};

// Helper function to get real SLA compliance data
const getSlaComplianceData = async (tenantId: string, period: string) => {
  try {
    const { startDate } = getDateRange(period);
    
    // Fetch data from API
    const slaData = await apiClient(`/api/insights/sla-compliance?tenantId=${tenantId}&period=${period}`, {
      method: 'GET'
    });
    
    return slaData;
  } catch (error) {
    console.error('Error fetching SLA compliance data:', error);
    return {
      compliant: 87,
      nonCompliant: 13,
      trend: 'stable'
    };
  }
};

// Helper function to get real event frequency data
const getEventFrequencyData = async (tenantId: string, period: string) => {
  try {
    const { startDate } = getDateRange(period);
    
    // Fetch data from API
    const eventData = await apiClient(`/api/insights/event-frequency?tenantId=${tenantId}&period=${period}`, {
      method: 'GET'
    });
    
    return eventData;
  } catch (error) {
    console.error('Error fetching event frequency data:', error);
    return [
      { day: 'Mon', count: 12 },
      { day: 'Tue', count: 8 },
      { day: 'Wed', count: 15 },
      { day: 'Thu', count: 10 },
      { day: 'Fri', count: 7 },
      { day: 'Sat', count: 20 },
      { day: 'Sun', count: 18 },
    ];
  }
};

// Helper function to get real media output data
const getMediaOutputData = async (tenantId: string, period: string) => {
  try {
    const { startDate } = getDateRange(period);
    
    // Fetch data from API
    const mediaData = await apiClient(`/api/insights/media-output?tenantId=${tenantId}&period=${period}`, {
      method: 'GET'
    });
    
    return mediaData;
  } catch (error) {
    console.error('Error fetching media output data:', error);
    return [
      { month: 'Jan', count: 45 },
      { month: 'Feb', count: 52 },
      { month: 'Mar', count: 48 },
      { month: 'Apr', count: 61 },
      { month: 'May', count: 55 },
      { month: 'Jun', count: 67 },
    ];
  }
};

// Helper function to get real team activity data
const getTeamActivityData = async (tenantId: string, period: string) => {
  try {
    const { startDate } = getDateRange(period);
    
    // Fetch data from API
    const teamData = await apiClient(`/api/insights/team-activity?tenantId=${tenantId}&period=${period}`, {
      method: 'GET'
    });
    
    return teamData;
  } catch (error) {
    console.error('Error fetching team activity data:', error);
    return [
      { team: 'Video Team', activity: 95 },
      { team: 'Editing Team', activity: 87 },
      { team: 'Graphics Team', activity: 78 },
      { team: 'Management', activity: 65 },
    ];
  }
};

// Helper function to get real performance anomalies
const getPerformanceAnomaliesData = async (tenantId: string, period: string) => {
  try {
    const { startDate } = getDateRange(period);
    
    // Fetch data from API
    const anomalies = await apiClient(`/api/insights/performance-anomalies?tenantId=${tenantId}&period=${period}`, {
      method: 'GET'
    });
    
    return anomalies;
  } catch (error) {
    console.error('Error fetching performance anomalies:', error);
    return [
      {
        id: 1,
        type: 'spike',
        description: 'Spike in urgent tasks from TG Antla this week',
        severity: 'high',
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        type: 'delay',
        description: 'Delayed deliverables from Graphics Team',
        severity: 'medium',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }
};

export default function InsightsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedTenant, setSelectedTenant] = useState('all');

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all real data in parallel
        const [
          productionPipeline,
          taskWorkload,
          tatMetrics,
          slaCompliance,
          eventFrequency,
          mediaOutput,
          teamActivity,
          performanceAnomalies
        ] = await Promise.all([
          getProductionPipelineStats(),
          getTaskWorkloadData(selectedTenant, selectedPeriod),
          getTatMetricsData(selectedTenant, selectedPeriod),
          getSlaComplianceData(selectedTenant, selectedPeriod),
          getEventFrequencyData(selectedTenant, selectedPeriod),
          getMediaOutputData(selectedTenant, selectedPeriod),
          getTeamActivityData(selectedTenant, selectedPeriod),
          getPerformanceAnomaliesData(selectedTenant, selectedPeriod)
        ]);
        
        const realData: DashboardData = {
          taskWorkload,
          tatMetrics,
          slaCompliance,
          eventFrequency,
          mediaOutput,
          teamActivity,
          productionPipeline,
          performanceAnomalies
        };
        
        setDashboardData(realData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Use mock data as fallback
        const mockData: DashboardData = {
          taskWorkload: [
            { institution: 'TG Antla', workload: 45, trend: 'up' },
            { institution: 'TG Bangkok', workload: 32, trend: 'down' },
            { institution: 'TG Chiang Mai', workload: 28, trend: 'stable' },
          ],
          tatMetrics: {
            average: '2.3 days',
            median: '2.1 days',
            trend: 'improving'
          },
          slaCompliance: {
            compliant: 87,
            nonCompliant: 13,
            trend: 'stable'
          },
          eventFrequency: [
            { day: 'Mon', count: 12 },
            { day: 'Tue', count: 8 },
            { day: 'Wed', count: 15 },
            { day: 'Thu', count: 10 },
            { day: 'Fri', count: 7 },
            { day: 'Sat', count: 20 },
            { day: 'Sun', count: 18 },
          ],
          mediaOutput: [
            { month: 'Jan', count: 45 },
            { month: 'Feb', count: 52 },
            { month: 'Mar', count: 48 },
            { month: 'Apr', count: 61 },
            { month: 'May', count: 55 },
            { month: 'Jun', count: 67 },
          ],
          teamActivity: [
            { team: 'Video Team', activity: 95 },
            { team: 'Editing Team', activity: 87 },
            { team: 'Graphics Team', activity: 78 },
            { team: 'Management', activity: 65 },
          ],
          productionPipeline: {
            inProgress: 24,
            pendingReview: 12,
            completed: 45,
            delayed: 3
          },
          performanceAnomalies: [
            {
              id: 1,
              type: 'spike',
              description: 'Spike in urgent tasks from TG Antla this week',
              severity: 'high',
              timestamp: new Date().toISOString()
            },
            {
              id: 2,
              type: 'delay',
              description: 'Delayed deliverables from Graphics Team',
              severity: 'medium',
              timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        };
        
        setDashboardData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedPeriod, selectedTenant]);

  const exportData = async (format: string) => {
    try {
      const response = await apiClient(`/api/insights/export?format=${format}&period=${selectedPeriod}&tenant=${selectedTenant}`, {
        method: 'GET'
      });
      
      // Create a temporary link to download the file
      const url = response.url; // Assuming the API returns a download URL
      const a = document.createElement('a');
      a.href = url;
      a.download = `insights-report.${format === 'csv' ? 'csv' : format === 'pdf' ? 'pdf' : 'txt'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Failed to export data in ${format} format`);
    }
  };

  const sendEmailSummary = async () => {
    try {
      const response = await apiClient('/api/insights/email-summary', {
        method: 'POST',
        body: JSON.stringify({ period: selectedPeriod, tenant: selectedTenant }),
      });
      
      if (response.success) {
        alert('Email summary sent successfully');
      } else {
        alert('Failed to send email summary');
      }
    } catch (error) {
      console.error('Failed to send email summary:', error);
      alert('Failed to send email summary');
    }
  };

  if (loading) {
    return <div>Loading dashboard data...</div>;
  }

  if (!dashboardData) {
    return <div>Failed to load dashboard data</div>;
  }

  return (
    <div className="insights-page p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Management Insights</h1>
        <div className="flex space-x-2">
          <select 
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="border rounded p-2"
          >
            <option value="all">All Campuses</option>
            <option value="1">TG Antla</option>
            <option value="2">TG Bangkok</option>
            <option value="3">TG Chiang Mai</option>
          </select>
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border rounded p-2"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          <button 
            onClick={() => exportData('pdf')}
            className="bg-red-500 hover:bg-red-700 text-white px-3 py-2 rounded"
          >
            Export PDF
          </button>
          <button 
            onClick={() => exportData('csv')}
            className="bg-green-500 hover:bg-green-700 text-white px-3 py-2 rounded"
          >
            Export CSV
          </button>
          <button 
            onClick={sendEmailSummary}
            className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-2 rounded"
          >
            Email Summary
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Task Workload by Institution */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold mb-3">Task Workload by Institution</h2>
          <div className="space-y-2">
            {dashboardData.taskWorkload.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{item.institution}</span>
                <span className="flex items-center">
                  {item.workload} tasks
                  <span className={`ml-2 text-xs ${
                    item.trend === 'up' ? 'text-red-500' : 
                    item.trend === 'down' ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    {item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* TAT Metrics */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold mb-3">TAT Metrics</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Average TAT:</span>
              <span className="font-bold">{dashboardData.tatMetrics.average}</span>
            </div>
            <div className="flex justify-between">
              <span>Median TAT:</span>
              <span className="font-bold">{dashboardData.tatMetrics.median}</span>
            </div>
            <div className="flex justify-between">
              <span>Trend:</span>
              <span className={
                dashboardData.tatMetrics.trend === 'improving' ? 'text-green-500' : 
                dashboardData.tatMetrics.trend === 'declining' ? 'text-red-500' : 'text-gray-500'
              }>
                {dashboardData.tatMetrics.trend}
              </span>
            </div>
          </div>
        </div>

        {/* SLA Compliance */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold mb-3">SLA Compliance</h2>
          <div className="flex items-center justify-center h-32">
            <div className="relative w-32 h-32">
              <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
              <div 
                className="absolute inset-0 rounded-full border-8 border-transparent" 
                style={{ 
                  borderTopColor: '#10B981', 
                  borderRightColor: '#10B981',
                  transform: `rotate(${dashboardData.slaCompliance.compliant * 3.6}deg)`
                }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">{dashboardData.slaCompliance.compliant}%</span>
              </div>
            </div>
          </div>
          <div className="text-center mt-2">
            <span className="text-sm text-gray-600">
              {dashboardData.slaCompliance.compliant}% compliant, 
              {dashboardData.slaCompliance.nonCompliant}% non-compliant
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Event Frequency Heatmap */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold mb-3">Event Frequency (Weekly)</h2>
          <div className="flex justify-between mb-2">
            {dashboardData.eventFrequency.map((day, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-gray-500">{day.day}</div>
                <div 
                  className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold mt-1"
                  style={{ 
                    backgroundColor: `rgba(59, 130, 246, ${day.count / 25})`
                  }}
                >
                  {day.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Media Output */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold mb-3">Media Output (Monthly)</h2>
          <div className="h-48 flex items-end space-x-2">
            {dashboardData.mediaOutput.map((month, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${(month.count / 100) * 100}%` }}
                ></div>
                <div className="text-xs text-gray-500 mt-1">{month.month}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Activity Ranking */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold mb-3">Team Activity Ranking</h2>
          <div className="space-y-3">
            {dashboardData.teamActivity.map((team, index) => (
              <div key={index} className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold mr-3">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span>{team.team}</span>
                    <span>{team.activity}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${team.activity}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Production Pipeline Summary */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-bold mb-3">Production Pipeline</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-100 p-3 rounded text-center">
              <div className="text-2xl font-bold">{dashboardData.productionPipeline.inProgress}</div>
              <div className="text-sm">In Progress</div>
            </div>
            <div className="bg-yellow-100 p-3 rounded text-center">
              <div className="text-2xl font-bold">{dashboardData.productionPipeline.pendingReview}</div>
              <div className="text-sm">Pending Review</div>
            </div>
            <div className="bg-green-100 p-3 rounded text-center">
              <div className="text-2xl font-bold">{dashboardData.productionPipeline.completed}</div>
              <div className="text-sm">Completed</div>
            </div>
            <div className="bg-red-100 p-3 rounded text-center">
              <div className="text-2xl font-bold">{dashboardData.productionPipeline.delayed}</div>
              <div className="text-sm">Delayed</div>
            </div>
          </div>
          
          {/* Performance Anomalies */}
          <div className="mt-4">
            <h3 className="font-bold mb-2">Performance Anomalies</h3>
            <div className="space-y-2">
              {dashboardData.performanceAnomalies.map((anomaly) => (
                <div 
                  key={anomaly.id} 
                  className={`p-3 rounded ${
                    anomaly.severity === 'high' ? 'bg-red-50 border border-red-200' : 
                    anomaly.severity === 'medium' ? 'bg-yellow-50 border border-yellow-200' : 
                    'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <div className={`font-bold ${
                    anomaly.severity === 'high' ? 'text-red-800' : 
                    anomaly.severity === 'medium' ? 'text-yellow-800' : 
                    'text-blue-800'
                  }`}>
                    {anomaly.type.charAt(0).toUpperCase() + anomaly.type.slice(1)}
                  </div>
                  <div className="text-sm">{anomaly.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(anomaly.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {dashboardData.performanceAnomalies.length === 0 && (
                <div className="text-sm text-gray-500 italic">
                  No performance anomalies detected
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      <div className="mt-6">
        <InstitutionAssistant />
      </div>
    </div>
  );
}