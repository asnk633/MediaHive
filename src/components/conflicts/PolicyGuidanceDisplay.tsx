/**
 * Phase 10: Policy Guidance Display Component
 * 
 * Displays policy explanations without influencing user decisions
 * or causing any state mutations.
 */

import React from 'react';
import { Shield, AlertTriangle, Info, Lightbulb, Clock, Users, BarChart3 } from 'lucide-react';
import { PolicyExplanation } from '@/domain/conflicts/policyEvaluator';

interface PolicyGuidanceDisplayProps {
  explanations: PolicyExplanation[];
}

export const PolicyGuidanceDisplay: React.FC<PolicyGuidanceDisplayProps> = ({ explanations }) => {
  if (!explanations || explanations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-purple-400" />
        <h4 className="font-semibold text-foreground/80">Policy Context</h4>
      </div>
      
      <div className="space-y-2">
        {explanations.map((explanation) => {
          if (!explanation.applicable) return null;
          
          return (
            <div 
              key={explanation.id}
              className="p-3 rounded-lg border bg-gray-800/50 border-gray-700 text-sm"
            >
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 text-blue-400" />
                <div>
                  <h5 className="font-medium text-foreground">{explanation.title}</h5>
                  <p className="text-foreground/70 mt-1 leading-relaxed">
                    {explanation.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
