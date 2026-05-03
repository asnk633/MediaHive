import { Task } from "@/types";

export const TrashService = {
    getTrash: async (): Promise<Task[]> => {
        console.warn("TrashService.getTrash is stubbed out");
        return [];
    },
    restore: async (ids: string | string[]): Promise<void> => {
        console.warn("TrashService.restore is stubbed out", ids);
    },
    permanentDelete: async (ids: string | string[]): Promise<void> => {
        console.warn("TrashService.permanentDelete is stubbed out", ids);
    }
};
