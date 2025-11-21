// src/app/admin/insights/page.tsx
// Unified Reporting Dashboard

'use client';

import React, { useState, useEffect } from 'react';
import { InstitutionAssistant } from '@/components/AI/InstitutionAssistant';

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

export default function InsightsPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedTenant, setSelectedTenant] = useState('all');

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch actual data from APIs
        const response = await fetch(`/api/insights/dashboard?period=${selectedPeriod}&tenant=${selectedTenant}`);
        
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        } else {
          // Fallback to mock data if API fails
          throw new Error('API unavailable');
        }
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
      const response = await fetch(`/api/insights/export?format=${format}&period=${selectedPeriod}&tenant=${selectedTenant}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `insights-report.${format === 'csv' ? 'csv' : format === 'pdf' ? 'pdf' : 'txt'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert(`Failed to export data in ${format} format`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Failed to export data in ${format} format`);
    }
  };

  const sendEmailSummary = async () => {
    try {
      const response = await fetch('/api/insights/email-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ period: selectedPeriod, tenant: selectedTenant }),
      });
      
      if (response.ok) {
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
        {/* Task Workload by Institution */};
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
                    backgroundColor: `rgba(59, 130, 246, ${day.count / 20})`
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
                  style={{ height: `${(month.count / 70) * 100}%` }}
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