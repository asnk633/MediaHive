import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UseFormStateOptions<T> {
  key: string;
  initialState: T;
}

interface DraftPayload<T> {
  timestamp: number;
  data: Partial<T>;
  dirtyKeys: (keyof T)[];
}

export function useFormState<T extends Record<string, any>>({ key, initialState }: UseFormStateOptions<T>) {
  const [state, setState] = useState<T>(initialState);
  const [isRestored, setIsRestored] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  
  // Use a ref to track the latest state for beforeunload
  const stateRef = useRef(state);
  // Keep initial state in a ref to compare against
  const initialRef = useRef(initialState);
  
  // Update ref whenever state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const getDirtyFields = useCallback((): Partial<T> => {
    const current = stateRef.current;
    const initial = initialRef.current;
    const dirty: Partial<T> = {};
    
    for (const k in current) {
      if (Object.prototype.hasOwnProperty.call(current, k)) {
        // Simple shallow comparison. For deep objects, this might need refinement,
        // but for standard form strings/booleans/arrays (via ref) it often suffices.
        // We'll stringify for a safer shallow check of arrays/objects if needed,
        // but direct equality is fine for primitives.
        if (JSON.stringify(current[k]) !== JSON.stringify(initial[k])) {
          dirty[k] = current[k];
        }
      }
    }
    return dirty;
  }, []);

  const saveDraft = useCallback(() => {
    try {
      const dirtyData = getDirtyFields();
      const dirtyKeys = Object.keys(dirtyData) as (keyof T)[];
      
      if (dirtyKeys.length === 0) return; // Nothing to save

      const payload: DraftPayload<T> = {
        timestamp: Date.now(),
        data: dirtyData,
        dirtyKeys
      };
      
      localStorage.setItem(key, JSON.stringify(payload));
      setIsDraftSaved(true);
      
      // Hide "Saved" indicator after a brief moment
      const hideTimer = setTimeout(() => setIsDraftSaved(false), 2000);
      return () => clearTimeout(hideTimer);
    } catch (e) {
      console.error("Failed to save draft", e);
    }
  }, [key, getDirtyFields]);

  // Load from draft on mount
  useEffect(() => {
    try {
      const draftStr = localStorage.getItem(key);
      if (draftStr) {
        const payload = JSON.parse(draftStr) as DraftPayload<T>;
        
        // Merge draft into initial form state. Do not override untouched fields.
        // The payload.data only contains fields that were dirty.
        setState((prev) => ({ ...initialRef.current, ...payload.data }));
        setIsRestored(true);
        toast.info("Draft restored", { duration: 2000 });
      }
    } catch (e) {
      console.error("Failed to restore draft", e);
    }
  }, [key]);

  // Debounced auto-save
  useEffect(() => {
    // Don't save immediately on mount if we just restored
    if (isRestored) {
        // Reset the flag so future changes trigger saves
        const timer = setTimeout(() => setIsRestored(false), 500);
        return () => clearTimeout(timer);
    }

    const handler = setTimeout(() => {
      saveDraft();
    }, 500);

    return () => clearTimeout(handler);
  }, [state, isRestored, saveDraft]);

  // Crash Safety: Save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveDraft(); // Use the same minimal draft logic
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveDraft]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error("Failed to clear draft", e);
    }
  }, [key]);

  const resetState = useCallback(() => {
    setState(initialRef.current);
  }, []);

  return {
    state,
    setState,
    isRestored,
    isDraftSaved,
    clearDraft,
    resetState
  };
}
