import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UseFormSubmitOptions<T> {
  onSubmit: (data: T) => Promise<void>;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}

export function useFormSubmit<T>({ onSubmit, onSuccess, onError }: UseFormSubmitOptions<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isActuallySubmitting = useRef(false);
  const lastSubmitTime = useRef<number>(0);

  const handleSubmit = useCallback(async (data: T) => {
    const now = Date.now();
    
    // 1. Debounce protection (2 seconds)
    if (now - lastSubmitTime.current < 2000) {
      console.warn("[useFormSubmit] Blocked: Clicked too fast.");
      return;
    }

    // 2. State protection (Sync check via Ref)
    if (isActuallySubmitting.current) {
        console.warn("[useFormSubmit] Blocked: Submission already in flight.");
        return;
    }

    lastSubmitTime.current = now;
    isActuallySubmitting.current = true;
    setIsSubmitting(true);

    try {
      await onSubmit(data);
      onSuccess?.();
    } catch (err: any) {
      console.error("[useFormSubmit] Execution failed:", err);
      if (onError) {
        onError(err);
      } else {
        toast.error(err.message || "An error occurred during submission");
      }
    } finally {
      // Clear UI state immediately to unlock the view
      setIsSubmitting(false);
      
      // Keep internal lock for 2 seconds to prevent rapid double-clicks
      setTimeout(() => {
        isActuallySubmitting.current = false;
      }, 2000);
    }
  }, [onSubmit, onSuccess, onError]);

  return {
    isSubmitting,
    handleSubmit
  };
}
