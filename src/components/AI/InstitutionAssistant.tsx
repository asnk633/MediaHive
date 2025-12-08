// src/components/AI/InstitutionAssistant.tsx
// AI Institution Assistant Component

'use client';

import React, { useState, useEffect, useRef } from 'react';

interface AISuggestion {
  id?: string;
  type: 'task' | 'event' | 'team' | 'summary' | 'recommendation';
  title: string;
  description: string;
  priority?: string;
  suggestedAssignee?: string;
  availability?: string;
  startTime?: string;
  endTime?: string;
  confidence?: number;
}

export function InstitutionAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [mode, setMode] = useState<'suggestions' | 'chat'>('suggestions');
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus the input when the panel opens
  useEffect(() => {
    if (isOpen && panelRef.current) {
      const input = panelRef.current.querySelector('input');
      if (input) {
        input.focus();
      }
    }
  }, [isOpen]);

  // Generate suggestions based on user query using AI service
  const generateSuggestions = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    
    try {
      // Add user query to conversation
      const newConversation = [...conversation, { role: 'user' as const, content: query }];
      setConversation(newConversation);
      
      // Call AI service to generate suggestions
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Add IDs to suggestions for React keys
        const suggestionsWithIds = data.suggestions.map((suggestion: any, index: number) => ({
          ...suggestion,
          id: `${suggestion.type}-${index}`
        }));
        setSuggestions(suggestionsWithIds);
      } else {
        // Fallback to mock suggestions if AI service fails
        throw new Error('AI service unavailable');
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      // Fallback to mock suggestions
      const mockSuggestions: AISuggestion[] = [
        {
          id: 'task-1',
          type: 'task',
          title: `Create task: ${query}`,
          description: `Auto-generated task based on your request: ${query}`,
          priority: 'medium',
          suggestedAssignee: 'Team Lead',
          confidence: 0.85
        },
        {
          id: 'event-1',
          type: 'event',
          title: `Schedule event: ${query}`,
          description: `Event suggestion based on your request: ${query}`,
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
          confidence: 0.92
        }
      ];
      setSuggestions(mockSuggestions);
    } finally {
      setLoading(false);
    }
  };

  // Handle chat mode with AI service
  const handleChat = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    
    try {
      // Add user query to conversation
      const newConversation = [...conversation, { role: 'user' as const, content: query }];
      setConversation(newConversation);
      
      // In a real implementation, this would call an AI chat service
      // For now, we'll return a mock response
      const mockResponse = `I understand you're asking about "${query}". Based on the institutional data, I can help you with task creation, event scheduling, team allocation, and activity summaries. What specific action would you like to take?`;
      
      // Add AI response to conversation
      const updatedConversation = [...newConversation, { role: 'assistant' as const, content: mockResponse }];
      setConversation(updatedConversation);
      
      setQuery('');
    } catch (error) {
      console.error('Failed to generate chat response:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply a suggestion
  const applySuggestion = (suggestion: AISuggestion) => {
    // In a real implementation, this would apply the suggestion
    alert(`Applied suggestion: ${suggestion.title}`);
    
    // Add to conversation
    const newConversation = [...conversation, { role: 'user' as const, content: `Apply suggestion: ${suggestion.title}` }];
    setConversation(newConversation);
    
    setQuery('');
    setSuggestions([]);
  };

  // Clear conversation
  const clearConversation = () => {
    setConversation([]);
    setQuery('');
    setSuggestions([]);
  };

  return (
    <div className="institution-assistant">
      <button 
        className="assistant-toggle"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="institution-assistant-toggle"
      >
        <span className="ai-icon">🤖</span>
        AI Assistant
      </button>

      {isOpen && (
        <div 
          ref={panelRef}
          className="assistant-panel" 
          data-testid="institution-assistant-panel"
        >
          <div className="assistant-header">
            <h3>Institution AI Assistant</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setMode('suggestions')}
                className={`px-2 py-1 text-xs rounded ${mode === 'suggestions' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Suggestions
              </button>
              <button
                onClick={() => setMode('chat')}
                className={`px-2 py-1 text-xs rounded ${mode === 'chat' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Chat
              </button>
              <button 
                className="close-button ml-2"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="assistant-content">
            {mode === 'suggestions' ? (
              <>
                <div className="query-input flex">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && generateSuggestions()}
                    placeholder="Describe what you need help with..."
                    className="flex-1 p-2 border rounded"
                  />
                  <button
                    onClick={generateSuggestions}
                    disabled={loading || !query.trim()}
                    className="ml-2 bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : 'Get Suggestions'}
                  </button>
                </div>
                
                {conversation.length > 0 && (
                  <button
                    onClick={clearConversation}
                    className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear conversation
                  </button>
                )}
                
                {suggestions.length > 0 && (
                  <div className="suggestions-list mt-4">
                    <h4>Suggestions:</h4>
                    {suggestions.map((suggestion) => (
                      <div key={suggestion.id} className="suggestion-item p-3 border rounded mb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h5 className="font-bold">{suggestion.title}</h5>
                              {suggestion.confidence && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {Math.round(suggestion.confidence * 100)}% confidence
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{suggestion.description}</p>
                            {suggestion.availability && (
                              <p className="text-xs text-blue-600">{suggestion.availability}</p>
                            )}
                            {suggestion.priority && (
                              <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                Priority: {suggestion.priority}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => applySuggestion(suggestion)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm ml-2"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {suggestions.length === 0 && !loading && query && (
                  <div className="no-suggestions mt-4 text-gray-500">
                    No suggestions found. Try rephrasing your request.
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="chat-container h-64 overflow-y-auto mb-4 p-2 border rounded">
                  {conversation.map((message, index) => (
                    <div 
                      key={`${message.role}-${index}`} 
                      className={`mb-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
                    >
                      <div 
                        className={`inline-block p-2 rounded max-w-xs ${
                          message.role === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="text-left">
                      <div className="inline-block p-2 rounded bg-gray-200 text-gray-800">
                        <span className="loading-dots">Thinking</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="query-input flex">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                    placeholder="Ask me anything about tasks, events, or team allocation..."
                    className="flex-1 p-2 border rounded"
                  />
                  <button
                    onClick={handleChat}
                    disabled={loading || !query.trim()}
                    className="ml-2 bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    {loading ? 'Thinking...' : 'Send'}
                  </button>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  AI Assistant can help with: Task creation, Event scheduling, Team allocation, Activity summaries
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}