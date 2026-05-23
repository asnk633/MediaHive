/**
 * Phase 12: State Separation Demo
 * 
 * Demonstrates clear visual separation between live and simulation states
 * for verification purposes.
 */
'use client';

import React, { useState } from 'react';
import { Play, RefreshCw, Activity } from 'lucide-react';
import { SimulationPreviewPanel } from './SimulationPreviewPanel';
import { useSimulationPreview } from '@/hooks/useSimulationPreview';

interface StateSeparationDemoProps {
  taskId: string;
}

export function StateSeparationDemo({ taskId }: StateSeparationDemoProps) {
  const [showPreview, setShowPreview] = useState(false);
  
  // Mock live system state
  const liveState = {
    isOnline: true,
    isReplaying: false,
    isPaused: false,
    hasPatch: false,
    isBootComplete: true,
    taskStatus: 'in_progress',
    lastUpdated: new Date().toLocaleTimeString()
  };

  // Mock conflict context
  const conflictContext = {
    taskId,
    field: 'status',
    localValue: 'in_progress',
    serverValue: 'completed',
    userRole: 'team_member',
    remoteActor: 'project_manager',
    remoteActorRole: 'admin',
    timestamp: Date.now(),
    conflictCategory: 'content' as const
  };

  // Use simulation hook
  const simulation = useSimulationPreview({
    context: conflictContext,
    isOnline: liveState.isOnline,
    isReplaying: liveState.isReplaying,
    isPaused: liveState.isPaused,
    hasPatch: liveState.hasPatch,
    isBootComplete: liveState.isBootComplete
  });

  const handleSimulate = () => {
    if (simulation.canSimulate) {
      simulation.simulateComparison();
      setShowPreview(true);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    simulation.clearSimulation();
  };

  const handleBackToCurrentState = () => {
    setShowPreview(false);
    simulation.clearSimulation();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Live State Section - Clear visual separation */}
      <div className="bg-green-900/10 border border-green-800/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="h-6 w-6 text-green-400" />
          <h2 className="text-2xl font-bold text-foreground">Live System State</h2>
          <div className="bg-green-900/30 px-3 py-1 rounded-full">
            <span className="text-green-300 text-sm font-medium">ACTIVE</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-900/20 p-4 rounded-lg">
            <h3 className="text-green-300 font-medium mb-2">Connection Status</h3>
            <p className="text-foreground">{liveState.isOnline ? 'Online' : 'Offline'}</p>
          </div>
          
          <div className="bg-green-900/20 p-4 rounded-lg">
            <h3 className="text-green-300 font-medium mb-2">Task Status</h3>
            <p className="text-foreground capitalize">{liveState.taskStatus}</p>
          </div>
          
          <div className="bg-green-900/20 p-4 rounded-lg">
            <h3 className="text-green-300 font-medium mb-2">Last Updated</h3>
            <p className="text-foreground">{liveState.lastUpdated}</p>
          </div>
        </div>
        
        <div className="bg-green-900/30 border border-green-800/50 rounded-lg p-4">
          <p className="text-green-200 text-sm">
            <strong>Live State:</strong> This represents your actual working environment. 
            Changes made here affect real data and are synchronized with the system.
          </p>
        </div>
      </div>

      {/* Visual Separation Indicator */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-700"></div>
        </div>
        <div className="relative flex justify-center">
          <div className="bg-gray-900 px-4 text-gray-500 text-sm">
            SIMULATION BOUNDARY
          </div>
        </div>
      </div>

      {/* Simulation Controls Section */}
      <div className="bg-blue-900/10 border border-blue-800/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Play className="h-6 w-6 text-blue-400" />
          <h2 className="text-2xl font-bold text-foreground">Simulation Controls</h2>
        </div>
        
        <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSimulate}
              disabled={!simulation.canSimulate}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-foreground rounded-lg transition-colors flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Run Simulation
            </button>
            
            <div className="text-gray-300">
              <span className="font-medium">Status:</span> 
              {simulation.canSimulate ? (
                <span className="text-green-400 ml-2">Ready</span>
              ) : (
                <span className="text-yellow-400 ml-2">Not Available</span>
              )}
            </div>
          </div>
          
          {!simulation.canSimulate && (
            <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-800/30 rounded">
              <p className="text-yellow-200 text-sm">
                Simulation requires: Online connection, no active replay, system ready
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-blue-900/30 border border-blue-800/50 rounded-lg p-4">
          <p className="text-blue-200 text-sm">
            <strong>Simulation State:</strong> This is a safe exploration environment. 
            Nothing you do here will affect your actual work or data.
          </p>
        </div>
      </div>

      {/* Non-blocking Simulation Preview Panel */}
      <SimulationPreviewPanel
        isOpen={showPreview}
        onClose={handleClosePreview}
        simulationResults={simulation.simulationResults}
        activeChoice={simulation.activeChoice?.type || null}
        isComparisonMode={simulation.comparisonMode}
        onBackToCurrentState={handleBackToCurrentState}
      />

      {/* Verification Checklist */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-foreground mb-4">Phase 12 UX Verification</h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-foreground font-medium">Persistent Visual Indicator</p>
              <p className="text-gray-400 text-sm">"This is a preview. Nothing will be saved or applied." clearly displayed</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-foreground font-medium">Structural Visual Separation</p>
              <p className="text-gray-400 text-sm">Clear boundary between Live State and Simulation State sections</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-foreground font-medium">Required Controls Exist</p>
              <p className="text-gray-400 text-sm">"Close Preview" and "Back to Current State" buttons present</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-foreground font-medium">No Visual Highlighting</p>
              <p className="text-gray-400 text-sm">All simulation outcomes presented equally without preference</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-foreground font-medium">No Default Selection</p>
              <p className="text-gray-400 text-sm">No pre-selected options or directional framing</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-foreground font-medium">No Directional Framing</p>
              <p className="text-gray-400 text-sm">Neutral presentation without suggestive language</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
