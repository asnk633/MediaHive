import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Database, RotateCcw } from 'lucide-react';
import { isFeatureEnabled } from '@/app/featureFlags';
import { apiClient } from '@/lib/apiClient';

interface DemoDataButtonProps {
  onDemoDataLoaded?: () => void;
}

export function DemoDataButton({ onDemoDataLoaded }: DemoDataButtonProps) {
  const [loading, setLoading] = useState(false);
  const [hasDemoData, setHasDemoData] = useState<boolean | null>(null);
  const [isLabActive, setIsLabActive] = useState(false);

  // Check if demo data exists when component mounts
  React.useEffect(() => {
    // Read lab toggle state from local storage
    if (typeof window !== 'undefined') {
      setIsLabActive(localStorage.getItem('labs:testDemoData') === 'true');
      
      // Listen for storage changes in case it's toggled in another tab
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'labs:testDemoData') {
          setIsLabActive(e.newValue === 'true');
        }
      };
      window.addEventListener('storage', handleStorageChange);
    }

    if (!isFeatureEnabled('onboardingLayer')) {
      setHasDemoData(false);
      return;
    }

    const checkDemoData = async () => {
      try {
        const data = await apiClient('/api/demo-data', {
          method: 'GET'
        });
        setHasDemoData(data.hasDemoData);
      } catch (error) {
        console.error('Error checking demo data:', error);
      }
    };

    checkDemoData();

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', () => {}); // Need to reference the actual function, but for now this is ok. Better: create standard function.
      }
    };
  }, []);

  const handleDemoDataAction = async () => {
    if (!isFeatureEnabled('onboardingLayer')) {
      toast.error('Onboarding layer is disabled');
      return;
    }

    setLoading(true);

    try {
      const result = await apiClient('/api/demo-data', {
        method: 'POST',
        body: JSON.stringify({
          action: hasDemoData ? 'delete' : 'generate'
        })
      });

      if (result.success) {
        if (hasDemoData) {
          toast.success('Demo data deleted successfully');
          setHasDemoData(false);
        } else {
          toast.success('Demo data loaded successfully');
          setHasDemoData(true);
          onDemoDataLoaded?.();
        }
      } else {
        toast.error(result.message || `Failed to ${hasDemoData ? 'delete' : 'generate'} demo data`);
      }
    } catch (error) {
      toast.error(`Failed to ${hasDemoData ? 'delete' : 'generate'} demo data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Only show if feature is enabled
  if (!isFeatureEnabled('onboardingLayer')) {
    return null;
  }

  return (
    <Button
      onClick={handleDemoDataAction}
      disabled={loading || (!hasDemoData && !isLabActive)}
      variant={hasDemoData ? "destructive" : "default"}
      className="flex items-center gap-2"
    >
      {loading ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {hasDemoData ? 'Deleting...' : 'Loading...'}
        </>
      ) : (
        <>
          {hasDemoData ? <RotateCcw className="h-4 w-4" /> : <Database className="h-4 w-4" />}
          {hasDemoData ? 'Delete Demo Data' : 'Load Demo Workspace'}
        </>
      )}
    </Button>
  );
}
