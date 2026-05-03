import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UseFormSubmitOptions<T> {
  onSubmit: (data: T) => Promise<void>;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}

export function useFormSubmit<T>({ onSubmit, onSuccess, onError }: UseFormSubmitOptions<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastSubmitTime = useRef<number>(0);

  const handleSubmit = useCallback(async (data: T) => {
    const now = Date.now();
    // STEP 2: Prevent duplicate clicks (debounce 1s)
    if (now - lastSubmitTime.current < 1000) {
      console.warn("Submission debounced (too fast)");
      return;
    }
    
    // STEP 3: Block duplicate mutation creation (prevent multiple inflight requests)
    if (isSubmitting) {
        console.warn("Submission already in progress");
        return;
    }

    lastSubmitTime.current = now;
    setIsSubmitting(true);

    try {
      await onSubmit(data);
      onSuccess?.();
    } catch (err: any) {
      console.error("Submission failed", err);
      // Only show toast if no custom error handler is provided, or let caller handle it.
      if (onError) {
        onError(err);
      } else {
        toast.error(err.message || "An error occurred during submission");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, onSuccess, onError, isSubmitting]);

  return {
    isSubmitting,
    handleSubmit
  };
}
