import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { isFeatureEnabled } from '@/app/featureFlags';

interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  elementId: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

interface FirstRunWalkthroughProps {
  onComplete?: () => void;
}

export function FirstRunWalkthrough({ onComplete }: FirstRunWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [visited, setVisited] = useState(false);

  // Check if user has already seen the walkthrough
  useEffect(() => {
    if (!isFeatureEnabled('onboardingLayer')) {
      return;
    }

    const hasSeenWalkthrough = localStorage.getItem('hasSeenWalkthrough');
    if (!hasSeenWalkthrough) {
      setShowWalkthrough(true);
      // Set a small timeout to ensure the DOM elements are rendered
      setTimeout(() => setCurrentStep(0), 500);
    } else {
      setVisited(true);
    }
  }, []);

  const walkthroughSteps: WalkthroughStep[] = [
    {
      id: 'media-gallery',
      title: 'Media Gallery',
      description: 'Upload, review, and collaborate on media files. Use the proofing tools to approve or request changes.',
      elementId: 'media-gallery-section',
      position: 'bottom'
    },
    {
      id: 'admin-confidence',
      title: 'Admin Confidence Panel',
      description: 'Monitor workflow bottlenecks and task status. This panel shows blocked tasks, ready tasks, and stale items.',
      elementId: 'admin-confidence-panel',
      position: 'top'
    },
    {
      id: 'proofing-flow',
      title: 'Proofing Flow',
      description: 'Review media files, approve them, or request changes. Track versions and comments for each file.',
      elementId: 'proofing-section',
      position: 'right'
    }
  ];

  const handleNext = () => {
    if (currentStep !== null && currentStep < walkthroughSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep !== null && currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('hasSeenWalkthrough', 'true');
    setShowWalkthrough(false);
    setCurrentStep(null);
    setVisited(true);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenWalkthrough', 'true');
    setShowWalkthrough(false);
    setCurrentStep(null);
    setVisited(true);
  };

  // Only show if feature is enabled and user hasn't seen it yet
  if (!isFeatureEnabled('onboardingLayer') || !showWalkthrough || currentStep === null || visited) {
    return null;
  }

  const currentStepData = walkthroughSteps[currentStep];
  const totalSteps = walkthroughSteps.length;

  // Scroll to relevant section if needed
  useEffect(() => {
    if (currentStepData) {
      const element = document.getElementById(currentStepData.elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentStepData]);

  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-foreground/90 dark:bg-gray-800/90 text-foreground/20 dark:text-foreground p-6 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-lg">{currentStepData.title}</h3>
          <span className="text-sm text-foreground/50 dark:text-foreground/60">
            {currentStep + 1} of {totalSteps}
          </span>
        </div>
        <p className="text-foreground/30 dark:text-foreground mb-4">
          {currentStepData.description}
        </p>
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSkip}
            className="border-gray-300 dark:border-gray-600"
          >
            Skip
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handlePrev}
                className="border-gray-300 dark:border-gray-600"
              >
                Back
              </Button>
            )}
            <Button 
              size="sm"
              onClick={handleNext}
            >
              {currentStep === totalSteps - 1 ? 'Complete' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
