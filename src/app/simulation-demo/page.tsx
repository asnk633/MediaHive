/**
 * Phase 12: Simulation Demo Page
 * 
 * Test page to demonstrate and verify all Phase 12 UX requirements.
 */

import React from 'react';
import { StateSeparationDemo } from '@/components/simulation/StateSeparationDemo';

export default function SimulationDemoPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground">Phase 12: Simulation Engine Demo</h1>
          <p className="text-gray-400 mt-1">
            Verifying UX contract requirements for pure simulation capabilities
          </p>
        </div>
      </header>
      
      <main className="py-8">
        <StateSeparationDemo taskId="demo-task-123" />
      </main>
    </div>
  );
}
