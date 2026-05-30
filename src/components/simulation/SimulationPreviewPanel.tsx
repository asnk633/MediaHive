/**
 * Phase 12: Simulation Preview Panel
 * 
 * UI component that provides clear visual separation between live and simulation states.
 * Includes explicit indicators and controls as required by UX contract.
 */
'use client';

import React from 'react';
import { X, Eye, AlertCircle } from 'lucide-react';
import { SimulationResult } from '@/lib/simulation/simulationEngine';

interface SimulationPreviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  simulationResults: SimulationResult[];
  activeChoice: string | null;
  isComparisonMode: boolean;
  onBackToCurrentState: () => void;
}

export function SimulationPreviewPanel({
  isOpen,
  onClose,
  simulationResults,
  activeChoice,
  isComparisonMode,
  onBackToCurrentState
}: SimulationPreviewPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed right-4 top-4 bottom-4 z-50 flex flex-col w-96 max-w-full">
      <div 
        className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg flex flex-col h-full"
        role="complementary"
        aria-label="Simulation preview panel"
      >
        {/* Header with persistent preview indicator */}
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-400" />
            <h2 className="font-medium text-foreground text-sm">
              Simulation Preview
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Persistent "Preview only" indicator */}
            <div className="bg-blue-900/20 border border-blue-800/30 rounded-full px-2 py-1">
              <span className="text-xs font-medium text-blue-300">
                PREVIEW ONLY
              </span>
            </div>
            
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              aria-label="Close preview"
            >
              <X className="h-4 w-4 text-foreground/60" />
            </button>
          </div>
        </div>
        
        {/* Persistent visual indicator */}
        <div className="px-4 py-2 bg-gray-800/30 border-b border-gray-700">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-3 w-3 text-foreground/60 mt-0.5 flex-shrink-0" />
            <p className="text-foreground text-xs">
              <strong>Preview only.</strong> Nothing will be saved or applied.
            </p>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {isComparisonMode ? (
            <ComparisonView results={simulationResults} activeChoice={activeChoice} />
          ) : (
            <SingleScenarioView results={simulationResults} activeChoice={activeChoice} />
          )}
        </div>

        {/* Footer with required controls */}
        <div className="bg-gray-800 border-t border-gray-700 px-4 py-3">
          <div className="flex flex-col gap-2">
            <div className="text-xs text-foreground/50 truncate">
              ID: {simulationResults[0]?.metadata.simulationId?.slice(0, 12) || 'N/A'}
            </div>
            
            <div className="flex gap-2">
              {/* Required controls */}
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-foreground text-xs rounded transition-colors flex items-center justify-center gap-1"
              >
                <X className="h-3 w-3" />
                Close
              </button>
              
              <button
                onClick={onBackToCurrentState}
                className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-foreground text-xs rounded transition-colors"
              >
                Back to Live
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Single scenario view - no highlighting, no default selection
function SingleScenarioView({ 
  results, 
  activeChoice 
}: { 
  results: SimulationResult[]; 
  activeChoice: string | null; 
}) {
  const result = results[0];
  if (!result) return null;

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-foreground mb-3">
          Selected Scenario: {result.choice.description}
        </h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Outcome</h4>
            <div className="bg-gray-900/50 border border-gray-700 rounded p-3">
              <p className="text-foreground text-sm">
                {result.outcome.conflictResolved 
                  ? 'Conflict would be resolved' 
                  : 'Conflict would remain pending'}
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Implications</h4>
            <ul className="space-y-2">
              {result.outcome.implications.map((implication, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-2 text-foreground text-sm"
                >
                  <span className="text-foreground/50 mt-1">•</span>
                  <span>{implication}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Next Steps</h4>
            <ul className="space-y-2">
              {result.outcome.nextSteps.map((step, index) => (
                <li 
                  key={index}
                  className="flex items-start gap-2 text-foreground text-sm"
                >
                  <span className="text-foreground/50 mt-1">→</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Comparison view - equal treatment of all scenarios
function ComparisonView({ 
  results, 
  activeChoice 
}: { 
  results: SimulationResult[]; 
  activeChoice: string | null; 
}) {
  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h3 className="text-lg font-medium text-foreground">
          Compare Resolution Scenarios
        </h3>
        <p className="text-foreground/60 text-sm mt-1">
          All scenarios are presented equally without preference or ranking
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {results.map((result, index) => (
          <ScenarioCard 
            key={result.metadata.simulationId}
            result={result}
            isActive={activeChoice === result.choice.type}
            position={index + 1}
          />
        ))}
      </div>
    </div>
  );
}

// Individual scenario card - no visual highlighting or default selection
function ScenarioCard({ 
  result, 
  isActive,
  position 
}: { 
  result: SimulationResult; 
  isActive: boolean;
  position: number;
}) {
  // No visual highlighting - all cards look identical
  // No default selection - no special styling for any card
  // Neutral presentation - no directional framing
  
  return (
    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-foreground">
          Option {position}: {result.choice.description}
        </h4>
        {isActive && (
          <span className="text-xs text-foreground/60 bg-gray-700 px-2 py-1 rounded">
            Selected
          </span>
        )}
      </div>
      
      <div className="space-y-3">
        <div>
          <h5 className="text-sm font-medium text-foreground mb-1">Key Implications</h5>
          <ul className="space-y-1">
            {result.outcome.implications.slice(0, 3).map((implication, index) => (
              <li key={index} className="text-foreground/60 text-sm flex items-start gap-1">
                <span className="text-foreground/50">•</span>
                <span>{implication}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h5 className="text-sm font-medium text-foreground mb-1">Outcome</h5>
          <p className="text-foreground/60 text-sm">
            {result.outcome.conflictResolved 
              ? 'Resolves conflict' 
              : 'Maintains current state'}
          </p>
        </div>
      </div>
    </div>
  );
}
