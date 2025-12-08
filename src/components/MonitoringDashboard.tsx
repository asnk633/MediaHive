// src/components/MonitoringDashboard.tsx
// Monitoring Dashboard component for admin

'use client';

import React, { useState, useEffect } from 'react';
import { SSEStatusBadge } from './SSEStatusBadge';

interface MonitoringData {
  onlineUsers: number;
  activeEditors: number;
  activeLocks: number;
  notificationFlow: any[];
  sseMetrics: any;
}

export function MonitoringDashboard() {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sseConnected, setSseConnected] = useState(false);

  useEffect(() => {
    // Connect to monitoring SSE endpoint
    const eventSource = new EventSource('/api/monitoring/events');
    
    eventSource.onopen = () => {
      setSseConnected(true);
    };
    
    eventSource.onerror = () => {
      setSseConnected(false);
    };
    
    eventSource.addEventListener('monitoring-update', (event) => {
      const data = JSON.parse(event.data);
      setMonitoringData(data);
    });
    
    // Cleanup
    return () => {
      eventSource.close();
    };
  }, []);
  
  if (loading) {
    return (
      <div className="monitoring-dashboard">
        <h2>Admin Monitoring Dashboard</h2>
        <div>Loading monitoring data...</div>
      </div>
    );
  }

  return (
    <div className="monitoring-dashboard" data-testid="monitoring-dashboard">
      <h2>Admin Monitoring Dashboard</h2>
      
      <div className="monitoring-header">
        <SSEStatusBadge connected={sseConnected} />
      </div>
      
      <div className="monitoring-grid">
        <div className="monitoring-card">
          <h3>Online Users</h3>
          <p className="metric-value">{monitoringData?.onlineUsers || 0}</p>
        </div>
        
        <div className="monitoring-card">
          <h3>Active Editors</h3>
          <p className="metric-value">{monitoringData?.activeEditors || 0}</p>
        </div>
        
        <div className="monitoring-card">
          <h3>Active Locks</h3>
          <p className="metric-value">{monitoringData?.activeLocks || 0}</p>
        </div>
      </div>
      
      <div className="monitoring-section">
        <h3>Notification Flow</h3>
        <div className="notification-flow-chart">
          {/* Chart visualization would go here */}
          <p>Notification flow visualization</p>
        </div>
      </div>
      
      <div className="monitoring-section">
        <h3>SSE Channel Metrics</h3>
        <div className="sse-metrics">
          <p>Connections: {monitoringData?.sseMetrics?.connections || 0}</p>
          <p>Messages Sent: {monitoringData?.sseMetrics?.messagesSent || 0}</p>
          <p>Errors: {monitoringData?.sseMetrics?.errors || 0}</p>
        </div>
      </div>
    </div>
  );
}