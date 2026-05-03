/**
 * Phase 12: Read-Only Simulation Preview Hook
 * 
 * Provides simulation capabilities without any side effects or state mutations.
 * Strictly isolated from live systems and enforcement mechanisms.
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  simulateOutcome, 
  compareScenarios, 
  canSimulate,
  SimulationContext,
  HypotheticalChoice,
  SimulationResult,
  SimulationComparison
} from '@/lib/simulation/simulationEngine';

interface UseSimulationPreviewProps {
  context: SimulationContext;
  isOnline: boolean;
  isReplaying: boolean;
  isPaused: boolean;
  hasPatch: boolean;
  isBootComplete: boolean;
}

export function useSimulationPreview({
  context,
  isOnline,
  isReplaying,
  isPaused,
  hasPatch,
  isBootComplete
}: UseSimulationPreviewProps) {
  const [activeChoice, setActiveChoice] = useState<HypotheticalChoice | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);

  // Available choices for simulation
  const availableChoices: HypotheticalChoice[] = useMemo(() => [
    {
      type: 'keep_local',
      description: 'Keep your local changes'
    },
    {
      type: 'keep_server',
      description: 'Accept remote changes'
    },
    {
      type: 'request_exception',
      description: 'Request special exception'
    },
    {
      type: 'defer',
      description: 'Decide later'
    }
  ], []);

  // Check if simulation is allowed based on execution gates
  const isSimulationAllowed = useMemo(() => {
    return canSimulate(isOnline, isReplaying, isPaused, hasPatch, isBootComplete);
  }, [isOnline, isReplaying, isPaused, hasPatch, isBootComplete]);

  // Reset simulation when gates change
  useEffect(() => {
    if (!isSimulationAllowed) {
      // Self-destruct simulation when gates are not satisfied
      setActiveChoice(null);
      setSimulationResults([]);
      setComparisonMode(false);
    }
  }, [isSimulationAllowed]);

  // Run single scenario simulation
  const simulateSingle = (choice: HypotheticalChoice): SimulationResult | null => {
    if (!isSimulationAllowed) {
      return null;
    }
    
    try {
      const result = simulateOutcome(context, choice);
      setActiveChoice(choice);
      setSimulationResults([result]);
      setComparisonMode(false);
      return result;
    } catch (error) {
      console.warn('[SimulationPreview] Simulation failed:', error);
      return null;
    }
  };

  // Run comparison simulation
  const simulateComparison = (): SimulationComparison | null => {
    if (!isSimulationAllowed) {
      return null;
    }
    
    try {
      const comparison = compareScenarios(context, availableChoices);
      setSimulationResults(comparison.scenarios);
      setComparisonMode(true);
      setActiveChoice(null);
      return comparison;
    } catch (error) {
      console.warn('[SimulationPreview] Comparison failed:', error);
      return null;
    }
  };

  // Clear simulation results
  const clearSimulation = () => {
    setActiveChoice(null);
    setSimulationResults([]);
    setComparisonMode(false);
  };

  // Get specific scenario result
  const getScenarioResult = (choiceType: HypotheticalChoice['type']): SimulationResult | undefined => {
    return simulationResults.find(result => result.choice.type === choiceType);
  };

  // Check if a choice is currently active
  const isChoiceActive = (choiceType: HypotheticalChoice['type']): boolean => {
    return activeChoice?.type === choiceType;
  };

  return {
    // Simulation controls
    simulateSingle,
    simulateComparison,
    clearSimulation,
    
    // State
    activeChoice,
    comparisonMode,
    simulationResults,
    isSimulationAllowed,
    
    // Utilities
    availableChoices,
    getScenarioResult,
    isChoiceActive,
    
    // Metadata
    canSimulate: isSimulationAllowed
  };
}
