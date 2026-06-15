// src/components/AI/AssistantPanel.tsx
// AI Assistant Panel component

'use client';
import { API_BASE } from '@/lib/api-utils';

import React, { useState } from 'react';
import { apiClient } from '@/lib/apiClient';

interface Suggestion {
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedPriority: string;
  suggestedStatus: string;
}

interface NotificationSummary {
  count: number;
  categories: string[];
  keyPoints: string[];
  priority: string;
}

export function AssistantPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [taskSuggestions, setTaskSuggestions] = useState<Suggestion | null>(null);
  const [notificationSummary, setNotificationSummary] = useState<NotificationSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const generateTaskSuggestions = async (title: string, description: string) => {
    setLoading(true);
    try {
      const data = await apiClient(`${API_BASE}/ai/generate-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description }),
      });
      setTaskSuggestions(data.suggestions);
    } catch (error) {
      console.error('Failed to generate task suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const summarizeNotifications = async (notifications: any[]) => {
    setLoading(true);
    try {
      const data = await apiClient(`${API_BASE}/ai/summarize-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notifications }),
      });
      setNotificationSummary(data.summary);
    } catch (error) {
      console.error('Failed to summarize notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-assistant-panel">
      <button 
        className="ai-assistant-toggle"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="ai-assistant-toggle"
      >
        <span className="ai-icon">🤖</span>
        AI Assistant
      </button>

      {isOpen && (
        <div className="ai-assistant-dropdown" data-testid="ai-assistant-dropdown">
          <div className="ai-assistant-header">
            <h3>AI Assistant</h3>
            <button 
              className="close-button"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>
          
          <div className="ai-assistant-content">
            {loading ? (
              <div className="loading">Processing...</div>
            ) : (
              <>
                <div className="ai-feature">
                  <h4>Task Suggestions</h4>
                  <div className="suggestion-form">
                    <input 
                      type="text" 
                      placeholder="Task title" 
                      id="task-title"
                    />
                    <textarea 
                      placeholder="Task description" 
                      id="task-description"
                    />
                    <button 
                      onClick={() => {
                        const title = (document.getElementById('task-title') as HTMLInputElement).value;
                        const description = (document.getElementById('task-description') as HTMLTextAreaElement).value;
                        generateTaskSuggestions(title, description);
                      }}
                    >
                      Generate Suggestions
                    </button>
                  </div>
                  
                  {taskSuggestions && (
                    <div className="suggestions-result">
                      <h5>Suggestions:</h5>
                      <p><strong>Title:</strong> {taskSuggestions.suggestedTitle}</p>
                      <p><strong>Description:</strong> {taskSuggestions.suggestedDescription}</p>
                      <p><strong>Priority:</strong> {taskSuggestions.suggestedPriority}</p>
                      <p><strong>Status:</strong> {taskSuggestions.suggestedStatus}</p>
                    </div>
                  )}
                </div>
                
                <div className="ai-feature">
                  <h4>Notification Summary</h4>
                  <button 
                    onClick={() => {
                      // In a real implementation, we would fetch actual notifications
                      const mockNotifications = [
                        { id: 1, title: 'Task Assigned', body: 'You have been assigned to a new task' },
                        { id: 2, title: 'Review Request', body: 'A task requires your review' }
                      ];
                      summarizeNotifications(mockNotifications);
                    }}
                  >
                    Summarize Notifications
                  </button>
                  
                  {notificationSummary && (
                    <div className="summary-result">
                      <h5>Summary:</h5>
                      <p><strong>Count:</strong> {notificationSummary.count} notifications</p>
                      <p><strong>Categories:</strong> {notificationSummary.categories.join(', ')}</p>
                      <ul>
                        {notificationSummary.keyPoints.map((point, index) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                      <p><strong>Priority:</strong> {notificationSummary.priority}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
