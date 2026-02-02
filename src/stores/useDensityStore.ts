import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DensityState {
    density: 'comfortable' | 'compact';
    setDensity: (density: 'comfortable' | 'compact') => void;
    toggleDensity: () => void;
}

export const useDensityStore = create<DensityState>()(
    persist(
        (set) => ({
            density: 'comfortable',
            setDensity: (density) => set({ density }),
            toggleDensity: () => set((state) => ({
                density: state.density === 'comfortable' ? 'compact' : 'comfortable'
            })),
        }),
        {
            name: 'mediahive-density-storage',
        }
    )
);
